'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import LoginGuard from '@/components/LoginGuard';
import { savePracticeAttempt } from '@/lib/firestore';
import Link from 'next/link';

interface GeneratedProblem {
  relation: string;
  operand: number;
  operator: string;
  story: string;
  tableX: number[];
  tableY: number[];
  question: string;
  correctFormulas: string[];
  explanation: string;
  xLabel: string;
  yLabel: string;
}

const EXAMPLES = [
  { item1: '안경', item2: '안경다리' },
  { item1: '자동차', item2: '바퀴' },
  { item1: '손', item2: '손가락' },
  { item1: '꽃', item2: '꽃잎' },
  { item1: '문어', item2: '다리' },
  { item1: '나이', item2: '학년' },
];

export default function CustomPracticePage() {
  return (
    <LoginGuard>
      <CustomPracticeContent />
    </LoginGuard>
  );
}

type Status = 'idle' | 'correct' | 'wrong';

function CustomPracticeContent() {
  const { user } = useAuth();
  const [item1, setItem1] = useState('');
  const [item2, setItem2] = useState('');
  const [generating, setGenerating] = useState(false);
  const [problem, setProblem] = useState<GeneratedProblem | null>(null);
  const [error, setError] = useState('');
  const [answer, setAnswer] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const [showHint, setShowHint] = useState(false);
  const [history, setHistory] = useState<{ item1: string; item2: string; correct: boolean }[]>([]);

  const handleGenerate = async () => {
    if (!item1.trim() || !item2.trim()) return;
    setGenerating(true);
    setError('');
    setProblem(null);
    setAnswer('');
    setStatus('idle');
    setShowHint(false);

    try {
      const res = await fetch('/api/generate-problem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ item1: item1.trim(), item2: item2.trim() }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setProblem(data);
    } catch {
      setError('문제 생성에 실패했어요. 다시 시도해 주세요.');
    } finally {
      setGenerating(false);
    }
  };

  const handleExample = (ex: { item1: string; item2: string }) => {
    setItem1(ex.item1);
    setItem2(ex.item2);
  };

  const checkAnswer = () => {
    if (!problem || !answer.trim()) return;
    const normalized = answer.replace(/\s/g, '').replace(/×/g, '*').replace(/÷/g, '/');
    const correct = problem.correctFormulas.some(
      (f) => f.replace(/\s/g, '').replace(/×/g, '*').replace(/÷/g, '/') === normalized
    );
    setStatus(correct ? 'correct' : 'wrong');

    if (user) {
      savePracticeAttempt({
        userId: user.uid,
        userEmail: user.email ?? '',
        userName: user.displayName ?? '',
        problemId: `custom_${item1}_${item2}`,
        problemTitle: `내가 만든 문제: ${item1}와 ${item2}`,
        userAnswer: answer,
        isCorrect: correct,
        score: correct ? 10 : 0,
      });
    }

    if (correct) {
      setHistory((h) => [{ item1, item2, correct: true }, ...h.slice(0, 9)]);
    }
  };

  const handleReset = () => {
    setProblem(null);
    setAnswer('');
    setStatus('idle');
    setShowHint(false);
    setItem1('');
    setItem2('');
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      {/* 헤더 */}
      <div className="flex items-center gap-3 mb-6">
        <Link href="/practice" className="text-gray-400 hover:text-gray-600 transition-colors">
          ← 연습하기
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-800">🎨 내가 만드는 문제</h1>
          <p className="text-sm text-gray-500 mt-0.5">생활 속 소재를 입력하면 AI가 대응관계 문제를 만들어 드려요!</p>
        </div>
      </div>

      {/* 소재 입력 */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-5">
        <h2 className="text-base font-semibold text-gray-700 mb-4">✏️ 두 양의 소재를 입력하세요</h2>

        {/* 예시 버튼 */}
        <div className="flex flex-wrap gap-2 mb-4">
          {EXAMPLES.map((ex) => (
            <button
              key={ex.item1}
              onClick={() => handleExample(ex)}
              className="text-xs bg-blue-50 text-blue-600 border border-blue-200 rounded-full px-3 py-1 hover:bg-blue-100 transition-colors"
            >
              {ex.item1} / {ex.item2}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3 mb-4">
          <div className="flex-1">
            <label className="text-xs text-gray-500 mb-1 block">첫 번째 양 (☐)</label>
            <input
              type="text"
              value={item1}
              onChange={(e) => setItem1(e.target.value)}
              placeholder="예: 안경"
              className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-400 text-center text-lg font-medium"
            />
          </div>
          <div className="text-2xl text-gray-300 mt-5">↔</div>
          <div className="flex-1">
            <label className="text-xs text-gray-500 mb-1 block">두 번째 양 (△)</label>
            <input
              type="text"
              value={item2}
              onChange={(e) => setItem2(e.target.value)}
              placeholder="예: 안경다리"
              className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-purple-400 text-center text-lg font-medium"
            />
          </div>
        </div>

        <button
          onClick={handleGenerate}
          disabled={generating || !item1.trim() || !item2.trim()}
          className="w-full bg-gradient-to-r from-blue-500 to-purple-500 text-white py-3 rounded-xl font-semibold hover:opacity-90 disabled:opacity-40 transition-all flex items-center justify-center gap-2"
        >
          {generating ? (
            <>
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              AI가 문제를 만드는 중...
            </>
          ) : (
            '✨ 문제 만들기'
          )}
        </button>
        {error && <p className="text-red-500 text-sm mt-3 text-center">{error}</p>}
      </div>

      {/* 생성된 문제 */}
      {problem && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-5">
          {/* 스토리 */}
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-4 mb-5 text-sm text-gray-700 leading-relaxed">
            📖 {problem.story}
          </div>

          {/* 관계식 미리보기 */}
          <div className="flex items-center justify-center gap-3 mb-5 py-3 bg-gray-50 rounded-xl">
            <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-lg font-semibold text-sm">{item1} = ☐</span>
            <span className="text-2xl text-gray-400">{problem.operator}</span>
            <span className="bg-purple-100 text-purple-700 px-3 py-1 rounded-lg font-semibold text-sm">{problem.operand}</span>
            <span className="text-2xl text-gray-400">=</span>
            <span className="bg-green-100 text-green-700 px-3 py-1 rounded-lg font-semibold text-sm">{item2} = △</span>
          </div>

          {/* 표 */}
          <div className="overflow-x-auto mb-5">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr>
                  <td className="bg-blue-50 border border-blue-200 px-4 py-2 font-semibold text-blue-700 text-center">
                    {problem.xLabel}
                  </td>
                  {problem.tableX.map((v, i) => (
                    <td key={i} className="border border-gray-200 px-4 py-2 text-center font-mono">{v}</td>
                  ))}
                </tr>
                <tr>
                  <td className="bg-purple-50 border border-purple-200 px-4 py-2 font-semibold text-purple-700 text-center">
                    {problem.yLabel}
                  </td>
                  {problem.tableY.map((v, i) => (
                    <td key={i} className="border border-gray-200 px-4 py-2 text-center font-mono">{v}</td>
                  ))}
                </tr>
              </thead>
            </table>
          </div>

          {/* 문제 */}
          <p className="text-sm font-semibold text-gray-700 mb-4">❓ {problem.question}</p>

          {/* 힌트 */}
          {showHint && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3 mb-4 text-sm text-yellow-800">
              💡 <strong>힌트:</strong> {item1} 수(☐)에 {problem.operand}을(를) {
                problem.operator === '×' ? '곱하면' :
                problem.operator === '÷' ? '나누면' :
                problem.operator === '+' ? '더하면' : '빼면'
              } {item2} 수(△)가 돼요.
            </div>
          )}

          {/* 입력 */}
          <div className="space-y-3">
            <div className="flex gap-2">
              <input
                type="text"
                value={answer}
                onChange={(e) => { setAnswer(e.target.value); setStatus('idle'); }}
                onKeyDown={(e) => e.key === 'Enter' && status === 'idle' && checkAnswer()}
                placeholder="예: △=☐×2"
                disabled={status === 'correct'}
                className="flex-1 border-2 border-gray-200 rounded-xl px-4 py-3 text-base font-mono focus:outline-none focus:border-blue-400 disabled:bg-gray-50"
              />
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

            {status === 'correct' && (
              <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                <p className="text-green-700 font-semibold mb-1">✅ 정답이에요! 훌륭해요!</p>
                <p className="text-sm text-green-600">{problem.explanation}</p>
              </div>
            )}
            {status === 'wrong' && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-3">
                <p className="text-red-600 font-semibold">❌ 틀렸어요. 표를 다시 살펴보세요!</p>
              </div>
            )}
          </div>

          {/* 버튼 */}
          <div className="flex justify-between mt-4">
            <div className="flex gap-2">
              <button
                onClick={() => setShowHint(true)}
                className="text-sm text-yellow-600 border border-yellow-300 bg-yellow-50 px-4 py-2 rounded-xl hover:bg-yellow-100 transition-colors"
              >
                💡 힌트
              </button>
              <button
                onClick={handleReset}
                className="text-sm text-gray-500 border border-gray-300 px-4 py-2 rounded-xl hover:bg-gray-50 transition-colors"
              >
                🔄 새 소재로
              </button>
            </div>
            {status === 'idle' && (
              <button
                onClick={checkAnswer}
                disabled={!answer.trim()}
                className="bg-blue-500 text-white px-6 py-2 rounded-xl font-semibold hover:bg-blue-600 disabled:opacity-40 transition-colors"
              >
                확인하기
              </button>
            )}
            {status === 'correct' && (
              <button
                onClick={handleReset}
                className="bg-green-500 text-white px-6 py-2 rounded-xl font-semibold hover:bg-green-600 transition-colors"
              >
                다른 소재 도전 →
              </button>
            )}
            {status === 'wrong' && (
              <button
                onClick={() => { setStatus('idle'); setAnswer(''); }}
                className="border border-gray-300 text-gray-600 px-4 py-2 rounded-xl hover:bg-gray-50 transition-colors"
              >
                다시 입력
              </button>
            )}
          </div>
        </div>
      )}

      {/* 히스토리 */}
      {history.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <h3 className="text-sm font-semibold text-gray-600 mb-3">📚 내가 만든 문제 기록</h3>
          <div className="flex flex-wrap gap-2">
            {history.map((h, i) => (
              <span
                key={i}
                className="text-xs bg-green-50 text-green-700 border border-green-200 rounded-full px-3 py-1"
              >
                ✓ {h.item1} / {h.item2}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
