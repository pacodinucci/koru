function cents(value: string): bigint {
  const match = /^(0|[1-9]\d*)(?:\.(\d{1,2}))?$/.exec(value);
  if (!match) throw new Error("invalid_money_amount");
  return BigInt(match[1]) * BigInt(100) + BigInt((match[2] ?? "").padEnd(2, "0"));
}

function basisPoints(value: string): bigint {
  const match = /^(0|[1-9]\d*)(?:\.(\d{1,2}))?$/.exec(value);
  if (!match) throw new Error("invalid_discount_percent");
  const result = BigInt(match[1]) * BigInt(100) + BigInt((match[2] ?? "").padEnd(2, "0"));
  if (result > BigInt(10000)) throw new Error("invalid_discount_percent");
  return result;
}

function money(value: bigint): string {
  return `${value / BigInt(100)}.${String(value % BigInt(100)).padStart(2, "0")}`;
}

export function calculatePlanDiscount(grossAmount: string, discountPercent: string) {
  const gross = cents(grossAmount);
  const percent = basisPoints(discountPercent);
  const net = (gross * (BigInt(10000) - percent) + BigInt(5000)) / BigInt(10000);
  return { grossAmount: money(gross), discountAmount: money(gross - net), netAmount: money(net) };
}
