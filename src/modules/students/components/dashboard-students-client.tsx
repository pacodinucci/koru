"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Trash2 } from "lucide-react";
import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useFieldArray, useForm } from "react-hook-form";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
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
import {
  studentFormSchema,
  type StudentFormInput,
  type StudentGuardianRelationshipValue,
  type StudentStatusValue,
} from "@/modules/students/schemas/student.schema";
import { saveStudentAction } from "@/modules/students/server/student.actions";

type StudentStatus = StudentStatusValue;
type GuardianRelationship = StudentGuardianRelationshipValue;

type StudentGroup = {
  id: string;
  name: string;
  ageRange: string;
};

type TeacherOption = {
  id: string;
  displayName: string;
  email: string | null;
};

type FamilyUserOption = {
  id: string;
  name: string;
  email: string;
  role: string;
};

type Student = {
  id: string;
  firstName: string;
  lastName: string;
  birthDate: string;
  groupId: string;
  status: StudentStatus;
  notes: string | null;
  group: StudentGroup;
  teachers: TeacherOption[];
  guardians: Array<{
    id: string;
    email: string;
    relationship: GuardianRelationship;
    isPrimary: boolean;
    canPickup: boolean;
    emergencyContact: boolean;
    user: { id: string; name: string; email: string } | null;
  }>;
};

type DashboardStudentsClientProps = {
  students: Student[];
  groups: StudentGroup[];
  familyUsers: FamilyUserOption[];
};

const relationshipLabels: Record<GuardianRelationship, string> = {
  MOTHER: "Madre",
  FATHER: "Padre",
  TUTOR: "Tutor/a",
  GUARDIAN: "Responsable",
  OTHER: "Otro",
};

const statusLabels: Record<StudentStatus, string> = {
  ACTIVE: "Activo",
  INACTIVE: "Inactivo",
  GRADUATED: "Egresado",
};

const emptyValues: StudentFormInput = {
  firstName: "",
  lastName: "",
  birthDate: "",
  groupId: "",
  status: "ACTIVE",
  notes: "",
  guardians: [
    {
      email: "",
      relationship: "GUARDIAN",
      isPrimary: true,
      canPickup: false,
      emergencyContact: false,
    },
  ],
};

function calculateAge(birthDate: string) {
  const normalizedBirthDate = birthDate.slice(0, 10);
  const birth = new Date(`${normalizedBirthDate}T00:00:00`);
  if (Number.isNaN(birth.getTime())) {
    return "-";
  }
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age -= 1;
  }
  return `${age} años`;
}

function dateForInput(value: string) {
  return value.slice(0, 10);
}

function getMatchingFamilyUsers(
  familyUsers: FamilyUserOption[],
  query: string,
) {
  const normalizedQuery = query.trim().toLowerCase();

  if (normalizedQuery.length < 2) {
    return [];
  }

  return familyUsers
    .filter((user) => {
      const name = user.name.toLowerCase();
      const email = user.email.toLowerCase();

      return name.includes(normalizedQuery) || email.includes(normalizedQuery);
    })
    .slice(0, 6);
}

