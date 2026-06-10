'use client';

import { useState } from 'react';
import { getAllStudentsProgress, PracticeAttempt, ChatSession } from '@/lib/firestore';
import { PROBLEMS } from '@/lib/problems';
import { useAuth } from '@/contexts/AuthContext';

interface StudentSummary {
  userId: string;
  userName: string;
  userEmail: string;
  totalAttempts: number;
  correctCount: number;
  totalScore: number;
  lastActive: string;
  problemResults: Record<string, { correct: boolean; attempts: number }>;
  chatCount: number;
  chatSessions: ChatSession[];
}

type Tab = 'overview' | 'detail' | 'problems' | 'chat';
type SyncState = 'idle' | 'syncing' | 'done' | 'error';

export default function TeacherPage() {
  const { user, loading: authLoading, signInWithGoogle } = useAuth();
  const [password, setPassword] = useState('');
  const [authenticated, setAuthenticated] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [students, setStudents] = useState<StudentSummary[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<StudentSummary | null>(null);
  const [tab, setTab] = useState<Tab>('overview');
  const [syncState, setSyncState] = useState<SyncState>('idle');
  const [syncMsg, setSyncMsg] = useState('');

  const handleSyncSheets = async () => {
    setSyncState('syncing');
    setSyncMsg('');
    try {
      const res = await fetch('/api/sync-sheets', { method: 'POST' });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setSyncState('done');
      setSyncMsg(`✅ ${data.rowCount}개 메시지를 구글 시트에 기록했어요!`);
    } catch (e: unknown) {
      setSyncState('error');
      setSyncMsg(`❌ ${e instanceof Error ? e.message : '동기화 실패'}`);
    }
    setTimeout(() => { setSyncState('idle'); setSyncMsg(''); }, 5000);
  };

  const handleLogin = async () => {
    if (password === (process.env.NEXT_PUBLIC_TEACHER_PASSWORD || 'teacher1234')) {
      setAuthenticated(true);
      loadData();
    } else {
      setError('비밀번호가 틀렸습니다.');
    }
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const { attempts, chatSessions } = await getAllStudentsProgress();
      const map: Record<string, StudentSummary> = {};

      for (const a of attempts) {
        if (!map[a.userId]) {
          map[a.userId] = {
            userId: a.userId,
            userName: a.userName,
            userEmail: a.userEmail,
            totalAttempts: 0,
            correctCount: 0,
            totalScore: 0,
            lastActive: '',
            problemResults: {},
            chatCount: 0,
            chatSessions: [],
          };
        }
        const s = map[a.userId];
        s.totalAttempts++;
        if (a.isCorrect) { s.correctCount++; s.totalScore += a.score; }
        if (!s.problemResults[a.problemId]) {
          s.problemResults[a.problemId] = { correct: false, attempts: 0 };
        }
        s.problemResults[a.problemId].attempts++;
        if (a.isCorrect) s.problemResults[a.problemId].correct = true;
        const ts = (a.attemptedAt as unknown as { toDate?: () => Date })?.toDate?.();
        if (ts) {
          const d = ts.toLocaleDateString('ko-KR');
          if (!s.lastActive || d > s.lastActive) s.lastActive = d;
        }
      }

      // 채팅 세션을 학생별로 분류
      for (const c of chatSessions) {
        if (!map[c.userId]) {
          map[c.userId] = {
            userId: c.userId,
            userName: c.userName,
            userEmail: c.userEmail,
            totalAttempts: 0,
            correctCount: 0,
            totalScore: 0,
            lastActive: '',
            problemResults: {},
            chatCount: 0,
            chatSessions: [],
          };
        }
        map[c.userId].chatCount++;
        map[c.userId].chatSessions.push(c);
      }

      setStudents(Object.values(map).sort((a, b) => b.totalScore - a.totalScore));
    } catch (e: unknown) {
      console.error(e);
      const msg = e instanceof Error ? e.message : String(e);
      setError(`데이터 로드 오류: ${msg}`);
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-10 h-10 border-4 border-purple-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-indigo-100">
        <div className="bg-white rounded-2xl shadow-xl p-10 max-w-sm w-full text-center">
          <div className="text-5xl mb-4">👨‍🏫</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">교사용 페이지</h2>
          <p className="text-gray-500 text-sm mb-6">
            먼저 구글 계정으로 로그인해 주세요.<br />
            이후 교사 비밀번호를 입력하면 대시보드에 접속할 수 있습니다.
          </p>
          <button
            onClick={signInWithGoogle}
            className="w-full flex items-center justify-center gap-3 bg-white border-2 border-gray-200 rounded-xl py-3 px-6 font-semibold text-gray-700 hover:bg-gray-50 hover:border-purple-300 transition-all shadow-sm"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            구글 계정으로 로그인
          </button>
        </div>
      </div>
    );
  }

  if (!authenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-indigo-100">
        <div className="bg-white rounded-2xl shadow-xl p-10 max-w-sm w-full text-center">
          <div className="text-5xl mb-4">🔐</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-1">교사 인증</h2>
          <p className="text-gray-400 text-sm mb-6">{user.email} 로 로그인됨</p>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
            placeholder="교사 비밀번호 입력"
            className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 mb-3 focus:outline-none focus:border-purple-400"
          />
          {error && <p className="text-red-500 text-sm mb-3">{error}</p>}
          <button
            onClick={handleLogin}
            className="w-full bg-purple-500 text-white py-3 rounded-xl font-semibold hover:bg-purple-600 transition-colors"
          >
            대시보드 열기
          </button>
        </div>
      </div>
    );
  }

  const TABS: { key: Tab; label: string }[] = [
    { key: 'overview', label: '📊 학생 현황' },
    { key: 'detail',   label: '📋 상세 보기' },
    { key: 'problems', label: '📝 문제별 분석' },
    { key: 'chat',     label: '💬 대화 내용' },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <div className="flex items-start justify-between mb-6 gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">👨‍🏫 교사용 대시보드</h1>
          <p className="text-sm text-gray-500 mt-1">학생 개별 학습 현황 및 성취도</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {/* 구글 시트 동기화 버튼 */}
          <div className="flex flex-col items-end gap-1">
            <button
              onClick={handleSyncSheets}
              disabled={syncState === 'syncing'}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                syncState === 'syncing'
                  ? 'bg-green-100 text-green-600 cursor-wait'
                  : syncState === 'done'
                  ? 'bg-green-500 text-white'
                  : syncState === 'error'
                  ? 'bg-red-100 text-red-600'
                  : 'bg-green-50 text-green-700 border border-green-300 hover:bg-green-100'
              }`}
            >
              {syncState === 'syncing' ? (
                <><span className="w-4 h-4 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />동기화 중...</>
              ) : (
                <>
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 14H7v-2h5v2zm5-4H7v-2h10v2zm0-4H7V7h10v2z"/>
                  </svg>
                  구글 시트 동기화
                </>
              )}
            </button>
            {syncMsg && (
              <p className={`text-xs ${syncState === 'error' ? 'text-red-500' : 'text-green-600'}`}>
                {syncMsg}
              </p>
            )}
          </div>
          <button
            onClick={loadData}
            className="text-sm text-purple-600 border border-purple-300 px-4 py-2 rounded-xl hover:bg-purple-50 transition-colors"
          >
            🔄 새로고침
          </button>
        </div>
      </div>

      <div className="flex gap-2 mb-6 flex-wrap">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
              tab === t.key ? 'bg-purple-500 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-20">
          <div className="w-10 h-10 border-4 border-purple-400 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-400">데이터를 불러오는 중...</p>
        </div>
      ) : error && students.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-red-500 mb-4">{error}</p>
          <button onClick={loadData} className="text-purple-600 border border-purple-300 px-4 py-2 rounded-xl hover:bg-purple-50">
            다시 시도
          </button>
        </div>
      ) : students.length === 0 ? (
        <div className="text-center py-20">
          <div className="text-5xl mb-4">📭</div>
          <p className="text-gray-500">아직 학습 데이터가 없어요.</p>
          <p className="text-sm text-gray-400 mt-1">학생들이 챗봇을 사용하거나 연습 문제를 풀면 여기에 표시됩니다.</p>
        </div>
      ) : (
        <>
          {tab === 'overview'  && <OverviewTab students={students} onSelect={(s) => { setSelectedStudent(s); setTab('detail'); }} />}
          {tab === 'detail'    && <DetailTab students={students} selected={selectedStudent} onSelect={setSelectedStudent} />}
          {tab === 'problems'  && <ProblemsTab students={students} />}
          {tab === 'chat'      && <ChatTab students={students} selected={selectedStudent} onSelect={setSelectedStudent} />}
        </>
      )}
    </div>
  );
}

/* ───────────────────────── Overview Tab ───────────────────────── */
function OverviewTab({ students, onSelect }: { students: StudentSummary[]; onSelect: (s: StudentSummary) => void }) {
  const total = students.length;
  const avgScore = students.reduce((a, s) => a + s.totalScore, 0) / Math.max(total, 1);
  const avgAcc   = students.reduce((a, s) => a + (s.totalAttempts ? s.correctCount / s.totalAttempts * 100 : 0), 0) / Math.max(total, 1);

  return (
    <div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: '참여 학생',    value: `${total}명`,                   icon: '👥' },
          { label: '평균 점수',    value: `${avgScore.toFixed(0)}점`,     icon: '📈' },
          { label: '평균 정답률',  value: `${avgAcc.toFixed(1)}%`,        icon: '✅' },
          { label: '총 채팅 횟수', value: `${students.reduce((a, s) => a + s.chatCount, 0)}회`, icon: '💬' },
        ].map((c) => (
          <div key={c.label} className="bg-white rounded-2xl border border-gray-100 p-5">
            <div className="text-2xl mb-1">{c.icon}</div>
            <div className="text-2xl font-bold text-gray-800">{c.value}</div>
            <div className="text-xs text-gray-400 mt-1">{c.label}</div>
          </div>
        ))}
      </div>
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              {['순위','학생','점수','정답률','시도 수','챗봇 대화','마지막 활동'].map((h) => (
                <th key={h} className={`${h === '순위' || h === '학생' ? 'text-left' : 'text-center'} px-4 py-3 text-gray-500 font-medium`}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {students.map((s, i) => {
              const acc = s.totalAttempts ? (s.correctCount / s.totalAttempts * 100) : 0;
              return (
                <tr key={s.userId} className="border-b border-gray-50 hover:bg-purple-50 cursor-pointer transition-colors" onClick={() => onSelect(s)}>
                  <td className="px-4 py-3 text-gray-400 font-mono">#{i+1}</td>
                  <td className="px-4 py-3">
                    <div className="font-semibold text-gray-800">{s.userName || '이름 없음'}</div>
                    <div className="text-xs text-gray-400">{s.userEmail}</div>
                  </td>
                  <td className="px-4 py-3 text-center font-bold text-blue-600">{s.totalScore}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${acc >= 80 ? 'bg-green-100 text-green-700' : acc >= 50 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
                      {acc.toFixed(0)}%
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center text-gray-600">{s.totalAttempts}</td>
                  <td className="px-4 py-3 text-center text-gray-600">{s.chatCount}회</td>
                  <td className="px-4 py-3 text-center text-gray-400 text-xs">{s.lastActive || '-'}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ───────────────────────── Detail Tab ───────────────────────── */
function DetailTab({ students, selected, onSelect }: { students: StudentSummary[]; selected: StudentSummary | null; onSelect: (s: StudentSummary) => void }) {
  const s = selected || students[0];
  if (!s) return null;
  const acc = s.totalAttempts ? (s.correctCount / s.totalAttempts * 100) : 0;
  const solved = PROBLEMS.filter((p) => s.problemResults[p.id]?.correct).length;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
      <StudentList students={students} selectedId={s.userId} onSelect={onSelect} />
      <div className="md:col-span-2 space-y-4">
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center text-2xl">👤</div>
            <div>
              <h2 className="text-lg font-bold text-gray-800">{s.userName}</h2>
              <p className="text-sm text-gray-400">{s.userEmail}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: '총점',      value: `${s.totalScore}점` },
              { label: '정답률',    value: `${acc.toFixed(0)}%` },
              { label: '풀이 문제', value: `${solved}/${PROBLEMS.length}` },
              { label: '챗봇 대화', value: `${s.chatCount}회` },
            ].map((item) => (
              <div key={item.label} className="bg-gray-50 rounded-xl p-3 text-center">
                <div className="text-xl font-bold text-gray-800">{item.value}</div>
                <div className="text-xs text-gray-400 mt-1">{item.label}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">문제별 결과</h3>
          <div className="space-y-2">
            {PROBLEMS.map((p) => {
              const r = s.problemResults[p.id];
              return (
                <div key={p.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                  <div className="flex items-center gap-2">
                    <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs ${r?.correct ? 'bg-green-100 text-green-600' : r ? 'bg-red-100 text-red-500' : 'bg-gray-100 text-gray-400'}`}>
                      {r?.correct ? '✓' : r ? '✗' : '—'}
                    </span>
                    <span className="text-sm text-gray-700">{p.title}</span>
                  </div>
                  <div className="text-xs text-gray-400">{r ? `${r.attempts}회 시도` : '미풀이'}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ───────────────────────── Problems Tab ───────────────────────── */
