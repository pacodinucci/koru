import assert from "node:assert/strict";
import test from "node:test";

import { getTeachersFromGroupResponsibilities } from "../../src/modules/students/lib/group-teachers";
import { countStudentsFromGroupResponsibilities } from "../../src/modules/teachers/lib/group-student-count";

test("deriva los docentes de un alumno desde las responsabilidades del grupo", () => {
  const teachers = getTeachersFromGroupResponsibilities([
    { teacher: { id: "teacher-a", displayName: "Docente A" } },
    { teacher: { id: "teacher-b", displayName: "Docente B" } },
  ]);

  assert.deepEqual(teachers, [
    { id: "teacher-a", displayName: "Docente A" },
    { id: "teacher-b", displayName: "Docente B" },
  ]);
});

test("cuenta los alumnos de un docente desde sus grupos asignados", () => {
  const studentsCount = countStudentsFromGroupResponsibilities([
    { group: { students: [{ id: "student-1" }, { id: "student-2" }] } },
    { group: { students: [{ id: "student-3" }] } },
  ]);

  assert.equal(studentsCount, 3);
});

test("un docente sin grupos asignados no tiene alumnos derivados", () => {
  assert.equal(countStudentsFromGroupResponsibilities([]), 0);
});