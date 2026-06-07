export type TeacherGroupResponsibilityForStudentCount = {
  group: {
    students: readonly unknown[];
  };
};

export function countStudentsFromGroupResponsibilities(
  responsibilities: readonly TeacherGroupResponsibilityForStudentCount[],
): number {
  return responsibilities.reduce(
    (total, responsibility) => total + responsibility.group.students.length,
    0,
  );
}