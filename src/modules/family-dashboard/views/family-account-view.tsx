import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { getFamilyAccountForUser } from "@/modules/family-dashboard/server/family-account.repository";
import { annualPlanInstallment } from "@/modules/families/lib/annual-plan";

type FamilyAccount = NonNullable<Awaited<ReturnType<typeof getFamilyAccountForUser>>>;

const typeLabels = { MONTHLY_CHARGE: "Cuota básica", EVENTUAL_CHARGE: "Cargo eventual", PAYMENT: "Pago", PAYMENT_REVERSAL: "Anulación", BALANCE_WAIVER: "Condonación" } as const;
const methodLabels = { CASH: "Efectivo", BANK_TRANSFER: "Transferencia", CARD: "Tarjeta", OTHER: "Otro" } as const;

function currency(value: number | string) {
  return new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS" }).format(Number(value));
}

function monthlyNet(plan: { installmentCount: number; annualFee: { toString(): string }; discountPercent: { toString(): string } }) {
  return annualPlanInstallment(plan.annualFee.toString(), plan.discountPercent.toString(), plan.installmentCount).netAmount;
}

export function FamilyAccountView({ account }: { account: FamilyAccount | null }) {
  if (!account) return <Card className="mx-auto max-w-2xl"><CardHeader><CardTitle>Mi cuenta</CardTitle><CardDescription>Todavía no tenés una familia asignada.</CardDescription></CardHeader><CardContent><p className="text-sm text-muted-foreground">Cuando administración complete la asignación, vas a poder consultar tus movimientos y recibos desde acá.</p></CardContent></Card>;

  return <div className="mx-auto flex w-full max-w-5xl flex-col gap-4">
    <div><h1 className="text-2xl font-semibold text-slate-900">Mi cuenta</h1><p className="mt-1 text-sm text-slate-600">Consultá el estado de la cuenta corriente de {account.name}.</p></div>
    <div className="grid gap-4 sm:grid-cols-2"><Card><CardHeader><CardDescription>Saldo actual</CardDescription><CardTitle className={account.balance > 0 ? "text-amber-700" : "text-emerald-700"}>{currency(account.balance)}</CardTitle></CardHeader><CardContent><p className="text-xs text-muted-foreground">Un saldo positivo indica un importe pendiente.</p></CardContent></Card><Card><CardHeader><CardDescription>Planes de alumn@s</CardDescription><CardTitle>{currency(account.students.reduce((total, student) => total + (student.plan?.isActive ? Number(monthlyNet(student.plan)) : 0), 0))}</CardTitle></CardHeader><CardContent><p className="text-sm text-muted-foreground">Cuota mensual total de la familia (planes activos)</p>{account.students.map((student) => <p key={student.id} className="text-sm text-muted-foreground">{student.firstName} {student.lastName}: {student.plan ? student.plan.isActive ? `${student.plan.name} · ${currency(monthlyNet(student.plan))}${student.plan.discountPercent.isZero() ? "" : ` (${student.plan.discountPercent}% desc.)`}` : `${student.plan.name} · Inactivo (no se cobra)` : "Sin plan asignado"}</p>)}</CardContent></Card></div>
    <Card><CardHeader><CardTitle>Movimientos</CardTitle><CardDescription>Todos los cargos, pagos y ajustes de la cuenta.</CardDescription></CardHeader><CardContent><div className="overflow-x-auto rounded-xl border border-slate-200"><table className="w-full min-w-[660px] text-sm"><thead className="bg-slate-50 text-left text-xs text-slate-600"><tr><th className="px-3 py-2 font-medium">Fecha</th><th className="px-3 py-2 font-medium">Tipo</th><th className="px-3 py-2 font-medium">Detalle</th><th className="px-3 py-2 text-right font-medium">Importe</th><th className="px-3 py-2 font-medium">Comprobante</th></tr></thead><tbody>{account.accountEntries.length === 0 ? <tr><td colSpan={5} className="px-3 py-8 text-center text-muted-foreground">Todavía no hay movimientos registrados.</td></tr> : account.accountEntries.map((entry) => { const receipt = entry.payment?.receipt; const isReceiptAvailable = entry.payment?.status === "REGISTERED" && receipt?.status === "ACTIVE" && receipt.pdfUrl; return <tr key={entry.id} className="border-t border-slate-100"><td className="px-3 py-2 text-slate-600">{entry.occurredAt.toLocaleDateString("es-AR")}</td><td className="px-3 py-2"><Badge variant={entry.payment?.status === "VOIDED" ? "destructive" : "secondary"}>{entry.payment?.status === "VOIDED" ? "Pago anulado" : typeLabels[entry.type]}</Badge></td><td className="px-3 py-2"><p>{entry.description}</p>{entry.discountAmount && entry.discountAmount.toNumber() > 0 ? <p className="text-xs text-slate-500">Original {currency(entry.grossAmount?.toString() ?? entry.amount.toString())} · descuento {currency(entry.discountAmount.toString())}</p> : null}{entry.payment ? <p className="text-xs text-slate-500">{methodLabels[entry.payment.method]}{entry.payment.reference ? ` · ${entry.payment.reference}` : ""}</p> : null}</td><td className={`px-3 py-2 text-right font-medium ${Number(entry.amount) > 0 ? "text-amber-700" : "text-emerald-700"}`}>{currency(entry.amount.toString())}</td><td className="px-3 py-2">{isReceiptAvailable ? <Button nativeButton={false} render={<Link href={`/api/receipts/${receipt.id}/download`}>Descargar recibo #{receipt.number}</Link>} size="sm" variant="outline"/> : <span className="text-xs text-slate-500">{entry.payment?.status === "VOIDED" ? "Anulado" : "-"}</span>}</td></tr>; })}</tbody></table></div></CardContent></Card>
  </div>;
}
