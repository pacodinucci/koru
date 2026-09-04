export function canAccessFamilyStudent({
  studentFamilyId,
  userFamilyId,
}: {
  studentFamilyId: string | null;
  userFamilyId: string | null;
}) {
  return Boolean(studentFamilyId && userFamilyId && studentFamilyId === userFamilyId);
}