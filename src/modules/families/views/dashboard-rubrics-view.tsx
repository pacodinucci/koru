import { RubricCatalog } from "@/modules/families/components/rubric-catalog";
import { listBillingRubricsForAdmin } from "@/modules/families/server/rubrics.repository";

export async function DashboardRubricsView({ canManage }: { canManage: boolean }) {
  const rubrics = await listBillingRubricsForAdmin();

  return (
    <div className="flex w-full min-w-0 flex-col gap-4">
      <div>
        <h1 className="font-[family-name:var(--font-montserrat)] text-2xl font-semibold text-slate-900">Rubros</h1>
        <p className="mt-1 text-sm text-slate-600">Administrá los conceptos y sus importes totales para armar los cargos de cada alumno.</p>
      </div>
      <RubricCatalog canManage={canManage} rubrics={rubrics.map((rubric) => ({ id: rubric.id, name: rubric.name, amount: rubric.amount.toString(), isActive: rubric.isActive }))} />
    </div>
  );
}
