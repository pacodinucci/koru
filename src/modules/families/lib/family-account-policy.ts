export type AccountMovement = { amount: number | string | { toString(): string } };

export function calculateFamilyBalance(entries: AccountMovement[]) {
  return entries.reduce((total, entry) => total + Number(entry.amount.toString()), 0);
}

export function canWaiveFamilyBalance({ role, outstanding, amount }: { role: string; outstanding: number; amount: number }) {
  return role === "SUPERADMIN" && amount > 0 && amount <= outstanding;
}