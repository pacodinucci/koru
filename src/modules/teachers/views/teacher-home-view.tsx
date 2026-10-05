import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { AuthenticatedUser } from "@/modules/auth/server/auth-guards";
import { TeacherStudentsTable } from "@/modules/teachers/components/teacher-students-table";
import { listTeacherHomeData } from "@/modules/teachers/server/teachers.repository";

export async function TeacherHomeView({ user }: { user: AuthenticatedUser }) {
  const { groups, students } = await listTeacherHomeData(user.id);

  return (
    <div className="space-y-4 [font-family:var(--font-montserrat)]">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Inicio</h1>
        <p className="mt-1 text-sm text-muted-foreground">Tus cursos asignados y los alumnos que los integran.</p>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Mis cursos</CardTitle></CardHeader>
        <CardContent>
          <Table><TableHeader><TableRow><TableHead>Curso</TableHead><TableHead>Edad</TableHead><TableHead className="text-right">Alumnos activos</TableHead></TableRow></TableHeader><TableBody>
            {groups.length === 0 ? <TableRow><TableCell colSpan={3} className="text-muted-foreground">Todavía no tenés cursos asignados.</TableCell></TableRow> : groups.map((group) => (
              <TableRow key={group.id}><TableCell className="font-medium">{group.name}</TableCell><TableCell>{group.ageRange}</TableCell><TableCell className="text-right">{group._count.students}</TableCell></TableRow>
            ))}
          </TableBody></Table>
        </CardContent>
      </Card>

      <Card id="alumnos">
        <CardHeader><CardTitle className="text-base">Mis alumnos</CardTitle></CardHeader>
        <CardContent>
          <TeacherStudentsTable students={students} />
        </CardContent>
      </Card>
    </div>
  );
}
