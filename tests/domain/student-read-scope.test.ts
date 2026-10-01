import assert from "node:assert/strict";
import test from "node:test";

import {
  isTeacherScopedStudentViewer,
  studentGroupWhereForViewer,
  studentWhereForViewer,
} from "../../src/modules/students/lib/student-read-scope";

test("los roles docentes sólo pueden consultar alumnos asignados", () => {
  assert.equal(isTeacherScopedStudentViewer("TEACHER"), true);
  assert.equal(isTeacherScopedStudentViewer("ADMIN_TEACHER"), true);
  assert.equal(isTeacherScopedStudentViewer("ADMIN"), false);
  assert.equal(isTeacherScopedStudentViewer("SUPERADMIN"), false);
});

test("la consulta docente se limita a sus grupos activos y alumnos activos", () => {
  const viewer = { id: "radha-user", role: "TEACHER" as const };
  assert.deepEqual(studentGroupWhereForViewer(viewer), {
    isActive: true,
    teacherResponsibilities: {
      some: { teacher: { is: { userId: "radha-user", isActive: true } } },
    },
  });
  assert.deepEqual(studentWhereForViewer(viewer), {
    status: "ACTIVE",
    group: studentGroupWhereForViewer(viewer),
  });
});

test("administración conserva el acceso general", () => {
  const viewer = { id: "admin-user", role: "ADMIN" as const };
  assert.deepEqual(studentGroupWhereForViewer(viewer), { isActive: true });
  assert.equal(studentWhereForViewer(viewer), undefined);
});

test("un rol de familia nunca hereda acceso general por un permiso accidental", () => {
  const viewer = { id: "family-user", role: "PARENT" as const };
  assert.deepEqual(studentGroupWhereForViewer(viewer), { id: { in: [] } });
  assert.deepEqual(studentWhereForViewer(viewer), { id: { in: [] } });
});
