'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import LoginGuard from '@/components/LoginGuard';
import { PROBLEMS, checkAnswer } from '@/lib/problems';
import { savePracticeAttempt } from '@/lib/firestore';

export default function PracticePage() {
  return (
    <LoginGuard>
      <PracticeContent />
    </LoginGuard>
  );
}

type Status = 'idle' | 'correct' | 'wrong';

function PracticeContent() {
  const { user } = useAuth();
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answer, setAnswer] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const [showHint, setShowHint] = useState(false);
  const [score, setScore] = useState(0);
  const [attempted, setAttempted] = useState<Set<number>>(new Set());
  const [wrongCount, setWrongCount] = useState(0);
  const [finished, setFinished] = useState(false);

  const problem = PROBLEMS[currentIdx];

  const handleSubmit = async () => {
    if (!answer.trim()) return;
    const correct = checkAnswer(problem.id, answer);
    setStatus(correct ? 'correct' : 'wrong');

    if (!attempted.has(currentIdx)) {
      setAttempted((prev) => new Set(prev).add(currentIdx));
      if (correct) setScore((s) => s + 10);
    }

    if (!correct) {
      setWrongCount((c) => c + 1);
    }

    if (user) {
      await savePracticeAttempt({
        userId: user.uid,
        userEmail: user.email ?? '',
        userName: user.displayName ?? '',
        problemId: problem.id,
        problemTitle: problem.title,
        userAnswer: answer,
        isCorrect: correct,
        score: correct ? 10 : 0,
      });
    }
  };

  const handleNext = () => {
    if (currentIdx < PROBLEMS.length - 1) {
      setCurrentIdx((i) => i + 1);
      setAnswer('');
      setStatus('idle');
      setShowHint(false);
      setWrongCount(0);
    } else {
      setFinished(true);
    }
  };

  const handleReset = () => {
    setCurrentIdx(0);
    setAnswer('');
    setStatus('idle');
    setShowHint(false);
    setScore(0);
    setAttempted(new Set());
    setWrongCount(0);
    setFinished(false);
  };

  if (finished) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12 text-center">
        <div className="text-7xl mb-4">🎉</div>
        <h2 className="text-3xl font-bold text-gray-800 mb-2">모든 문제 완료!</h2>
        <p className="text-gray-500 mb-6">총 {PROBLEMS.length}문제를 모두 풀었어요.</p>
        <div className="bg-blue-50 rounded-2xl p-8 mb-8 inline-block">
          <p className="text-5xl font-bold text-blue-600 mb-1">{score}점</p>
          <p className="text-gray-500 text-sm">/ {PROBLEMS.length * 10}점</p>
        </div>
        <div className="text-lg text-gray-600 mb-8">
          {score >= 90 ? '🌟 완벽해요! 대응관계 마스터!' :
           score >= 70 ? '😊 잘했어요! 조금만 더 연습해요!' :
           '💪 계속 연습하면 잘할 수 있어요!'}
        </div>
        <button
          onClick={handleReset}
          className="bg-blue-500 text-white px-8 py-3 rounded-xl font-semibold hover:bg-blue-600 transition-colors"
        >
          다시 도전하기
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">✏️ 대응관계 연습하기</h1>
          <p className="text-sm text-gray-500 mt-1">표를 보고 두 양 사이의 대응관계를 식으로 나타내어 보세요.</p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-blue-600">{score}점</div>
          <div className="text-xs text-gray-400">{currentIdx + 1} / {PROBLEMS.length}</div>
        </div>
      </div>

      {/* 내가 만드는 문제 배너 */}
      <Link
        href="/practice/custom"
        className="flex items-center justify-between bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-2xl px-5 py-4 mb-5 hover:from-purple-100 hover:to-blue-100 transition-all group"
      >
        <div className="flex items-center gap-3">
          <span className="text-2xl">🎨</span>
          <div>
            <p className="font-semibold text-gray-800 text-sm">내가 만드는 문제</p>
            <p className="text-xs text-gray-500">좋아하는 소재를 입력하면 AI가 문장제 문제를 만들어 드려요!</p>
          </div>
        </div>
        <span className="text-purple-400 group-hover:text-purple-600 font-medium text-sm">도전하기 →</span>
      </Link>

      {/* 진행 바 */}
      <div className="w-full bg-gray-200 rounded-full h-2 mb-6">
        <div
          className="bg-blue-500 h-2 rounded-full transition-all"
          style={{ width: `${((currentIdx) / PROBLEMS.length) * 100}%` }}
        />
      </div>

      {/* 문제 카드 */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-5">
        {/* 난이도 */}
        <div className="flex items-center gap-2 mb-4">
          <span className={`text-xs px-2 py-1 rounded-full font-medium ${
            problem.difficulty === 1 ? 'bg-green-100 text-green-700' :
            problem.difficulty === 2 ? 'bg-yellow-100 text-yellow-700' :
            'bg-red-100 text-red-700'
          }`}>
            {'⭐'.repeat(problem.difficulty)} 난이도 {problem.difficulty}
          </span>
          <span className="text-xs text-gray-400">{problem.title}</span>
        </div>

        <p className="text-base text-gray-700 mb-5 leading-relaxed">{problem.description}</p>

        {/* 표 */}
        <div className="overflow-x-auto mb-5">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr>
                <td className="bg-blue-50 border border-blue-200 px-4 py-2 font-semibold text-blue-700 text-center">
                  {problem.xLabel}
                </td>
                {problem.table.x.map((v) => (
                  <td key={v} className="border border-gray-200 px-4 py-2 text-center font-mono">{v}</td>
                ))}
              </tr>
              <tr>
                <td className="bg-purple-50 border border-purple-200 px-4 py-2 font-semibold text-purple-700 text-center">
                  {problem.yLabel}
                </td>
                {problem.table.y.map((v, i) => (
                  <td key={i} className="border border-gray-200 px-4 py-2 text-center font-mono">{v}</td>
                ))}
              </tr>
            </thead>
          </table>
        </div>

        {/* 힌트 */}
        {showHint && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3 mb-4 text-sm text-yellow-800">
            💡 <strong>힌트:</strong> {problem.hint}
          </div>
        )}

        {/* 입력 영역 */}
        <div className="space-y-3">
          <label className="block text-sm font-semibold text-gray-700">
            대응관계를 식으로 나타내기 (☐와 △ 사용)
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={answer}
              onChange={(e) => { setAnswer(e.target.value); setStatus('idle'); }}
              onKeyDown={(e) => e.key === 'Enter' && status === 'idle' && handleSubmit()}
              placeholder="예: △=☐×3"
              disabled={status === 'correct'}
              className="flex-1 border-2 border-gray-200 rounded-xl px-4 py-3 text-base font-mono focus:outline-none focus:border-blue-400 disabled:bg-gray-50"
            />
            {/* 기호 버튼 */}
            <div className="flex gap-1">
              {['☐', '△', '×', '÷', '+', '-', '='].map((sym) => (
                <button
                  key={sym}
                  onClick={() => setAnswer((a) => a + sym)}
                  disabled={status === 'correct'}
                  className="w-9 h-12 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-mono disabled:opacity-40 transition-colors"
                >
                  {sym}
                </button>
              ))}
            </div>
          </div>

          {/* 결과 피드백 */}
          {status === 'correct' && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-4">
              <p className="text-green-700 font-semibold mb-1">✅ 정답이에요! 잘했어요!</p>
              <p className="text-sm text-green-600">{problem.explanation}</p>
            </div>
          )}
          {status === 'wrong' && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3">
              <p className="text-red-600 font-semibold">❌ 틀렸어요. 다시 생각해 보세요!</p>
              {wrongCount >= 2 && (
                <p className="text-sm text-red-500 mt-1">힌트 버튼을 눌러보세요 💡</p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 버튼들 */}
      <div className="flex justify-between">
        <button
          onClick={() => setShowHint(true)}
          className="text-sm text-yellow-600 border border-yellow-300 bg-yellow-50 px-4 py-2 rounded-xl hover:bg-yellow-100 transition-colors"
        >
          💡 힌트 보기
        </button>
        <div className="flex gap-3">
          {status === 'idle' && (
            <button
              onClick={handleSubmit}
              disabled={!answer.trim()}
              className="bg-blue-500 text-white px-6 py-2 rounded-xl font-semibold hover:bg-blue-600 disabled:opacity-40 transition-colors"
            >
              확인하기
            </button>
          )}
          {(status === 'correct' || status === 'wrong') && (
            <>
              {status === 'wrong' && (
                <button
                  onClick={() => { setStatus('idle'); setAnswer(''); }}
                  className="border border-gray-300 text-gray-600 px-4 py-2 rounded-xl hover:bg-gray-50 transition-colors"
                >
                  다시 입력
                </button>
              )}
              <button
                onClick={handleNext}
                className="bg-green-500 text-white px-6 py-2 rounded-xl font-semibold hover:bg-green-600 transition-colors"
              >
                {currentIdx < PROBLEMS.length - 1 ? '다음 문제 →' : '결과 보기 🎉'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
