import { PsychopedagogyClient } from "@/modules/psychopedagogy/components/psychopedagogy-client";
import { listTeacherHomeData } from "@/modules/teachers/server/teachers.repository";

export async function PsychopedagogyView({ userId }: { userId: string }) {
  const { students } = await listTeacherHomeData(userId);
  return (
    <div className="space-y-5 [font-family:var(--font-montserrat)]">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Psicopedagogía</h1>
        <p className="mt-1 text-sm text-muted-foreground">Tus bitácoras por alumno, con fecha, título y texto libre.</p>
      </div>
      <PsychopedagogyClient students={students} />
    </div>
  );
}
