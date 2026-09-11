import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { AdministrationPeriod } from "@/modules/administration/server/administration.repository";
import { getAdministrationOverview } from "@/modules/administration/server/administration.repository";

type Props = { period: AdministrationPeriod; periodKey: string };

const money = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  maximumFractionDigits: 0,
});

const date = new Intl.DateTimeFormat("es-AR", { dateStyle: "medium" });

export async function AdministrationDashboardView({ period, periodKey }: Props) {
  const overview = await getAdministrationOverview(period);

  return (
    <div className="flex w-full flex-col gap-4">
      <header>
        <h1 className="text-2xl font-semibold text-slate-900">Administración</h1>
        <div className="mt-1 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-slate-600">
            Control consolidado del {date.format(period.from)} al {date.format(new Date(period.to.getTime() - 1))}.
          </p>
          <form className="flex items-center gap-2">
            <label className="text-xs text-slate-500" htmlFor="administration-month">Período</label>
            <input className="h-9 rounded-md border border-slate-300 bg-white px-2 text-sm" id="administration-month" name="month" type="month" defaultValue={periodKey} />
            <button className="h-9 rounded-md border border-slate-300 px-3 text-sm font-medium text-slate-700 hover:bg-slate-50" type="submit">Ver</button>
          </form>
        </div>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <Metric title="Cobrado a familias" value={money.format(overview.familyFinance.collected)} detail={`Cuotas emitidas: ${money.format(overview.familyFinance.charged)}`} />
        <Metric title="Deuda pendiente" value={money.format(overview.familyFinance.outstanding)} detail={`${overview.familyFinance.overdueFamilies} familias con saldo`} tone="warning" />
        <Metric title="Caja chica disponible" value={money.format(overview.cashFund.balance)} detail={`Movimiento del período: ${money.format(overview.cashFund.periodMovement)}`} />
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Pagos y deuda familiar</CardTitle></CardHeader>
          <CardContent className="space-y-4 text-sm">
            <dl className="grid grid-cols-2 gap-3">
              <Item label="Pagos anulados" value={money.format(overview.familyFinance.voided)} />
              <Item label="Condonaciones" value={money.format(overview.familyFinance.waived)} />
            </dl>
            <h3 className="font-medium text-slate-900">Mayores saldos pendientes</h3>
            {overview.familyFinance.largestDebts.length ? <div className="space-y-2">{overview.familyFinance.largestDebts.map((family) => <Row key={family.name} label={family.name} value={money.format(family.balance)} />)}</div> : <Empty>Sin saldos pendientes.</Empty>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Últimos cobros</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            {overview.familyFinance.recentPayments.length ? overview.familyFinance.recentPayments.map((payment) => <Row key={payment.id} label={`${payment.family.name} · ${payment.method} · ${payment.status}`} value={money.format(payment.amount)} />) : <Empty>Sin cobros para este período.</Empty>}
          </CardContent>
        </Card>
      </section>

      <section>
        <Card>
          <CardHeader><CardTitle>Caja chica y operaciones</CardTitle></CardHeader>
          <CardContent className="space-y-4 text-sm">
            <dl className="grid grid-cols-3 gap-3">
              <Item label="Rendiciones pendientes" value={String(overview.cashFund.pendingReports)} />
              <Item label="Monto pendiente" value={money.format(overview.cashFund.pendingAmount)} />
              <Item label="Grupos con presupuesto" value={String(overview.cashFund.configuredBudgets)} />
            </dl>
            <h3 className="font-medium text-slate-900">Últimos movimientos</h3>
            {overview.cashFund.recentEntries.length ? <div className="space-y-2">{overview.cashFund.recentEntries.map((entry) => <Row key={entry.id} label={`${entry.group?.name ?? "Sin grupo"} · ${entry.description}`} value={money.format(entry.amount)} />)}</div> : <Empty>Sin movimientos operativos.</Empty>}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

function Metric({ title, value, detail, tone }: { title: string; value: string; detail: string; tone?: "warning" }) {
  return <Card><CardContent className="p-5"><p className="text-sm font-medium text-slate-500">{title}</p><p className={`mt-1 text-2xl font-semibold tracking-tight ${tone === "warning" ? "text-amber-700" : "text-slate-950"}`}>{value}</p><p className="mt-2 text-xs text-slate-500">{detail}</p></CardContent></Card>;
}

function Item({ label, value }: { label: string; value: string }) {
  return <div><dt className="text-xs text-slate-500">{label}</dt><dd className="mt-1 font-semibold text-slate-900">{value}</dd></div>;
}

function Row({ label, value }: { label: string; value: string }) {
  return <div className="flex items-start justify-between gap-4 border-t pt-2 first:border-0 first:pt-0"><span className="min-w-0 text-slate-600">{label}</span><span className="shrink-0 font-medium text-slate-900">{value}</span></div>;
}

function Empty({ children }: { children: React.ReactNode }) {
  return <p className="py-2 text-sm text-slate-500">{children}</p>;
}