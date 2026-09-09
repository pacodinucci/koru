import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { prisma } from "@/lib/prisma";
import { isAdminRole, isSuperAdminRole, type AppUserRole } from "@/modules/auth/roles";
import { CashExpenseAttachmentUpload } from "@/modules/operations/components/cash-expense-attachment-upload";
import { cancelCashExpenseReportAction, createCashFundAdminDebitAction, createCashFundCategoryAction, createExtraCashFundAllocationAction, decideCashExpenseReportAction, reverseCashFundEntryAction, setDefaultCashFundMonthlyAmountAction, setTeacherCashFundBudgetAction, submitCashExpenseReportAction } from "@/modules/operations/server/cash-fund.actions";
import { getTeacherCashFundBalance, listCashFundCategories, listCashFundConfiguration, listCashFundEntriesForAdmin, listCashFundReportsForReview, listTeacherCashExpenseReports, listTeachersWithCashFundBudget } from "@/modules/operations/server/cash-fund.repository";

type Props = { user: { id: string; role: AppUserRole } };
type ReactFormAction = (formData: FormData) => void | Promise<void>;
const fieldClass = "h-9 rounded-md border border-slate-300 bg-white px-3 text-sm";
const formAction = (action: (...args: never[]) => Promise<unknown>) => action as unknown as ReactFormAction;

