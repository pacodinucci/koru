// Pure planning only: importing this module never opens a database connection.
export function buildRoleBackfillPlan({ adminEmails = [], teacherEmails = [], psychopedagogyTeacherEmails = [] } = {}) {
  const assignments = [
    { role: "ADMIN", emails: adminEmails },
    { role: "TEACHER", emails: teacherEmails },
    { role: "PSYCHOPEDAGOGY_TEACHER", emails: psychopedagogyTeacherEmails },
  ];
  const explicitEmails = [...new Set(assignments.flatMap(({ emails }) => emails))];
  return [
    ...assignments.filter(({ emails }) => emails.length).map(({ role, emails }) => ({ role, where: { email: { in: emails } } })),
    {
      role: "PARENT",
      where: {
        ...(explicitEmails.length ? { email: { notIn: explicitEmails } } : {}),
        // Do not demote specialized roles or overwrite explicit dynamic assignments.
        role: { in: ["ADMIN", "TEACHER", "PARENT"] },
        accessRoleId: null,
      },
    },
  ];
}
