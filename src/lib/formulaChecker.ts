/**
 * 수식 검증기 — 문자열 비교 대신 실제 값 대입으로 수학적 동치를 확인합니다.
 * 예: ☐×3=△  와  △÷3=☐  는 표의 값을 대입하면 둘 다 성립 → 정답 처리
 */

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** 숫자와 사칙연산만 포함된 식을 안전하게 계산 */
function safeEval(expr: string): number | null {
  if (!/^[\d\s+\-*/().]+$/.test(expr)) return null;
  try {
    // eslint-disable-next-line no-new-func
    const result = new Function(`"use strict"; return (${expr})`)() as number;
    return isFinite(result) ? result : null;
  } catch {
    return null;
  }
}

/**
 * 학생이 입력한 수식을 표의 (x, y) 쌍으로 검증합니다.
 *
 * @param formula  학생 입력 수식  예: "△÷3=☐"
 * @param sym1     x 기호           예: "☐"
 * @param val1     x 값             예: 1
 * @param sym2     y 기호           예: "△"
 * @param val2     y 값             예: 3
 */
export function checkFormulaWithValues(
  formula: string,
  sym1: string, val1: number,
  sym2: string, val2: number,
): boolean {
  // 기호 통일 (× → *, ÷ → /, 공백 제거)
  const s = formula
    .replace(/\s/g, '')
    .replace(/×/g, '*')
    .replace(/÷/g, '/');

  const parts = s.split('=');
  if (parts.length !== 2) return false;

  // 기호를 숫자로 치환
  const substitute = (expr: string) =>
    expr
      .replace(new RegExp(escapeRegex(sym1), 'g'), `(${val1})`)
      .replace(new RegExp(escapeRegex(sym2), 'g'), `(${val2})`);

  const leftVal  = safeEval(substitute(parts[0]));
  const rightVal = safeEval(substitute(parts[1]));

  if (leftVal === null || rightVal === null) return false;
  return Math.abs(leftVal - rightVal) < 0.0001;
}

/**
 * 표의 모든 (x, y) 쌍에서 수식이 성립하는지 확인합니다.
 * 최소 2쌍 이상 확인해 우연히 맞는 경우를 걸러냅니다.
 */
export function checkFormulaAgainstTable(
  formula: string,
  sym1: string,
  sym2: string,
  tableX: number[],
  tableY: number[],
): boolean {
  if (!formula.trim()) return false;
  // 수식에 두 기호가 모두 포함되어 있는지 확인
  const hasSymbols = formula.includes(sym1) && formula.includes(sym2);
  if (!hasSymbols) return false;

  return tableX.every((x, i) =>
    checkFormulaWithValues(formula, sym1, x, sym2, tableY[i]),
  );
}