export async function CashFundDashboardView({ user }: Props) {
  const admin = isAdminRole(user.role);
  const superAdmin = isSuperAdminRole(user.role);
  const teacher = await prisma.teacherProfile.findUnique({ where: { userId: user.id }, select: { id: true } });
  const [categories, teachers, settings, pendingReports, balance, reports, entries] = await Promise.all([
    listCashFundCategories(),
    admin ? listTeachersWithCashFundBudget() : Promise.resolve([]),
    admin ? listCashFundConfiguration() : Promise.resolve(null),
    admin ? listCashFundReportsForReview() : Promise.resolve([]),
    teacher ? getTeacherCashFundBalance(teacher.id) : Promise.resolve(0),
    teacher ? listTeacherCashExpenseReports(teacher.id) : Promise.resolve([]),
    admin ? listCashFundEntriesForAdmin() : Promise.resolve([]),
  ]);

  return <div className="flex max-w-6xl flex-col gap-6">
    <header><h1 className="text-2xl font-semibold text-slate-900">Caja chica</h1><p className="mt-1 text-sm text-slate-600">Saldos, rendiciones y movimientos auditables.</p></header>

    {teacher ? <section className="grid gap-4 lg:grid-cols-2">
      <Card><CardHeader><CardTitle>Mi saldo</CardTitle></CardHeader><CardContent>
        <p className="text-3xl font-semibold">${balance.toFixed(2)} MXN</p>
        <form action={formAction(submitCashExpenseReportAction)} className="mt-4 grid gap-2">
          <select className={fieldClass} name="categoryId" required><option value="">Categoría</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select>
          <input className={fieldClass} name="amount" type="number" min="0.01" step="0.01" placeholder="Monto" required />
          <input className={fieldClass} name="concept" placeholder="Concepto" required />
          <textarea className="rounded-md border border-slate-300 p-3 text-sm" name="justification" placeholder="Justificación" required />
          <input className={fieldClass} name="expenseDate" type="date" required />
          <Button type="submit">Enviar rendición</Button>
        </form>
      </CardContent></Card>
      <Card><CardHeader><CardTitle>Mis rendiciones</CardTitle></CardHeader><CardContent className="space-y-3 text-sm">
        {reports.length ? reports.map((report) => <article key={report.id} className="space-y-2 border-t pt-3 first:border-0 first:pt-0">
          <div className="flex flex-wrap items-start justify-between gap-2"><div><p className="font-medium">{report.concept}</p><p className="text-slate-600">{report.category.name} · ${Number(report.requestedAmount).toFixed(2)} · {report.status}</p></div>
          {report.status === "PENDING" ? <form action={formAction(cancelCashExpenseReportAction.bind(null, report.id))}><Button size="sm" type="submit" variant="outline">Cancelar</Button></form> : null}</div>
          {report.status === "PENDING" ? <CashExpenseAttachmentUpload reportId={report.id} /> : null}
          {report.decisionReason ? <p className="text-xs text-slate-500">{report.decisionReason}</p> : null}
        </article>) : <p className="text-slate-500">Todavía no hay rendiciones.</p>}
      </CardContent></Card>
    </section> : null}

    {admin ? <Card><CardHeader><CardTitle>Rendiciones pendientes ({pendingReports.length})</CardTitle></CardHeader><CardContent className="space-y-4 text-sm">
      {pendingReports.length ? pendingReports.map((report) => <form key={report.id} action={formAction(decideCashExpenseReportAction)} className="grid gap-2 border-t pt-4 first:border-0 first:pt-0">
        <input type="hidden" name="reportId" value={report.id} /><p className="font-medium">{report.teacher.displayName} · {report.concept}</p>
        <p className="text-slate-600">{report.category.name} · solicitado ${Number(report.requestedAmount).toFixed(2)} · {report.attachments.length} adjunto(s)</p>
        <input className={fieldClass} name="approvedAmount" type="number" min="0" max={Number(report.requestedAmount)} step="0.01" defaultValue={Number(report.requestedAmount)} required />
        <input className={fieldClass} name="reason" placeholder="Motivo si hay diferencia" /><Button type="submit" variant="outline">Resolver rendición</Button>
      </form>) : <p className="text-slate-500">No hay rendiciones pendientes.</p>}
    </CardContent></Card> : null}

    {superAdmin ? <section className="grid gap-4 lg:grid-cols-2">
      <Card><CardHeader><CardTitle>Configuración</CardTitle></CardHeader><CardContent className="space-y-5">
        <form action={formAction(setDefaultCashFundMonthlyAmountAction)} className="flex gap-2"><input className={fieldClass} name="amount" type="number" min="0.01" step="0.01" defaultValue={settings ? Number(settings.defaultMonthlyAmount) : ""} placeholder="Presupuesto mensual base" required /><Button type="submit">Guardar base</Button></form>
        <form action={formAction(createCashFundCategoryAction)} className="flex gap-2"><input className={fieldClass} name="name" placeholder="Nueva categoría" required /><Button type="submit" variant="outline">Agregar categoría</Button></form>
        {teachers.map((item) => <form key={item.id} action={formAction(setTeacherCashFundBudgetAction)} className="flex gap-2"><input type="hidden" name="teacherId" value={item.id} /><span className="min-w-36 self-center text-sm">{item.displayName}</span><input className={fieldClass} name="monthlyAmount" type="number" min="0.01" step="0.01" defaultValue={item.cashFundBudget ? Number(item.cashFundBudget.monthlyAmount) : ""} placeholder="Excepción mensual" required /><Button type="submit" variant="outline">Aplicar</Button></form>)}
      </CardContent></Card>
      <Card><CardHeader><CardTitle>Movimiento administrativo</CardTitle></CardHeader><CardContent className="space-y-5">
        <CashMovementForm action={createExtraCashFundAllocationAction} label="Acreditación extraordinaria" button="Acreditar" teachers={teachers} />
        <CashMovementForm action={createCashFundAdminDebitAction} label="Débito" button="Registrar débito" teachers={teachers} />
      </CardContent></Card>
    </section> : null}

    {admin ? <Card><CardHeader><CardTitle>Historial de movimientos</CardTitle></CardHeader><CardContent className="space-y-4">
      {entries.length ? entries.map((entry) => <div key={entry.id} className="flex items-center justify-between gap-3 border-t pt-3 text-sm first:border-0 first:pt-0"><div><p className="font-medium">{entry.teacher.displayName} · {entry.type}</p><p className="text-slate-600">{entry.description} · ${Number(entry.amount).toFixed(2)}</p></div>{entry.type !== "REVERSAL" && !entry.isReversed ? <form action={formAction(reverseCashFundEntryAction.bind(null, entry.id))}><Button size="sm" type="submit" variant="outline">Revertir</Button></form> : <span className="text-xs text-slate-500">{entry.isReversed ? "Revertido" : "Reversión"}</span>}</div>) : <p className="text-sm text-slate-500">Todavía no hay movimientos.</p>}
    </CardContent></Card> : null}
  </div>;
}

function CashMovementForm({ action, label, button, teachers }: { action: (...args: never[]) => Promise<unknown>; label: string; button: string; teachers: Array<{ id: string; displayName: string }> }) {
  return <form action={formAction(action)} className="grid gap-2 border-t pt-4 first:border-0 first:pt-0">
    <select className={fieldClass} name="teacherId" required><option value="">Docente</option>{teachers.map((teacher) => <option key={teacher.id} value={teacher.id}>{teacher.displayName}</option>)}</select>
    <input className={fieldClass} name="amount" type="number" min="0.01" step="0.01" placeholder={label} required /><input className={fieldClass} name="description" placeholder="Motivo" required /><Button type="submit" variant="outline">{button}</Button>
  </form>;
}
