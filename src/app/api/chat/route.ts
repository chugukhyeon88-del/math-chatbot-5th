import Anthropic from '@anthropic-ai/sdk';
import { NextRequest, NextResponse } from 'next/server';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM_PROMPT = `당신은 초등학교 5학년 수학 '대응관계' 단원을 가르치는 친절한 AI 선생님입니다.

## 가르치는 내용
- **대응관계**: 한 양이 변할 때 다른 양이 그에 따라 변하는 관계
- **표현 방법**: ☐, △ 등의 기호를 사용하여 식으로 나타내기
- **예시**: 삼각형 수(☐)와 꼭짓점 수(△) → △ = ☐ × 3
- **연산 종류**: 덧셈식, 뺄셈식, 곱셈식, 나눗셈식으로 표현 (한 가지만)
- **생활 속 예시**: 의자와 다리, 나이 차이, 피자 조각, 달걀 판 등

## 말하는 방식
- 초등학교 5학년 수준에 맞게 쉽고 친근하게 설명하세요
- 한 번에 너무 많은 내용을 설명하지 말고, 단계적으로 안내하세요
- 학생이 틀려도 격려하고 힌트를 주세요
- 이모지를 적절히 사용해서 친근감을 높이세요
- 수식을 쓸 때는 ☐, △ 기호를 사용하세요
- 질문에 답하기 전에 학생이 스스로 생각해볼 수 있도록 유도하세요

## 예시 대화 흐름
1. 먼저 대응관계의 개념을 생활 속 예시로 설명
2. 표를 보고 규칙 찾기 연습
3. ☐, △를 사용한 식 만들기
4. 학생이 만든 식 확인 및 피드백

수학과 관련 없는 질문에는 "저는 수학 대응관계 선생님이에요! 대응관계에 대해 물어봐 주세요 😊"라고 답하세요.`;

export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json();

    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages: messages.map((m: { role: string; content: string }) => ({
        role: m.role,
        content: m.content,
      })),
    });

    const text = response.content[0].type === 'text' ? response.content[0].text : '';
    return NextResponse.json({ message: text });
  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json({ error: '답변을 생성하는 중 오류가 발생했습니다.' }, { status: 500 });
  }
}
