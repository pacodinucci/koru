"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { teacherFormSchema, type TeacherFormInput } from "@/modules/teachers/schemas/teacher.schema";
import { updateTeacherProfileAction } from "@/modules/teachers/server/teacher.actions";

type StudentGroup = {
  id: string;
  name: string;
  ageRange: string;
};

type Teacher = {
  id: string;
  displayName: string;
  email: string | null;
  phone: string | null;
  bio: string | null;
  isActive: boolean;
  user: { id: string; name: string; email: string; role: string } | null;
  groups: StudentGroup[];
  studentsCount: number;
};

type DashboardTeachersClientProps = {
  teachers: Teacher[];
  groups: StudentGroup[];
};

const emptyValues: TeacherFormInput = {
  id: "",
  phone: "",
  bio: "",
  isActive: true,
  groupIds: [],
};

export function DashboardTeachersClient({ teachers, groups }: DashboardTeachersClientProps) {
  const router = useRouter();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const form = useForm<TeacherFormInput>({
    resolver: zodResolver(teacherFormSchema),
    defaultValues: emptyValues,
  });

  const editingTeacher = useMemo(
    () => teachers.find((teacher) => teacher.id === editingId) ?? null,
    [editingId, teachers],
  );

  function resetForm() {
    setEditingId(null);
    setMessage(null);
    form.reset(emptyValues);
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

  function editTeacher(teacher: Teacher) {
    setEditingId(teacher.id);
    setMessage(null);
    form.reset({
      id: teacher.id,
      phone: teacher.phone ?? "",
      bio: teacher.bio ?? "",
      isActive: teacher.isActive,
      groupIds: teacher.groups.map((group) => group.id),
    });
    setDialogOpen(true);
  }

  function onSubmit(values: TeacherFormInput) {
    setMessage(null);
    startTransition(async () => {
      const result = await updateTeacherProfileAction(values);
      if (result.ok) {
        closeDialog();
        router.refresh();
        return;
      }
      setMessage("No pudimos guardar el perfil docente. Revisá los datos e intentá de nuevo.");
    });
  }

  return (
    <div className="space-y-4">
      <Card size="sm">
        <CardHeader>
          <CardTitle>Docentes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-muted-foreground">
            Los docentes se crean asignando el rol <span className="font-medium text-slate-700">Docente</span> desde Usuarios.
            Esta pantalla gestiona el perfil extendido y los grupos responsables.
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Usuario</TableHead>
                <TableHead>Alumnos</TableHead>
                <TableHead>Grupos</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {teachers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-muted-foreground">
                    Todavía no hay usuarios con rol docente.
                  </TableCell>
                </TableRow>
              ) : (
                teachers.map((teacher) => (
                  <TableRow key={teacher.id}>
                    <TableCell className="font-medium">{teacher.displayName}</TableCell>
                    <TableCell>{teacher.email ?? teacher.user?.email ?? "-"}</TableCell>
                    <TableCell>{teacher.user?.email ?? "Sin usuario vinculado"}</TableCell>
                    <TableCell>{teacher.studentsCount}</TableCell>
                    <TableCell>
                      <div className="max-w-56 truncate text-xs text-muted-foreground">
                        {teacher.groups.length > 0
                          ? teacher.groups.map((group) => group.name).join(", ")
                          : "-"}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={teacher.isActive ? "default" : "secondary"}>
                        {teacher.isActive ? "Activo" : "Inactivo"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button type="button" variant="outline" size="sm" onClick={() => editTeacher(teacher)}>
                        Editar perfil
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
        <ResponsiveDialogContent className="md:w-[min(calc(100vw-2rem),42rem)] [font-family:var(--font-montserrat)] [&_*]:[font-family:var(--font-montserrat)]">
          <ResponsiveDialogHeader>
            <ResponsiveDialogTitle>Editar perfil docente</ResponsiveDialogTitle>
            <ResponsiveDialogDescription>
              {editingTeacher
                ? `${editingTeacher.displayName} · ${editingTeacher.email ?? editingTeacher.user?.email ?? "sin email"}`
                : "Actualizá los datos extendidos del docente."}
            </ResponsiveDialogDescription>
          </ResponsiveDialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="flex min-h-0 flex-1 flex-col overflow-hidden">
              <ResponsiveDialogBody className="space-y-4">
                <div className="grid gap-3 lg:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Teléfono</FormLabel>
                        <FormControl>
                          <Input placeholder="Opcional" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="isActive"
                    render={({ field }) => (
                      <FormItem className="flex items-center gap-2 space-y-0 pt-6">
                        <FormControl>
                          <input
                            type="checkbox"
                            className="size-4 rounded border-slate-300"
                            checked={field.value}
                            onChange={(event) => field.onChange(event.target.checked)}
                          />
                        </FormControl>
                        <FormLabel>Docente activo</FormLabel>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="bio"
                    render={({ field }) => (
                      <FormItem className="lg:col-span-2">
                        <FormLabel>Notas</FormLabel>
                        <FormControl>
                          <Textarea rows={3} placeholder="Notas internas o bio breve" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="groupIds"
                  render={({ field }) => {
                    const selectedGroupIds = new Set(field.value);

                    return (
                      <FormItem className="space-y-3 rounded-xl border border-slate-200 p-3">
                        <div>
                          <FormLabel>Grupos responsables</FormLabel>
                          <p className="mt-1 text-xs text-muted-foreground">
                            Estos grupos habilitan al docente a cargar exámenes y notas.
                          </p>
                        </div>
                        <FormControl>
                          <div className="max-h-40 space-y-1.5 overflow-y-auto pr-1">
                            {groups.map((group) => {
                              const checked = selectedGroupIds.has(group.id);

                              return (
                                <label
                                  key={group.id}
                                  className="flex min-h-8 cursor-pointer items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-sm transition-colors hover:bg-slate-100"
                                >
                                  <input
                                    type="checkbox"
                                    className="size-3.5 rounded border-slate-300"
                                    checked={checked}
                                    onChange={(event) => {
                                      if (event.target.checked) {
                                        field.onChange([...field.value, group.id]);
                                        return;
                                      }

                                      field.onChange(field.value.filter((id) => id !== group.id));
                                    }}
                                  />
                                  <span className="min-w-0">
                                    <span className="truncate font-medium leading-tight">
                                      {group.name}
                                    </span>
                                    <span className="ml-2 truncate text-xs text-muted-foreground">
                                      {group.ageRange}
                                    </span>
                                  </span>
                                </label>
                              );
                            })}
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    );
                  }}
                />
                {message ? <p className="text-sm text-destructive">{message}</p> : null}
              </ResponsiveDialogBody>
              <ResponsiveDialogFooter>
                <Button type="button" variant="outline" onClick={closeDialog} disabled={isPending}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={isPending}>
                  {isPending ? "Guardando..." : "Guardar perfil"}
                </Button>
              </ResponsiveDialogFooter>
            </form>
          </Form>
        </ResponsiveDialogContent>
      </ResponsiveDialog>
    </div>
  );
}