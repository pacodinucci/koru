export const MAX_EVENTUAL_INSTALLMENTS = 120;

export function splitInstallmentAmounts(totalAmount: string, installmentCount: number): string[] {
  const match = /^(0|[1-9]\d*)(?:\.(\d{1,2}))?$/.exec(totalAmount);
  if (!match || !Number.isInteger(installmentCount) || installmentCount < 1 || installmentCount > MAX_EVENTUAL_INSTALLMENTS) {
    throw new Error("invalid_installment_terms");
  }
  const cents = Number(match[1]) * 100 + Number((match[2] ?? "").padEnd(2, "0"));
  if (cents === 0) return Array.from({ length: installmentCount }, () => "0.00");
  if (!Number.isSafeInteger(cents) || cents < installmentCount) throw new Error("invalid_installment_terms");
  const base = Math.floor(cents / installmentCount);
  const remainder = cents % installmentCount;
  return Array.from({ length: installmentCount }, (_, index) => {
    const amount = base + (index >= installmentCount - remainder ? 1 : 0);
    return `${Math.floor(amount / 100)}.${String(amount % 100).padStart(2, "0")}`;
  });
}

export function installmentPeriod(startPeriod: Date, installmentIndex: number): Date {
  return new Date(Date.UTC(startPeriod.getUTCFullYear(), startPeriod.getUTCMonth() + installmentIndex, 1));
}

export function eventualInstallmentDescription(name: string, number: number, total: number): string {
  return `Cargo eventual · ${name} · cuota ${number}/${total}`;
}

export function dueInstallmentIndexes(startPeriod: Date, count: number, currentPeriod: Date, emittedNumbers: ReadonlySet<number>): number[] {
  return Array.from({ length: count }, (_, index) => index).filter((index) =>
    installmentPeriod(startPeriod, index) <= currentPeriod && !emittedNumbers.has(index + 1),
  );
}

export function eventualStartPeriod(currentPeriod: Date, startMonth: number): Date {
  if (!Number.isInteger(startMonth) || startMonth < 1 || startMonth > 12) throw new Error("invalid_start_month");
  return new Date(Date.UTC(currentPeriod.getUTCFullYear(), startMonth - 1, 1));
}
