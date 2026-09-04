function isAdministrativeReceiptRole(role: string) {
  return role === "ADMIN" || role === "ADMIN_TEACHER" || role === "SUPERADMIN";
}

export function canAccessReceipt({ role, userFamilyId, receiptFamilyId }: { role: string; userFamilyId: string | null; receiptFamilyId: string }) {
  return isAdministrativeReceiptRole(role) || userFamilyId === receiptFamilyId;
}