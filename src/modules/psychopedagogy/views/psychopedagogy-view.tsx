import { PsychopedagogyClient } from "@/modules/psychopedagogy/components/psychopedagogy-client";
import { listTeacherHomeData } from "@/modules/teachers/server/teachers.repository";
import { listPsychopedagogyStudentsForSuperadmin } from "@/modules/psychopedagogy/server/psychopedagogy.repository";

export async function PsychopedagogyView({ userId, readOnly = false }: { userId: string; readOnly?: boolean }) {
  const students = readOnly
    ? await listPsychopedagogyStudentsForSuperadmin()
    : (await listTeacherHomeData(userId)).students;
  return (
    <div className="space-y-5 [font-family:var(--font-montserrat)]">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Psicopedagogía</h1>
        <p className="mt-1 text-sm text-muted-foreground">{readOnly
          ? "Bitácoras de todos los alumnos, en modo de solo lectura."
          : "Tus bitácoras por alumno, con fecha, título y texto libre."}</p>
      </div>
      <PsychopedagogyClient students={students} readOnly={readOnly} />
    </div>
  );
}
