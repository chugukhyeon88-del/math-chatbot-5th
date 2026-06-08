import Link from 'next/link';

export default function Home() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      {/* Hero */}
      <div className="text-center mb-12">
        <div className="text-7xl mb-4">🔢</div>
        <h1 className="text-4xl font-bold text-gray-800 mb-3">대응관계 수학 챗봇</h1>
        <p className="text-lg text-gray-500">초등학교 5학년 1학기 4단원 · 두 양 사이의 관계를 찾아요!</p>
      </div>

      {/* 단원 소개 카드 */}
      <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6 mb-10">
        <h2 className="text-lg font-bold text-blue-800 mb-3">📚 이 단원에서 배울 내용</h2>
        <ul className="space-y-2 text-blue-700 text-sm">
          <li>✅ 대응관계의 의미 이해하기</li>
          <li>✅ 표에서 두 양 사이의 규칙 찾기</li>
          <li>✅ ☐, △ 기호를 사용하여 식으로 나타내기</li>
          <li>✅ 생활 속 대응관계 찾아서 식으로 표현하기</li>
        </ul>
        <div className="mt-4 bg-white rounded-xl p-4 text-sm text-gray-600">
          <span className="font-semibold text-blue-600">예시:</span> 삼각형 수(☐)와 꼭짓점 수(△)
          {' '}→{' '}
          <span className="font-mono font-bold text-purple-600">△ = ☐ × 3</span>
        </div>
      </div>

      {/* 메뉴 카드 3개 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-10">
        <Link href="/chat" className="group bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md hover:border-blue-200 transition-all">
          <div className="text-4xl mb-3">💬</div>
          <h3 className="text-lg font-bold text-gray-800 mb-1">챗봇과 대화하기</h3>
          <p className="text-sm text-gray-500">AI 선생님에게 대응관계에 대해 질문하고 개념을 배워요.</p>
          <div className="mt-4 text-blue-500 text-sm font-medium group-hover:text-blue-700">시작하기 →</div>
        </Link>

        <Link href="/practice" className="group bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md hover:border-green-200 transition-all">
          <div className="text-4xl mb-3">✏️</div>
          <h3 className="text-lg font-bold text-gray-800 mb-1">연습하기</h3>
          <p className="text-sm text-gray-500">표를 보고 대응관계를 식으로 나타내는 연습을 해요.</p>
          <div className="mt-4 text-green-500 text-sm font-medium group-hover:text-green-700">연습하기 →</div>
        </Link>

        <Link href="/teacher" className="group bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md hover:border-purple-200 transition-all">
          <div className="text-4xl mb-3">👨‍🏫</div>
          <h3 className="text-lg font-bold text-gray-800 mb-1">교사용 페이지</h3>
          <p className="text-sm text-gray-500">학생 개별 학습 현황과 성취도를 확인해요.</p>
          <div className="mt-4 text-purple-500 text-sm font-medium group-hover:text-purple-700">확인하기 →</div>
        </Link>
      </div>

      {/* 성취기준 */}
      <div className="bg-gray-100 rounded-xl p-5 text-center text-xs text-gray-400">
        <span className="font-semibold text-gray-500">성취기준 [6수02-01]</span> 한 양이 변할 때 다른 양이 그에 종속하여 변하는 대응관계를 나타낸 표에서 규칙을 찾아 설명하고, ☐, △ 등을 사용하여 식으로 나타낼 수 있다.
      </div>
    </div>
  );
}
