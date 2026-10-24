import { PsychopedagogyClient } from "@/modules/psychopedagogy/components/psychopedagogy-client";
import { listPsychopedagogyStudentsForSuperadmin } from "@/modules/psychopedagogy/server/psychopedagogy.repository";

export async function PsychopedagogyView({ readOnly = false }: { userId: string; readOnly?: boolean }) {
  const students = await listPsychopedagogyStudentsForSuperadmin();
  return (
    <div className="space-y-5 [font-family:var(--font-montserrat)]">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Psicopedagogía</h1>
        <p className="mt-1 text-sm text-muted-foreground">{readOnly
          ? "Podés editar el estilo de aprendizaje y temperamento y crear bitácoras de observación y acompañamientos e intervenciones e instrumentos."
          : "Reportes psicopedagógicos de todos los alumnos, con fecha, título y texto libre."}</p>
      </div>
      <PsychopedagogyClient students={students} readOnly={readOnly} canEditLearning={readOnly} canEditFollowups={readOnly} canEditInterventions={readOnly} canEditInstruments={readOnly} />
    </div>
  );
}
