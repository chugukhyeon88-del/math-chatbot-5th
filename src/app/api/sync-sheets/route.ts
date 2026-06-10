import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// Firebase Admin 초기화 (서버 전용)
function getAdminDb() {
  if (!getApps().length) {
    initializeApp({
      credential: cert({
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      }),
    });
  }
  return getFirestore();
}

// Google Sheets 인증
function getSheetsClient() {
  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      private_key: process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    },
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
  return google.sheets({ version: 'v4', auth });
}

export async function POST(req: NextRequest) {
  // ── 환경변수 체크 ──
  const missing = [
    'GOOGLE_SHEETS_ID',
    'GOOGLE_SERVICE_ACCOUNT_EMAIL',
    'GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY',
    'FIREBASE_ADMIN_CLIENT_EMAIL',
    'FIREBASE_ADMIN_PRIVATE_KEY',
  ].filter((k) => !process.env[k]);
  if (missing.length > 0) {
    return NextResponse.json({ error: `환경변수 누락: ${missing.join(', ')}` }, { status: 400 });
  }

  try {
    const spreadsheetId = process.env.GOOGLE_SHEETS_ID!;

    // ── STEP 1: Firebase Admin으로 Firestore 읽기 ──
    let chatSnap;
    try {
      const db = getAdminDb();
      chatSnap = await db.collection('chatSessions').get();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      return NextResponse.json({ error: `[Firestore 오류] ${msg}` }, { status: 500 });
    }

    type Message = { role: string; content: string };
    const rows: (string | number)[][] = [];
    for (const doc of chatSnap.docs) {
      const data = doc.data();
      const messages: Message[] = data.messages ?? [];
      const updatedAt = data.updatedAt?.toDate?.()?.toLocaleString('ko-KR') ?? '';

      messages.forEach((msg, idx) => {
        if (msg.role === 'assistant' && idx === 0) return; // 웰컴 메시지 제외
        rows.push([
          updatedAt,
          data.userName ?? '',
          data.userEmail ?? '',
          doc.id,
          msg.role === 'user' ? '학생' : 'AI',
          msg.content,
        ]);
      });
    }

    // ── STEP 2: Google Sheets 접근 ──
    let sheets;
    let meta;
    try {
      sheets = getSheetsClient();
      meta = await sheets.spreadsheets.get({ spreadsheetId });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      return NextResponse.json({
        error: `[Google Sheets 오류] ${msg} — 서비스 계정이 시트에 편집자로 공유되어 있는지, Sheets API가 활성화되어 있는지 확인하세요.`,
      }, { status: 500 });
    }

    const sheetTitle = '대화기록';
    const sheetNames = meta.data.sheets?.map((s) => s.properties?.title) ?? [];

    // 시트가 없으면 생성
    if (!sheetNames.includes(sheetTitle)) {
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId,
        requestBody: {
          requests: [{ addSheet: { properties: { title: sheetTitle } } }],
        },
      });
    }

    // 기존 내용 전체 지우기
    await sheets.spreadsheets.values.clear({
      spreadsheetId,
      range: `${sheetTitle}!A:Z`,
    });

    // 헤더 + 데이터 쓰기
    const header = ['날짜/시간', '학생 이름', '이메일', '세션 ID', '역할', '메시지 내용'];
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `${sheetTitle}!A1`,
      valueInputOption: 'RAW',
      requestBody: { values: [header, ...rows] },
    });

    // 헤더 스타일 (볼드 + 배경색)
    const sheetId = meta.data.sheets?.find((s) => s.properties?.title === sheetTitle)
      ?.properties?.sheetId ?? 0;

    await sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: {
        requests: [
          {
            repeatCell: {
              range: { sheetId, startRowIndex: 0, endRowIndex: 1, startColumnIndex: 0, endColumnIndex: 6 },
              cell: {
                userEnteredFormat: {
                  backgroundColor: { red: 0.18, green: 0.46, blue: 0.71 },
                  textFormat: { bold: true, foregroundColor: { red: 1, green: 1, blue: 1 } },
                  horizontalAlignment: 'CENTER',
                },
              },
              fields: 'userEnteredFormat(backgroundColor,textFormat,horizontalAlignment)',
            },
          },
          {
            autoResizeDimensions: {
              dimensions: { sheetId, dimension: 'COLUMNS', startIndex: 0, endIndex: 6 },
            },
          },
        ],
      },
    });

    return NextResponse.json({ success: true, rowCount: rows.length });
  } catch (e: unknown) {
    console.error('sync-sheets error:', e);
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
