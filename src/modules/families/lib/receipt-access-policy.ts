export function canAccessReceipt({
  canManagePayments,
  userFamilyId,
  receiptFamilyId,
}: {
  canManagePayments: boolean;
  userFamilyId: string | null;
  receiptFamilyId: string;
}) {
  return canManagePayments || userFamilyId === receiptFamilyId;
}
