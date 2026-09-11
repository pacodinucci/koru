export type AccountMovement = { amount: number | string | { toString(): string } };

export function calculateFamilyBalance(entries: AccountMovement[]) {
  return entries.reduce((total, entry) => total + Number(entry.amount.toString()), 0);
}

export function canWaiveFamilyBalance({ outstanding, amount }: { outstanding: number; amount: number }) {
  return amount > 0 && amount <= outstanding;
}