import Anthropic from '@anthropic-ai/sdk';
import { NextRequest, NextResponse } from 'next/server';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: NextRequest) {
  try {
    const { item1, item2 } = await req.json();

    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: `초등학교 5학년 수학 '대응관계' 단원의 문장제 문제를 만들어줘.

학생이 선택한 소재:
- 첫 번째 양: "${item1}"
- 두 번째 양: "${item2}"

다음 JSON 형식으로만 답해줘. 다른 설명은 절대 쓰지 마:
{
  "relation": "곱하기 2" (또는 "더하기 3", "빼기 1" 등 — 실제 관계를 한 가지 연산으로),
  "operand": 2 (숫자만),
  "operator": "×" (×, ÷, +, - 중 하나),
  "story": "안경 수가 늘어날수록 안경다리도 늘어나요. 안경 1개에 안경다리는 2개예요." (2~3문장 친근한 설명),
  "tableX": [1, 2, 3, 4, 5],
  "tableY": [2, 4, 6, 8, 10],
  "question": "안경 수를 ☐, 안경다리 수를 △라고 할 때, 두 양의 대응관계를 식으로 나타내어 보세요.",
  "correctFormulas": ["△=☐×2", "☐×2=△"],
  "explanation": "안경 수(☐)에 2를 곱하면 안경다리 수(△)가 됩니다. → △ = ☐ × 2",
  "xLabel": "안경 수(☐)",
  "yLabel": "안경다리 수(△)"
}

tableX와 tableY는 반드시 5개의 숫자 배열이어야 해.
correctFormulas에는 ×와 * 둘 다 포함해줘.
숫자는 초등학생이 다루기 쉬운 범위(1~100)로 해줘.`,
        },
      ],
    });

    const text = response.content[0].type === 'text' ? response.content[0].text : '';
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('JSON 파싱 실패');

    const data = JSON.parse(jsonMatch[0]);
    return NextResponse.json(data);
  } catch (error) {
    console.error('Generate problem error:', error);
    return NextResponse.json({ error: '문제 생성 중 오류가 발생했습니다.' }, { status: 500 });
  }
}
