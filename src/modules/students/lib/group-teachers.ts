export type GroupTeacherResponsibility<TTeacher> = {
  teacher: TTeacher;
};

export function getTeachersFromGroupResponsibilities<TTeacher>(
  responsibilities: Array<GroupTeacherResponsibility<TTeacher>>,
): TTeacher[] {
  return responsibilities.map((responsibility) => responsibility.teacher);
}