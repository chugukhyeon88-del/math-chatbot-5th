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
          content: `초등학교 5학년 수학 '대응관계' 단원의 문장제 문제를 교과서 스타일로 만들어줘.

학생이 선택한 소재:
- 첫 번째 양(기준): "${item1}"
- 두 번째 양(결과): "${item2}"

교과서 예시 스타일:
"우리나라의 전통 현악기인 거문고에는 줄이 6개 있습니다. 거문고 수와 거문고의 줄 수를 나타내는 기호를 정하여 두 양 사이의 대응 관계를 식으로 나타내 보세요."

이 스타일처럼:
1. "${item1}"에 대한 흥미로운 배경 지식이나 사실을 1~2문장으로 설명 (실제 사실이어야 함)
2. "${item1} 수와 ${item2} 수를 나타내는 기호를 정하여 두 양 사이의 대응 관계를 식으로 나타내 보세요." 로 마무리

다음 JSON 형식으로만 답해줘. 다른 설명은 절대 쓰지 마:
{
  "operand": 6,
  "operator": "×",
  "story": "우리나라의 전통 현악기인 거문고에는 줄이 6개 있습니다.",
  "question": "거문고 수와 거문고의 줄 수를 나타내는 기호를 정하여 두 양 사이의 대응 관계를 식으로 나타내 보세요.",
  "tableX": [1, 2, 3, 4, 5],
  "tableY": [6, 12, 18, 24, 30],
  "xLabel": "${item1} 수",
  "yLabel": "${item2} 수",
  "explanation": "${item1} 수에 6을 곱하면 ${item2} 수가 됩니다."
}

규칙:
- story는 실제 사실에 기반한 흥미로운 배경 설명 1~2문장
- tableX와 tableY는 반드시 숫자 5개짜리 배열
- 숫자는 초등학생이 다루기 쉬운 범위(1~50)
- 연산은 덧셈, 뺄셈, 곱셈, 나눗셈 중 하나만 사용`,
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