export function DashboardStudentsClient({
  students,
  groups,
  familyUsers,
}: DashboardStudentsClientProps) {
  const router = useRouter();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [groupFilter, setGroupFilter] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const form = useForm<StudentFormInput>({
    resolver: zodResolver(studentFormSchema),
    defaultValues: emptyValues,
  });
  const guardians = useFieldArray({ control: form.control, name: "guardians" });

  const editingStudent = useMemo(
    () => students.find((student) => student.id === editingId) ?? null,
    [editingId, students],
  );
  const filteredStudents = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    return students.filter((student) => {
      const matchesSearch = `${student.firstName} ${student.lastName}`
        .toLowerCase()
        .includes(normalizedSearch);
      const matchesGroup = groupFilter ? student.groupId === groupFilter : true;
      return matchesSearch && matchesGroup;
    });
  }, [groupFilter, search, students]);

  function resetForm() {
    setEditingId(null);
    setMessage(null);
    form.reset(emptyValues);
  }

  function openCreateDialog() {
    resetForm();
    setDialogOpen(true);
  }

  function closeDialog() {
    setDialogOpen(false);
    resetForm();
  }

  function handleDialogOpenChange(open: boolean) {
    setDialogOpen(open);
    if (!open) {
      resetForm();
    }
  }

  function editStudent(student: Student) {
    setEditingId(student.id);
    setMessage(null);
    form.reset({
      id: student.id,
      firstName: student.firstName,
      lastName: student.lastName,
      birthDate: dateForInput(student.birthDate),
      groupId: student.groupId,
      status: student.status,
      notes: student.notes ?? "",
      guardians: student.guardians.map((guardian) => ({
        email: guardian.email,
        relationship: guardian.relationship,
        isPrimary: guardian.isPrimary,
        canPickup: guardian.canPickup,
        emergencyContact: guardian.emergencyContact,
      })),
    });
    setDialogOpen(true);
  }

  function onSubmit(values: StudentFormInput) {
    setMessage(null);
    startTransition(async () => {
      const result = await saveStudentAction(values);
      if (result.ok) {
        closeDialog();
        router.refresh();
        return;
      }
      setMessage("No pudimos guardar el alumno. Revisá los datos e intentá de nuevo.");
    });
  }

  return (
    <div className="space-y-4">
      <Card size="sm">
        <CardHeader>
          <CardTitle>Alumnos</CardTitle>
          <CardAction>
            <Button type="button" size="sm" onClick={openCreateDialog}>
              <Plus />
              Nuevo alumno
            </Button>
          </CardAction>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-2 md:grid-cols-[minmax(0,1fr)_220px]">
            <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar por nombre o apellido" />
            <select className="h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm" value={groupFilter} onChange={(event) => setGroupFilter(event.target.value)}>
              <option value="">Todos los grupos</option>
              {groups.map((group) => (
                <option key={group.id} value={group.id}>
                  {group.name}
                </option>
              ))}
            </select>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Alumno</TableHead>
                <TableHead>Edad</TableHead>
                <TableHead>Grupo</TableHead>
                <TableHead>Docentes</TableHead>
                <TableHead>Familiares</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredStudents.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-muted-foreground">
                    Todavía no hay alumnos para mostrar.
                  </TableCell>
                </TableRow>
              ) : (
                filteredStudents.map((student) => (
                  <TableRow key={student.id}>
                    <TableCell className="font-medium">{student.lastName}, {student.firstName}</TableCell>
                    <TableCell>{calculateAge(student.birthDate)}</TableCell>
                    <TableCell>{student.group.name}</TableCell>
                    <TableCell>
                      <div className="max-w-56 truncate text-xs text-muted-foreground">
                        {student.teachers.length > 0
                          ? student.teachers.map((teacher) => teacher.displayName).join(", ")
                          : "-"}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="max-w-56 truncate text-xs text-muted-foreground">
                        {student.guardians.map((guardian) => guardian.email).join(", ")}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={student.status === "ACTIVE" ? "default" : "secondary"}>
                        {statusLabels[student.status]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button type="button" variant="outline" size="sm" onClick={() => editStudent(student)}>
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

      <ResponsiveDialog open={dialogOpen} onOpenChange={handleDialogOpenChange}>
        <ResponsiveDialogContent className="[font-family:var(--font-montserrat)] [&_*]:[font-family:var(--font-montserrat)]">
          <ResponsiveDialogHeader>
            <ResponsiveDialogTitle>
              {editingStudent ? "Editar alumno" : "Nuevo alumno"}
            </ResponsiveDialogTitle>
            <ResponsiveDialogDescription>
              Cargá los datos escolares y los familiares vinculados al alumno.
            </ResponsiveDialogDescription>
          </ResponsiveDialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="flex min-h-0 flex-1 flex-col overflow-hidden">
              <ResponsiveDialogBody className="space-y-4">
                <div className="grid gap-3 lg:grid-cols-4">
                  <FormField
                    control={form.control}
                    name="firstName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nombre</FormLabel>
                        <FormControl>
                          <Input placeholder="Nombre" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="lastName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Apellido</FormLabel>
                        <FormControl>
                          <Input placeholder="Apellido" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="birthDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Fecha de nacimiento</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="groupId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Grupo</FormLabel>
                        <FormControl>
                          <select className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm" {...field}>
                            <option value="">Seleccionar</option>
                            {groups.map((group) => (
                              <option key={group.id} value={group.id}>
                                {group.name} · {group.ageRange}
                              </option>
                            ))}
                          </select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Estado</FormLabel>
                        <FormControl>
                          <select className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm" {...field}>
                            {Object.entries(statusLabels).map(([value, label]) => (
                              <option key={value} value={value}>
                                {label}
                              </option>
                            ))}
                          </select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem className="lg:col-span-2">
                        <FormLabel>Notas</FormLabel>
                        <FormControl>
                          <Textarea
                            rows={1}
                            placeholder="Opcional"
                            className="h-8 min-h-8 resize-none py-1"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>



                <div className="space-y-3 rounded-xl border border-slate-200 p-3">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <p className="text-sm font-medium">Familiares vinculados</p>
                      <p className="text-xs text-muted-foreground">
                        Si el email no tiene usuario, se deja el vínculo pendiente y se crea invitación familiar.
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => guardians.append({ email: "", relationship: "GUARDIAN", isPrimary: false, canPickup: false, emergencyContact: false })}
                    >
                      <Plus />
                      Agregar
                    </Button>
                  </div>
                  {guardians.fields.map((guardian, index) => (
                    <div key={guardian.id} className="grid gap-2 rounded-lg bg-slate-50 p-2 lg:grid-cols-[minmax(0,1fr)_160px_repeat(3,auto)_auto] lg:items-end">
                      <FormField
                        control={form.control}
                        name={`guardians.${index}.email`}
                        render={({ field }) => {
                          const matches = getMatchingFamilyUsers(
                            familyUsers,
                            field.value,
                          );
                          const exactMatch = familyUsers.some(
                            (user) =>
                              user.email.toLowerCase() ===
                              field.value.trim().toLowerCase(),
                          );

                          return (
                            <FormItem>
                              <FormLabel>Buscar familiar o cargar email</FormLabel>
                              <FormControl>
                                <div className="space-y-1.5">
                                  <Input
                                    type="text"
                                    placeholder="Buscar por nombre, apellido o email"
                                    {...field}
                                  />
                                  {matches.length > 0 && !exactMatch ? (
                                    <div className="max-h-32 overflow-y-auto rounded-lg border border-slate-200 bg-white p-1 shadow-sm">
                                      {matches.map((user) => (
                                        <button
                                          key={user.id}
                                          type="button"
                                          className="flex w-full items-center justify-between gap-3 rounded-md px-2 py-1.5 text-left text-xs hover:bg-slate-100"
                                          onClick={() => field.onChange(user.email)}
                                        >
                                          <span className="min-w-0">
                                            <span className="block truncate font-medium">
                                              {user.name || user.email}
                                            </span>
                                            <span className="block truncate text-muted-foreground">
                                              {user.email}
                                            </span>
                                          </span>
                                          <span className="shrink-0 text-muted-foreground">
                                            Usar
                                          </span>
                                        </button>
                                      ))}
                                    </div>
                                  ) : null}
                                  {field.value.trim().length >= 2 && matches.length === 0 ? (
                                    <p className="text-xs text-muted-foreground">
                                      No existe ese familiar. Escribí el email completo para crear la invitación.
                                    </p>
                                  ) : null}
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          );
                        }}
                      />
                      <FormField
                        control={form.control}
                        name={`guardians.${index}.relationship`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Vínculo</FormLabel>
                            <FormControl>
                              <select className="h-8 w-full rounded-lg border border-input bg-white px-2.5 text-sm" {...field}>
                                {Object.entries(relationshipLabels).map(([value, label]) => (
                                  <option key={value} value={value}>
                                    {label}
                                  </option>
                                ))}
                              </select>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      {(["isPrimary", "canPickup", "emergencyContact"] as const).map((name) => (
                        <FormField
                          key={name}
                          control={form.control}
                          name={`guardians.${index}.${name}`}
                          render={({ field }) => (
                            <FormItem className="flex items-center gap-2 space-y-0 pb-1">
                              <FormControl>
                                <input
                                  type="checkbox"
                                  className="size-4 rounded border-slate-300"
                                  checked={Boolean(field.value)}
                                  onChange={(event) => field.onChange(event.target.checked)}
                                />
                              </FormControl>
                              <FormLabel className="text-xs">
                                {name === "isPrimary"
                                  ? "Principal"
                                  : name === "canPickup"
                                    ? "Retira"
                                    : "Emergencia"}
                              </FormLabel>
                            </FormItem>
                          )}
                        />
                      ))}
                      <Button
                        type="button"
                        variant="outline"
                        size="icon-sm"
                        onClick={() => guardians.remove(index)}
                        disabled={guardians.fields.length === 1}
                      >
                        <Trash2 />
                        <span className="sr-only">Quitar familiar</span>
                      </Button>
                    </div>
                  ))}
                </div>
                {message ? <p className="text-sm text-destructive">{message}</p> : null}
              </ResponsiveDialogBody>
              <ResponsiveDialogFooter>
                <Button type="button" variant="outline" onClick={closeDialog} disabled={isPending}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={isPending}>
                  {isPending ? "Guardando..." : "Guardar alumno"}
                </Button>
              </ResponsiveDialogFooter>
            </form>
          </Form>
        </ResponsiveDialogContent>
      </ResponsiveDialog>
    </div>
  );
}
