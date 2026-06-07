"use client";

import { Plus } from "lucide-react";
import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  ResponsiveDialog,
  ResponsiveDialogBody,
  ResponsiveDialogContent,
  ResponsiveDialogDescription,
  ResponsiveDialogFooter,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
} from "@/components/ui/responsive-dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import type { ExamFormInput, ExamStatusValue } from "@/modules/exams/schemas/exam.schema";
import { saveExamAction } from "@/modules/exams/server/exam.actions";

type TeacherOption = {
  id: string;
  displayName: string;
  email: string | null;
};

type StudentGroup = {
  id: string;
  name: string;
  ageRange: string;
  teachers: TeacherOption[];
};

type StudentOption = {
  id: string;
  firstName: string;
  lastName: string;
  groupId: string;
};

type Exam = {
  id: string;
  groupId: string;
  teacherId: string;
  title: string;
  subject: string | null;
  examDate: string;
  description: string | null;
  status: ExamStatusValue;
  group: { id: string; name: string };
  teacher: TeacherOption;
  grades: Array<{
    studentId: string;
    score: string;
    observations: string | null;
    student: StudentOption;
  }>;
};

type DashboardExamsClientProps = {
  userRole: "ADMIN" | "TEACHER" | "PARENT";
  groups: StudentGroup[];
  students: StudentOption[];
  teachers: TeacherOption[];
  exams: Exam[];
};

const statusLabels: Record<ExamStatusValue, string> = {
  DRAFT: "Borrador",
  PUBLISHED: "Publicado",
};

const emptyValues: ExamFormInput = {
  groupId: "",
  teacherId: "",
  title: "",
  subject: "",
  examDate: "",
  description: "",
  status: "DRAFT",
  grades: [],
};

function dateForInput(value: string) {
  return value.slice(0, 10);
}

function createGradesForStudents(students: StudentOption[]) {
  return students.map((student) => ({
    studentId: student.id,
    score: 0,
    observations: "",
  }));
}