function ProblemsTab({ students }: { students: StudentSummary[] }) {
  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-500">각 문제의 학급 전체 정답률을 확인합니다.</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {PROBLEMS.map((p) => {
          const attempted = students.filter((s) => s.problemResults[p.id]);
          const correct   = students.filter((s) => s.problemResults[p.id]?.correct);
          const rate = attempted.length ? (correct.length / attempted.length * 100) : 0;
          return (
            <div key={p.id} className="bg-white rounded-2xl border border-gray-100 p-5">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-gray-800 text-sm">{p.title}</h3>
                  <p className="text-xs text-gray-400 mt-0.5">난이도 {'⭐'.repeat(p.difficulty)}</p>
                </div>
                <span className={`text-sm font-bold px-2 py-0.5 rounded-full ${rate >= 80 ? 'bg-green-100 text-green-700' : rate >= 50 ? 'bg-yellow-100 text-yellow-700' : attempted.length ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-400'}`}>
                  {attempted.length ? `${rate.toFixed(0)}%` : '미풀이'}
                </span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2 mb-2">
                <div className={`h-2 rounded-full ${rate >= 80 ? 'bg-green-400' : rate >= 50 ? 'bg-yellow-400' : 'bg-red-400'}`} style={{ width: `${rate}%` }} />
              </div>
              <p className="text-xs text-gray-400">{correct.length}/{attempted.length}명 정답 ({students.length - attempted.length}명 미풀이)</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ───────────────────────── Chat Tab ───────────────────────── */
function ChatTab({ students, selected, onSelect }: { students: StudentSummary[]; selected: StudentSummary | null; onSelect: (s: StudentSummary) => void }) {
  const s = selected || students.find((st) => st.chatSessions.length > 0) || students[0];
  const [openSession, setOpenSession] = useState<string | null>(null);

  if (!s) return null;

  const sessions = s.chatSessions;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
      {/* 학생 목록 */}
      <StudentList students={students} selectedId={s.userId} onSelect={(st) => { onSelect(st); setOpenSession(null); }} />

      {/* 대화 세션 목록 + 내용 */}
      <div className="md:col-span-2 space-y-3">
        {/* 학생 헤더 */}
        <div className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-xl">👤</div>
          <div>
            <p className="font-semibold text-gray-800">{s.userName || '이름 없음'}</p>
            <p className="text-xs text-gray-400">{s.userEmail} · 대화 세션 {sessions.length}개</p>
          </div>
        </div>

        {sessions.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center">
            <p className="text-4xl mb-3">💬</p>
            <p className="text-gray-500 text-sm">이 학생의 대화 기록이 없어요.</p>
          </div>
        ) : (
          sessions.map((session, idx) => {
            const isOpen = openSession === session.id;
            const firstMsg = session.messages?.find((m) => m.role === 'user');
            const ts = (session.updatedAt as unknown as { toDate?: () => Date })?.toDate?.();
            const dateStr = ts ? ts.toLocaleString('ko-KR') : '';
            const msgCount = session.messages?.length ?? 0;

            return (
              <div key={session.id ?? idx} className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                {/* 세션 헤더 (클릭으로 펼치기) */}
                <button
                  className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors text-left"
                  onClick={() => setOpenSession(isOpen ? null : (session.id ?? String(idx)))}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                      {idx + 1}
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">
                        {firstMsg?.content.slice(0, 40) ?? '(내용 없음)'}
                        {(firstMsg?.content.length ?? 0) > 40 && '...'}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">{dateStr} · {msgCount}개 메시지</p>
                    </div>
                  </div>
                  <span className={`text-gray-400 transition-transform flex-shrink-0 ml-3 ${isOpen ? 'rotate-180' : ''}`}>▼</span>
                </button>

                {/* 펼쳐진 대화 내용 */}
                {isOpen && (
                  <div className="border-t border-gray-100 px-5 py-4 space-y-3 max-h-[500px] overflow-y-auto bg-gray-50">
                    {session.messages?.map((msg, mi) => (
                      <div key={mi} className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        {msg.role === 'assistant' && (
                          <div className="w-7 h-7 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs flex-shrink-0 mt-1">🤖</div>
                        )}
                        <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap ${
                          msg.role === 'user'
                            ? 'bg-blue-500 text-white rounded-tr-sm'
                            : 'bg-white text-gray-800 border border-gray-200 rounded-tl-sm'
                        }`}>
                          {msg.content}
                        </div>
                        {msg.role === 'user' && (
                          <div className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center text-xs flex-shrink-0 mt-1">👤</div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

/* ───────────────────────── 공통: 학생 목록 사이드바 ───────────────────────── */
function StudentList({ students, selectedId, onSelect }: {
  students: StudentSummary[];
  selectedId: string;
  onSelect: (s: StudentSummary) => void;
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-4">
      <h3 className="text-sm font-semibold text-gray-500 mb-3">학생 목록</h3>
      <div className="space-y-1.5">
        {students.map((student) => (
          <button
            key={student.userId}
            onClick={() => onSelect(student)}
            className={`w-full text-left px-3 py-2.5 rounded-xl text-sm transition-colors ${
              student.userId === selectedId
                ? 'bg-purple-100 text-purple-700'
                : 'hover:bg-gray-50 text-gray-600'
            }`}
          >
            <div className="font-medium">{student.userName || '이름 없음'}</div>
            <div className="text-xs opacity-60 mt-0.5">
              {student.totalScore}점 · 대화 {student.chatCount}회
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
