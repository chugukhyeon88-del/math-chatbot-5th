export interface Problem {
  id: string;
  title: string;
  description: string;
  table: { x: number[]; y: number[] };
  xLabel: string;
  yLabel: string;
  hint: string;
  correctFormulas: string[];   // 정답 식 (□, △ 사용)
  explanation: string;
  type: 'add' | 'sub' | 'mul' | 'div';
  difficulty: 1 | 2 | 3;
}

export const PROBLEMS: Problem[] = [
  {
    id: 'p1',
    title: '의자 다리와 의자 수',
    description: '의자 1개에는 다리가 4개 있어요. 의자 수(☐)와 다리 수(△) 사이의 대응 관계를 식으로 나타내어 보세요.',
    table: { x: [1, 2, 3, 4, 5], y: [4, 8, 12, 16, 20] },
    xLabel: '의자 수(☐)',
    yLabel: '다리 수(△)',
    hint: '의자가 1개씩 늘어날 때 다리는 몇 개씩 늘어나나요?',
    correctFormulas: ['△=☐×4', '△=☐*4', '☐×4=△', '☐*4=△'],
    explanation: '의자 수(☐)에 4를 곱하면 다리 수(△)가 됩니다. → △ = ☐ × 4',
    type: 'mul',
    difficulty: 1,
  },
  {
    id: 'p2',
    title: '삼각형의 수와 꼭짓점',
    description: '삼각형의 수(☐)와 꼭짓점의 수(△) 사이의 대응 관계를 식으로 나타내어 보세요.',
    table: { x: [1, 2, 3, 4, 5], y: [3, 6, 9, 12, 15] },
    xLabel: '삼각형 수(☐)',
    yLabel: '꼭짓점 수(△)',
    hint: '삼각형 1개에 꼭짓점은 몇 개인가요?',
    correctFormulas: ['△=☐×3', '△=☐*3', '☐×3=△', '☐*3=△'],
    explanation: '삼각형 수(☐)에 3을 곱하면 꼭짓점 수(△)가 됩니다. → △ = ☐ × 3',
    type: 'mul',
    difficulty: 1,
  },
  {
    id: 'p3',
    title: '나이 차이',
    description: '형의 나이는 동생의 나이보다 항상 4살 많아요. 동생 나이(☐)와 형 나이(△) 사이의 대응 관계를 식으로 나타내어 보세요.',
    table: { x: [7, 8, 9, 10, 11], y: [11, 12, 13, 14, 15] },
    xLabel: '동생 나이(☐)',
    yLabel: '형 나이(△)',
    hint: '형의 나이는 동생의 나이에 얼마를 더하면 될까요?',
    correctFormulas: ['△=☐+4', '☐+4=△'],
    explanation: '동생 나이(☐)에 4를 더하면 형 나이(△)가 됩니다. → △ = ☐ + 4',
    type: 'add',
    difficulty: 1,
  },
  {
    id: 'p4',
    title: '달걀 한 판',
    description: '달걀 한 판에는 30개가 들어 있어요. 달걀 판 수(☐)와 달걀 수(△) 사이의 대응 관계를 식으로 나타내어 보세요.',
    table: { x: [1, 2, 3, 4, 5], y: [30, 60, 90, 120, 150] },
    xLabel: '달걀 판 수(☐)',
    yLabel: '달걀 수(△)',
    hint: '달걀 판 1개에는 달걀이 몇 개 들어 있나요?',
    correctFormulas: ['△=☐×30', '△=☐*30', '☐×30=△', '☐*30=△'],
    explanation: '달걀 판 수(☐)에 30을 곱하면 달걀 수(△)가 됩니다. → △ = ☐ × 30',
    type: 'mul',
    difficulty: 2,
  },
  {
    id: 'p5',
    title: '피자 조각',
    description: '피자 1판을 8조각으로 잘라요. 피자 수(☐)와 피자 조각 수(△) 사이의 대응 관계를 식으로 나타내어 보세요.',
    table: { x: [1, 2, 3, 4, 5], y: [8, 16, 24, 32, 40] },
    xLabel: '피자 수(☐)',
    yLabel: '조각 수(△)',
    hint: '피자 1판에 조각은 몇 개인가요?',
    correctFormulas: ['△=☐×8', '△=☐*8', '☐×8=△', '☐*8=△'],
    explanation: '피자 수(☐)에 8을 곱하면 피자 조각 수(△)가 됩니다. → △ = ☐ × 8',
    type: 'mul',
    difficulty: 1,
  },
  {
    id: 'p6',
    title: '공책값',
    description: '공책 1권의 가격은 500원이에요. 공책 수(☐)와 공책값(△, 원) 사이의 대응 관계를 식으로 나타내어 보세요.',
    table: { x: [1, 2, 3, 4, 5], y: [500, 1000, 1500, 2000, 2500] },
    xLabel: '공책 수(☐)',
    yLabel: '공책값(△)',
    hint: '공책 1권의 가격에 권 수를 곱해 보세요.',
    correctFormulas: ['△=☐×500', '△=☐*500', '☐×500=△', '☐*500=△'],
    explanation: '공책 수(☐)에 500을 곱하면 공책값(△)이 됩니다. → △ = ☐ × 500',
    type: 'mul',
    difficulty: 2,
  },
  {
    id: 'p7',
    title: '열차 칸과 연결 고리',
    description: '열차 칸(☐)과 연결 고리(△) 사이의 대응 관계를 식으로 나타내어 보세요. (칸과 칸 사이마다 연결 고리가 1개씩 있어요.)',
    table: { x: [2, 3, 4, 5, 6], y: [1, 2, 3, 4, 5] },
    xLabel: '열차 칸 수(☐)',
    yLabel: '연결 고리 수(△)',
    hint: '열차 칸이 2개이면 연결 고리는 1개예요. 칸 수에서 얼마를 빼면 될까요?',
    correctFormulas: ['△=☐-1', '☐-1=△', '☐=△+1', '△+1=☐'],
    explanation: '열차 칸 수(☐)에서 1을 빼면 연결 고리 수(△)가 됩니다. → △ = ☐ - 1',
    type: 'sub',
    difficulty: 2,
  },
  {
    id: 'p8',
    title: '꿀벌과 꽃',
    description: '꿀벌 1마리는 꽃 6송이에서 꿀을 모아요. 꿀벌 수(☐)와 꽃 송이 수(△) 사이의 대응 관계를 식으로 나타내어 보세요.',
    table: { x: [1, 2, 3, 4, 5], y: [6, 12, 18, 24, 30] },
    xLabel: '꿀벌 수(☐)',
    yLabel: '꽃 송이 수(△)',
    hint: '꿀벌 1마리가 꽃 6송이를 방문한다면, 꿀벌 수에 무엇을 곱할까요?',
    correctFormulas: ['△=☐×6', '△=☐*6', '☐×6=△', '☐*6=△'],
    explanation: '꿀벌 수(☐)에 6을 곱하면 꽃 송이 수(△)가 됩니다. → △ = ☐ × 6',
    type: 'mul',
    difficulty: 2,
  },
  {
    id: 'p9',
    title: '설탕과 밀가루',
    description: '쿠키를 만들 때 설탕량(☐)은 밀가루량(△)의 절반이에요. 설탕량(☐)과 밀가루량(△) 사이의 대응 관계를 식으로 나타내어 보세요.',
    table: { x: [1, 2, 3, 4, 5], y: [2, 4, 6, 8, 10] },
    xLabel: '설탕량(☐, 컵)',
    yLabel: '밀가루량(△, 컵)',
    hint: '밀가루는 설탕의 2배예요.',
    correctFormulas: ['△=☐×2', '△=☐*2', '☐×2=△', '☐*2=△'],
    explanation: '설탕량(☐)에 2를 곱하면 밀가루량(△)이 됩니다. → △ = ☐ × 2',
    type: 'mul',
    difficulty: 3,
  },
  {
    id: 'p10',
    title: '정사각형과 변의 수',
    description: '정사각형의 수(☐)와 변의 수(△) 사이의 대응 관계를 식으로 나타내어 보세요.',
    table: { x: [1, 2, 3, 4, 5], y: [4, 8, 12, 16, 20] },
    xLabel: '정사각형 수(☐)',
    yLabel: '변의 수(△)',
    hint: '정사각형 1개에 변은 몇 개인가요?',
    correctFormulas: ['△=☐×4', '△=☐*4', '☐×4=△', '☐*4=△'],
    explanation: '정사각형 수(☐)에 4를 곱하면 변의 수(△)가 됩니다. → △ = ☐ × 4',
    type: 'mul',
    difficulty: 1,
  },
];

import { checkFormulaAgainstTable } from './formulaChecker';

export function checkAnswer(problemId: string, userAnswer: string): boolean {
  const problem = PROBLEMS.find((p) => p.id === problemId);
  if (!problem) return false;
  return checkFormulaAgainstTable(
    userAnswer,
    '☐', '△',
    problem.table.x,
    problem.table.y,
  );
}