export function DashboardExamsClient({ userRole, groups, students, teachers, exams }: DashboardExamsClientProps) {
  const router = useRouter();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [groupFilter, setGroupFilter] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [values, setValues] = useState<ExamFormInput>(emptyValues);
  const [isPending, startTransition] = useTransition();
  const selectedGroupStudents = useMemo(
    () => students.filter((student) => student.groupId === values.groupId),
    [students, values.groupId],
  );
  const filteredExams = useMemo(
    () => exams.filter((exam) => (groupFilter ? exam.groupId === groupFilter : true)),
    [exams, groupFilter],
  );

  function resetForm() {
    setEditingId(null);
    setMessage(null);
    setValues(emptyValues);
  }

  function closeDialog() {
    setDialogOpen(false);
    resetForm();
  }

  function openCreateDialog() {
    resetForm();
    const firstGroup = groups[0];
    const groupStudents = firstGroup ? students.filter((student) => student.groupId === firstGroup.id) : [];
    setValues({
      ...emptyValues,
      groupId: firstGroup?.id ?? "",
      teacherId: userRole === "ADMIN" ? (teachers[0]?.id ?? "") : (firstGroup?.teachers[0]?.id ?? ""),
      grades: createGradesForStudents(groupStudents),
    });
    setDialogOpen(true);
  }

  function editExam(exam: Exam) {
    setEditingId(exam.id);
    setMessage(null);
    setValues({
      id: exam.id,
      groupId: exam.groupId,
      teacherId: exam.teacherId,
      title: exam.title,
      subject: exam.subject ?? "",
      examDate: dateForInput(exam.examDate),
      description: exam.description ?? "",
      status: exam.status,
      grades: exam.grades.map((grade) => ({
        studentId: grade.studentId,
        score: Number(grade.score),
        observations: grade.observations ?? "",
      })),
    });
    setDialogOpen(true);
  }

  function changeGroup(groupId: string) {
    const group = groups.find((item) => item.id === groupId);
    const groupStudents = students.filter((student) => student.groupId === groupId);
    setValues((current) => ({
      ...current,
      groupId,
      teacherId: userRole === "ADMIN" ? (teachers[0]?.id ?? "") : (group?.teachers[0]?.id ?? ""),
      grades: createGradesForStudents(groupStudents),
    }));
  }

  function updateGrade(studentId: string, field: "score" | "observations", value: string) {
    setValues((current) => ({
      ...current,
      grades: current.grades.map((grade) =>
        grade.studentId === studentId
          ? {
              ...grade,
              [field]: field === "score" ? Number(value) : value,
            }
          : grade,
      ),
    }));
  }

  function onSubmit() {
    setMessage(null);
    startTransition(async () => {
      const result = await saveExamAction(values);
      if (result.ok) {
        closeDialog();
        router.refresh();
        return;
      }

      setMessage("No pudimos guardar el examen. Revisá grupo, docente responsable y notas.");
    });
  }

  return (
    <div className="space-y-4">
      <Card size="sm">
        <CardHeader>
          <CardTitle>Exámenes</CardTitle>
          <CardAction>
            <Button type="button" size="sm" onClick={openCreateDialog} disabled={groups.length === 0}>
              <Plus />
              Nuevo examen
            </Button>
          </CardAction>
        </CardHeader>
        <CardContent className="space-y-3">
          {groups.length === 0 ? (
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-muted-foreground">
              {userRole === "TEACHER"
                ? "Todavía no tenés grupos asignados como responsable. Pedile a un administrador que te asigne desde Docentes."
                : "Todavía no hay grupos activos para cargar exámenes."}
            </div>
          ) : null}
          <select className="h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm" value={groupFilter} onChange={(event) => setGroupFilter(event.target.value)}>
            <option value="">Todos los grupos</option>
            {groups.map((group) => (
              <option key={group.id} value={group.id}>
                {group.name}
              </option>
            ))}
          </select>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Examen</TableHead>
                <TableHead>Grupo</TableHead>
                <TableHead>Docente</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead>Notas</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredExams.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-muted-foreground">
                    Todavía no hay exámenes para mostrar.
                  </TableCell>
                </TableRow>
              ) : (
                filteredExams.map((exam) => (
                  <TableRow key={exam.id}>
                    <TableCell className="font-medium">
                      <div>{exam.title}</div>
                      {exam.subject ? <div className="text-xs text-muted-foreground">{exam.subject}</div> : null}
                    </TableCell>
                    <TableCell>{exam.group.name}</TableCell>
                    <TableCell>{exam.teacher.displayName}</TableCell>
                    <TableCell>{dateForInput(exam.examDate)}</TableCell>
                    <TableCell>{exam.grades.length}</TableCell>
                    <TableCell>
                      <Badge variant={exam.status === "PUBLISHED" ? "default" : "secondary"}>
                        {statusLabels[exam.status]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button type="button" variant="outline" size="sm" onClick={() => editExam(exam)}>
                        Editar
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <ResponsiveDialog open={dialogOpen} onOpenChange={(open) => (open ? setDialogOpen(true) : closeDialog())}>
        <ResponsiveDialogContent className="md:w-[min(calc(100vw-2rem),56rem)] [font-family:var(--font-montserrat)] [&_*]:[font-family:var(--font-montserrat)]">
          <ResponsiveDialogHeader>
            <ResponsiveDialogTitle>{editingId ? "Editar examen" : "Nuevo examen"}</ResponsiveDialogTitle>
            <ResponsiveDialogDescription>
              Cargá el examen y la nota de todos los alumnos activos del grupo.
            </ResponsiveDialogDescription>
          </ResponsiveDialogHeader>
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
            <ResponsiveDialogBody className="space-y-4">
              <div className="grid gap-3 lg:grid-cols-4">
                <label className="space-y-1.5 text-sm">
                  <span className="font-medium">Grupo</span>
                  <select className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm" value={values.groupId} onChange={(event) => changeGroup(event.target.value)} disabled={Boolean(editingId)}>
                    <option value="">Seleccionar</option>
                    {groups.map((group) => (
                      <option key={group.id} value={group.id}>
                        {group.name} · {group.ageRange}
                      </option>
                    ))}
                  </select>
                </label>
                {userRole === "ADMIN" ? (
                  <label className="space-y-1.5 text-sm">
                    <span className="font-medium">Docente responsable</span>
                    <select className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm" value={values.teacherId ?? ""} onChange={(event) => setValues((current) => ({ ...current, teacherId: event.target.value }))}>
                      <option value="">Seleccionar</option>
                      {teachers.map((teacher) => (
                        <option key={teacher.id} value={teacher.id}>
                          {teacher.displayName}
                        </option>
                      ))}
                    </select>
                  </label>
                ) : null}
                <label className="space-y-1.5 text-sm lg:col-span-2">
                  <span className="font-medium">Título</span>
                  <Input value={values.title} onChange={(event) => setValues((current) => ({ ...current, title: event.target.value }))} />
                </label>
                <label className="space-y-1.5 text-sm">
                  <span className="font-medium">Materia</span>
                  <Input value={values.subject ?? ""} onChange={(event) => setValues((current) => ({ ...current, subject: event.target.value }))} />
                </label>
                <label className="space-y-1.5 text-sm">
                  <span className="font-medium">Fecha</span>
                  <Input type="date" value={values.examDate} onChange={(event) => setValues((current) => ({ ...current, examDate: event.target.value }))} />
                </label>
                <label className="space-y-1.5 text-sm">
                  <span className="font-medium">Estado</span>
                  <select className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm" value={values.status} onChange={(event) => setValues((current) => ({ ...current, status: event.target.value as ExamStatusValue }))}>
                    <option value="DRAFT">Borrador</option>
                    <option value="PUBLISHED">Publicado</option>
                  </select>
                </label>
                <label className="space-y-1.5 text-sm lg:col-span-4">
                  <span className="font-medium">Descripción</span>
                  <Textarea rows={2} value={values.description ?? ""} onChange={(event) => setValues((current) => ({ ...current, description: event.target.value }))} />
                </label>
              </div>

              <div className="space-y-2 rounded-xl border border-slate-200 p-3">
                <div>
                  <p className="text-sm font-medium">Notas</p>
                  <p className="text-xs text-muted-foreground">
                    Debe cargarse una nota para cada alumno activo del grupo seleccionado.
                  </p>
                </div>
                <div className="max-h-72 overflow-y-auto rounded-lg border border-slate-200">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Alumno</TableHead>
                        <TableHead>Nota</TableHead>
                        <TableHead>Observaciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedGroupStudents.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={3} className="text-muted-foreground">
                            Este grupo no tiene alumnos activos.
                          </TableCell>
                        </TableRow>
                      ) : (
                        selectedGroupStudents.map((student) => {
                          const grade = values.grades.find((item) => item.studentId === student.id);

                          return (
                            <TableRow key={student.id}>
                              <TableCell className="font-medium">{student.lastName}, {student.firstName}</TableCell>
                              <TableCell className="w-28">
                                <Input
                                  type="number"
                                  min="0"
                                  max="100"
                                  step="0.01"
                                  value={grade?.score ?? 0}
                                  onChange={(event) => updateGrade(student.id, "score", event.target.value)}
                                />
                              </TableCell>
                              <TableCell>
                                <Input
                                  value={grade?.observations ?? ""}
                                  onChange={(event) => updateGrade(student.id, "observations", event.target.value)}
                                />
                              </TableCell>
                            </TableRow>
                          );
                        })
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
              {message ? <p className="text-sm text-destructive">{message}</p> : null}
            </ResponsiveDialogBody>
            <ResponsiveDialogFooter>
              <Button type="button" variant="outline" onClick={closeDialog} disabled={isPending}>
                Cancelar
              </Button>
              <Button type="button" onClick={onSubmit} disabled={isPending || selectedGroupStudents.length === 0}>
                {isPending ? "Guardando..." : "Guardar examen"}
              </Button>
            </ResponsiveDialogFooter>
          </div>
        </ResponsiveDialogContent>
      </ResponsiveDialog>
    </div>
  );
}
