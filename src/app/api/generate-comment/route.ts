import Anthropic from '@anthropic-ai/sdk';
import { NextRequest, NextResponse } from 'next/server';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export interface StudentData {
  userName: string;
  totalScore: number;
  totalAttempts: number;
  correctCount: number;
  solvedProblems: number;
  totalProblems: number;
  chatCount: number;
  problemResults: Record<string, { correct: boolean; attempts: number; title: string }>;
  chatSummary: string; // 대화 내용 요약 (최근 메시지 발췌)
}

export async function POST(req: NextRequest) {
  try {
    const student: StudentData = await req.json();

    const accuracy = student.totalAttempts
      ? Math.round((student.correctCount / student.totalAttempts) * 100)
      : 0;

    // 수준 판단 (상/중/하)
    let level = '하';
    if (accuracy >= 80 && student.solvedProblems >= student.totalProblems * 0.7) level = '상';
    else if (accuracy >= 50 && student.solvedProblems >= student.totalProblems * 0.4) level = '중';

    // 틀린 문제 목록
    const wrongProblems = Object.entries(student.problemResults)
      .filter(([, r]) => !r.correct)
      .map(([, r]) => r.title);

    // 정답 문제 목록
    const correctProblems = Object.entries(student.problemResults)
      .filter(([, r]) => r.correct)
      .map(([, r]) => r.title);

    const prompt = `당신은 초등학교 교사입니다. 아래 학생의 수학 4단원(대응관계) 학습 데이터를 바탕으로 학교생활기록부에 들어갈 교과 평어를 작성해 주세요.

## 성취기준
[6수02-01] 한 양이 변할 때 다른 양이 그에 종속하여 변하는 대응관계를 나타낸 표에서 규칙을 찾아 설명하고, ☐, △ 등을 사용하여 식으로 나타낼 수 있다.

## 학생 학습 데이터
- 학생 이름: ${student.userName}
- 판단 수준: ${level} (상/중/하)
- 연습 문제 성취: ${student.solvedProblems}/${student.totalProblems}문제 정답
- 총 시도 횟수: ${student.totalAttempts}회 / 정답률: ${accuracy}%
- AI 챗봇 대화 횟수: ${student.chatCount}회
- 정답 처리된 문제: ${correctProblems.length > 0 ? correctProblems.join(', ') : '없음'}
- 미해결/오답 문제: ${wrongProblems.length > 0 ? wrongProblems.join(', ') : '없음'}
- 챗봇 대화 내용 요약: ${student.chatSummary || '대화 기록 없음'}

## 평어 작성 기준
수준별 뉘앙스를 반드시 반영하세요:
- 상: "교과 내용을 완벽히 이해하고 자기주도적 학습을 수행함. 창의적 문제 해결력과 실생활 적용 능력이 뛰어남."
- 중: "핵심 개념을 잘 파악하고 있으며, 과제를 성실하게 수행함. 모둠 활동 시 본인의 의견을 논리적으로 잘 표현함."
- 하: "기초적인 내용을 바탕으로 단순한 문제를 해결할 수 있음. 교사의 도움을 받아 과제를 해결하려는 의지를 보임."

## 작성 규칙
1. 학생부 평어 형식으로 작성 (2~4문장, 100~200자)
2. 학생 이름은 포함하지 않음 (주어 없이 서술)
3. 구체적인 학습 내용(대응관계, 식으로 나타내기 등)을 반드시 언급
4. 긍정적이고 발전적인 어조 유지
5. 챗봇을 활용한 자기주도 학습 노력도 반영
6. 한국어로 작성, 존댓말 사용 금지

평어만 출력하세요. 다른 설명이나 부가 내용 없이 평어 본문만 작성하세요.`;

    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 512,
      messages: [{ role: 'user', content: prompt }],
    });

    const comment = response.content[0].type === 'text' ? response.content[0].text.trim() : '';
    return NextResponse.json({ comment, level });
  } catch (e: unknown) {
    console.error('generate-comment error:', e);
    return NextResponse.json({ error: '평어 생성 중 오류가 발생했습니다.' }, { status: 500 });
  }
}
