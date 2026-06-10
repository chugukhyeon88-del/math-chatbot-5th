'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import LoginGuard from '@/components/LoginGuard';
import { savePracticeAttempt } from '@/lib/firestore';
import Link from 'next/link';

interface GeneratedProblem {
  operand: number;
  operator: string;
  story: string;
  question: string;
  tableX: number[];
  tableY: number[];
  xLabel: string;
  yLabel: string;
  explanation: string;
}

const SYMBOL_OPTIONS = ['☐', '△', '○', '☆', '♡', '◇', '□', '▲'];

const EXAMPLES = [
  { item1: '안경', item2: '안경다리' },
  { item1: '자동차', item2: '바퀴' },
  { item1: '문어', item2: '다리' },
  { item1: '꽃', item2: '꽃잎' },
  { item1: '거문고', item2: '줄' },
  { item1: '축구공', item2: '오각형 무늬' },
];

type Step = 'input' | 'choose-symbol' | 'solve';

export default function CustomPracticePage() {
  return (
    <LoginGuard>
      <CustomPracticeContent />
    </LoginGuard>
  );
}

function CustomPracticeContent() {
  const { user } = useAuth();
  const [item1, setItem1] = useState('');
  const [item2, setItem2] = useState('');
  const [generating, setGenerating] = useState(false);
  const [problem, setProblem] = useState<GeneratedProblem | null>(null);
  const [error, setError] = useState('');
  const [step, setStep] = useState<Step>('input');

  const [sym1, setSym1] = useState('☐');
  const [sym2, setSym2] = useState('△');

  const [answer, setAnswer] = useState('');
  const [status, setStatus] = useState<'idle' | 'correct' | 'wrong'>('idle');
  const [showHint, setShowHint] = useState(false);
  const [history, setHistory] = useState<{ item1: string; item2: string }[]>([]);

  const handleGenerate = async () => {
    if (!item1.trim() || !item2.trim()) return;
    setGenerating(true);
    setError('');
    try {
      const res = await fetch('/api/generate-problem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ item1: item1.trim(), item2: item2.trim() }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setProblem(data);
      setSym1('☐');
      setSym2('△');
      setStep('choose-symbol');
    } catch {
      setError('문제 생성에 실패했어요. 다시 시도해 주세요.');
    } finally {
      setGenerating(false);
    }
  };

  const handleStartSolve = () => {
    if (sym1 === sym2) {
      alert('두 기호가 같으면 안 돼요! 다른 기호를 선택해 주세요.');
      return;
    }
    setAnswer('');
    setStatus('idle');
    setShowHint(false);
    setStep('solve');
  };

  // 연산자·공백을 통일해서 비교
  const norm = (s: string) =>
    s.replace(/\s/g, '').replace(/×/g, '*').replace(/÷/g, '/');

  const buildCorrectFormulas = () => {
    if (!problem) return [];
    const op = problem.operator;
    const n = problem.operand;
    const s1 = sym1; // 기준 양 기호
    const s2 = sym2; // 결과 양 기호
    const forms: string[] = [];

    if (op === '×' || op === '*') {
      // △=☐×n  /  ☐×n=△  /  n×☐=△
      forms.push(
        `${s2}=${s1}×${n}`, `${s2}=${s1}*${n}`,
        `${s1}×${n}=${s2}`, `${s1}*${n}=${s2}`,
        `${s2}=${n}×${s1}`, `${s2}=${n}*${s1}`,
        `${n}×${s1}=${s2}`, `${n}*${s1}=${s2}`,
      );
    } else if (op === '÷' || op === '/') {
      // △=☐÷n  /  ☐÷n=△  /  반대로 ☐=△×n
      forms.push(
        `${s2}=${s1}÷${n}`, `${s2}=${s1}/${n}`,
        `${s1}÷${n}=${s2}`, `${s1}/${n}=${s2}`,
        `${s1}=${s2}×${n}`, `${s1}=${s2}*${n}`,
        `${s2}×${n}=${s1}`, `${s2}*${n}=${s1}`,
        `${s1}=${n}×${s2}`, `${s1}=${n}*${s2}`,
      );
    } else if (op === '+') {
      // △=☐+n  /  ☐+n=△  /  n+☐=△
      forms.push(
        `${s2}=${s1}+${n}`, `${s1}+${n}=${s2}`,
        `${s2}=${n}+${s1}`, `${n}+${s1}=${s2}`,
      );
    } else if (op === '-') {
      // △=☐-n  /  ☐-n=△  /  반대로 ☐=△+n
      forms.push(
        `${s2}=${s1}-${n}`, `${s1}-${n}=${s2}`,
        `${s1}=${s2}+${n}`, `${s2}+${n}=${s1}`,
        `${n}+${s2}=${s1}`, `${s1}=${n}+${s2}`,
      );
    }
    return forms;
  };

  const checkAnswer = () => {
    if (!problem || !answer.trim()) return;
    const correct = buildCorrectFormulas().some((f) => norm(f) === norm(answer));
    setStatus(correct ? 'correct' : 'wrong');
    if (correct) setHistory((h) => [{ item1, item2 }, ...h.slice(0, 9)]);
    if (user) {
      savePracticeAttempt({
        userId: user.uid,
        userEmail: user.email ?? '',
        userName: user.displayName ?? '',
        problemId: `custom_${item1}_${item2}`,
        problemTitle: `내가 만든 문제: ${item1} / ${item2}`,
        userAnswer: answer,
        isCorrect: correct,
        score: correct ? 10 : 0,
      });
    }
  };

  const handleReset = () => {
    setProblem(null);
    setStep('input');
    setItem1('');
    setItem2('');
    setAnswer('');
    setStatus('idle');
    setShowHint(false);
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/practice" className="text-gray-400 hover:text-gray-600 transition-colors text-sm">
          ← 연습하기
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-800">🎨 내가 만드는 문제</h1>
          <p className="text-sm text-gray-500 mt-0.5">소재를 입력하면 AI가 교과서 스타일 문제를 만들어 드려요!</p>
        </div>
      </div>

      {/* STEP 1 — 소재 입력 */}
      {step === 'input' && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-base font-semibold text-gray-700 mb-4">✏️ 두 양의 소재를 입력하세요</h2>
          <div className="flex flex-wrap gap-2 mb-5">
            {EXAMPLES.map((ex) => (
              <button
                key={ex.item1}
                onClick={() => { setItem1(ex.item1); setItem2(ex.item2); }}
                className="text-xs bg-blue-50 text-blue-600 border border-blue-200 rounded-full px-3 py-1.5 hover:bg-blue-100 transition-colors"
              >
                {ex.item1} / {ex.item2}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-4 mb-5">
            <div>
              <label className="text-xs text-gray-500 mb-1.5 block font-medium">기준이 되는 양</label>
              <input
                type="text"
                value={item1}
                onChange={(e) => setItem1(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
                placeholder="예: 거문고"
                className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-400 text-center text-lg font-medium"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1.5 block font-medium">변하는 양</label>
              <input
                type="text"
                value={item2}
                onChange={(e) => setItem2(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
                placeholder="예: 줄"
                className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-purple-400 text-center text-lg font-medium"
              />
            </div>
          </div>
          <button
            onClick={handleGenerate}
            disabled={generating || !item1.trim() || !item2.trim()}
            className="w-full bg-gradient-to-r from-blue-500 to-purple-500 text-white py-3.5 rounded-xl font-semibold hover:opacity-90 disabled:opacity-40 transition-all flex items-center justify-center gap-2 text-base"
          >
            {generating ? (
              <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />AI가 문제를 만드는 중...</>
            ) : '✨ 문제 만들기'}
          </button>
          {error && <p className="text-red-500 text-sm mt-3 text-center">{error}</p>}
        </div>
      )}

      {/* STEP 2 — 기호 선택 */}
      {step === 'choose-symbol' && problem && (
        <div className="space-y-4">
          {/* 교과서 스타일 문제 */}
          <div className="bg-white rounded-2xl border-2 border-blue-100 shadow-sm p-6">
            <div className="flex items-start gap-3">
              <span className="bg-blue-500 text-white text-xs font-bold px-2 py-1 rounded-lg flex-shrink-0 mt-0.5">문제</span>
              <div>
                <p className="text-base text-gray-800 leading-relaxed mb-2">{problem.story}</p>
                <p className="text-base text-gray-800 leading-relaxed font-medium">
                  {item1} 수와 {item2} 수를 나타내는 기호를 정하여 두 양 사이의 대응 관계를 식으로 나타내 보세요.
                </p>
              </div>
            </div>
          </div>

          {/* 표 */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <h3 className="text-sm font-semibold text-gray-600 mb-3">📊 표로 확인해 보세요</h3>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <tbody>
                  <tr>
                    <td className="bg-blue-50 border border-blue-200 px-4 py-2.5 font-semibold text-blue-700 text-center whitespace-nowrap">{item1} 수</td>
                    {problem.tableX.map((v, i) => (
                      <td key={i} className="border border-gray-200 px-4 py-2.5 text-center font-mono text-base">{v}</td>
                    ))}
                  </tr>
                  <tr>
                    <td className="bg-purple-50 border border-purple-200 px-4 py-2.5 font-semibold text-purple-700 text-center whitespace-nowrap">{item2} 수</td>
                    {problem.tableY.map((v, i) => (
                      <td key={i} className="border border-gray-200 px-4 py-2.5 text-center font-mono text-base">{v}</td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* 기호 선택 */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <h3 className="text-sm font-semibold text-gray-600 mb-4">🔣 나만의 기호를 정해 보세요</h3>
            <div className="space-y-4">
              <div>
                <label className="text-sm text-blue-700 font-medium mb-2 block">{item1} 수를 나타내는 기호</label>
                <div className="flex gap-2 flex-wrap">
                  {SYMBOL_OPTIONS.map((sym) => (
                    <button key={sym} onClick={() => setSym1(sym)}
                      className={`w-11 h-11 rounded-xl text-xl font-bold border-2 transition-all ${sym1 === sym ? 'bg-blue-500 text-white border-blue-500 scale-110' : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300'}`}>
                      {sym}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-sm text-purple-700 font-medium mb-2 block">{item2} 수를 나타내는 기호</label>
                <div className="flex gap-2 flex-wrap">
                  {SYMBOL_OPTIONS.map((sym) => (
                    <button key={sym} onClick={() => sym !== sym1 && setSym2(sym)}
                      disabled={sym === sym1}
                      className={`w-11 h-11 rounded-xl text-xl font-bold border-2 transition-all ${sym2 === sym ? 'bg-purple-500 text-white border-purple-500 scale-110' : 'bg-white text-gray-600 border-gray-200 hover:border-purple-300'} ${sym === sym1 ? 'opacity-20 cursor-not-allowed' : ''}`}>
                      {sym}
                    </button>
                  ))}
                </div>
              </div>
              <div className="bg-gray-50 rounded-xl p-3 flex items-center gap-3 text-sm flex-wrap">
                <span className="bg-blue-100 text-blue-700 px-3 py-1.5 rounded-lg font-bold text-xl">{sym1}</span>
                <span className="text-gray-500">= {item1} 수</span>
                <span className="mx-1 text-gray-300">|</span>
                <span className="bg-purple-100 text-purple-700 px-3 py-1.5 rounded-lg font-bold text-xl">{sym2}</span>
                <span className="text-gray-500">= {item2} 수</span>
              </div>
            </div>
          </div>

          <button onClick={handleStartSolve}
            className="w-full bg-green-500 text-white py-3.5 rounded-xl font-semibold hover:bg-green-600 transition-colors text-base">
            이 기호로 식 만들기 →
          </button>
          <button onClick={handleReset} className="w-full text-gray-400 text-sm py-2 hover:text-gray-600 transition-colors">
            처음으로 돌아가기
          </button>
        </div>
      )}

      {/* STEP 3 — 식 작성 */}
      {step === 'solve' && problem && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border-2 border-blue-100 p-5">
            <div className="flex items-start gap-3">
              <span className="bg-blue-500 text-white text-xs font-bold px-2 py-1 rounded-lg flex-shrink-0 mt-0.5">문제</span>
              <p className="text-sm text-gray-700 leading-relaxed">{problem.story}</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <tbody>
                  <tr>
                    <td className="bg-blue-50 border border-blue-200 px-3 py-2 font-semibold text-blue-700 text-center whitespace-nowrap">{item1} 수 ({sym1})</td>
                    {problem.tableX.map((v, i) => (
                      <td key={i} className="border border-gray-200 px-4 py-2 text-center font-mono">{v}</td>
                    ))}
                  </tr>
                  <tr>
                    <td className="bg-purple-50 border border-purple-200 px-3 py-2 font-semibold text-purple-700 text-center whitespace-nowrap">{item2} 수 ({sym2})</td>
                    {problem.tableY.map((v, i) => (
                      <td key={i} className="border border-gray-200 px-4 py-2 text-center font-mono">{v}</td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <p className="text-sm font-semibold text-gray-700 mb-4">
              ❓ {sym1}({item1} 수)와 {sym2}({item2} 수)의 대응 관계를 식으로 나타내어 보세요.
            </p>

            {showHint && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3 mb-4 text-sm text-yellow-800">
                💡 {item1} 수({sym1})에 {problem.operand}을(를){' '}
                {problem.operator === '×' ? '곱하면' : problem.operator === '÷' ? '나누면' : problem.operator === '+' ? '더하면' : '빼면'}{' '}
                {item2} 수({sym2})가 돼요.
              </div>
            )}

            <div className="flex gap-2 mb-3">
              <input
                type="text"
                value={answer}
                onChange={(e) => { setAnswer(e.target.value); setStatus('idle'); }}
                onKeyDown={(e) => e.key === 'Enter' && status === 'idle' && checkAnswer()}
                placeholder={`예: ${sym2}=${sym1}${problem.operator}${problem.operand}`}
                disabled={status === 'correct'}
                className="flex-1 border-2 border-gray-200 rounded-xl px-4 py-3 text-base font-mono focus:outline-none focus:border-blue-400 disabled:bg-gray-50"
              />
            </div>

            {/* 기호 버튼 */}
            <div className="flex gap-1.5 flex-wrap mb-4">
              {[sym1, sym2, '×', '÷', '+', '-', '=', '1','2','3','4','5','6','7','8','9','0'].map((sym, idx) => (
                <button key={idx} onClick={() => setAnswer((a) => a + sym)} disabled={status === 'correct'}
                  className="min-w-[2.25rem] h-10 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-mono px-2 disabled:opacity-40 transition-colors">
                  {sym}
                </button>
              ))}
              <button onClick={() => setAnswer((a) => a.slice(0, -1))} disabled={status === 'correct'}
                className="h-10 px-3 bg-red-50 hover:bg-red-100 text-red-400 rounded-lg text-sm disabled:opacity-40 transition-colors">
                ⌫
              </button>
            </div>

            {status === 'correct' && (
              <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                <p className="text-green-700 font-semibold mb-1">✅ 정답이에요! 훌륭해요!</p>
                <p className="text-sm text-green-600">{problem.explanation}</p>
              </div>
            )}
            {status === 'wrong' && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-3">
                <p className="text-red-600 font-semibold text-sm">❌ 틀렸어요. 표를 다시 살펴보세요!</p>
              </div>
            )}
          </div>

          <div className="flex justify-between">
            <div className="flex gap-2">
              <button onClick={() => setShowHint(true)}
                className="text-sm text-yellow-600 border border-yellow-300 bg-yellow-50 px-4 py-2 rounded-xl hover:bg-yellow-100 transition-colors">
                💡 힌트
              </button>
              <button onClick={() => setStep('choose-symbol')}
                className="text-sm text-gray-500 border border-gray-300 px-4 py-2 rounded-xl hover:bg-gray-50 transition-colors">
                기호 바꾸기
              </button>
            </div>
            {status === 'idle' && (
              <button onClick={checkAnswer} disabled={!answer.trim()}
                className="bg-blue-500 text-white px-6 py-2 rounded-xl font-semibold hover:bg-blue-600 disabled:opacity-40 transition-colors">
                확인하기
              </button>
            )}
            {status === 'correct' && (
              <button onClick={handleReset}
                className="bg-green-500 text-white px-6 py-2 rounded-xl font-semibold hover:bg-green-600 transition-colors">
                다른 소재 도전 →
              </button>
            )}
            {status === 'wrong' && (
              <button onClick={() => { setStatus('idle'); setAnswer(''); }}
                className="border border-gray-300 text-gray-600 px-4 py-2 rounded-xl hover:bg-gray-50 transition-colors">
                다시 입력
              </button>
            )}
          </div>
        </div>
      )}

      {history.length > 0 && (
        <div className="mt-6 bg-white rounded-2xl border border-gray-100 p-5">
          <h3 className="text-sm font-semibold text-gray-600 mb-3">📚 내가 풀었던 문제</h3>
          <div className="flex flex-wrap gap-2">
            {history.map((h, i) => (
              <span key={i} className="text-xs bg-green-50 text-green-700 border border-green-200 rounded-full px-3 py-1">
                ✓ {h.item1} / {h.item2}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
