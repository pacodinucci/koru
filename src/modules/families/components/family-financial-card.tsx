"use client";

import { ExternalLink } from "lucide-react";
import { useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { registerFamilyPaymentAction, voidFamilyPaymentAction, waiveFamilyBalanceAction } from "@/modules/families/server/family-account.actions";

type FinancialEntry = { id: string; type: "MONTHLY_CHARGE" | "PAYMENT" | "PAYMENT_REVERSAL" | "BALANCE_WAIVER"; amount: string; description: string; occurredAt: string; payment: { id: string; method: "CASH" | "BANK_TRANSFER" | "CARD" | "OTHER"; reference: string | null; status: "REGISTERED" | "VOIDED"; receipt: { id: string; status: "ACTIVE" | "VOIDED"; pdfUrl: string | null; number: number } | null } | null };
type FamilyFinancialCardProps = { family: { id: string; name: string; balance: string; entries: FinancialEntry[] }; canWaive: boolean };

const typeLabels: Record<FinancialEntry["type"], string> = { MONTHLY_CHARGE: "Cargo", PAYMENT: "Pago", PAYMENT_REVERSAL: "Anulación", BALANCE_WAIVER: "Condonación" };
const methodLabels: Record<NonNullable<FinancialEntry["payment"]>["method"], string> = { CASH: "Efectivo", BANK_TRANSFER: "Transferencia", CARD: "Tarjeta", OTHER: "Otro" };
function currency(value: string | number) { return new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS" }).format(Number(value)); }
function EntryStatus({ entry }: { entry: FinancialEntry }) { if (entry.payment?.status === "VOIDED") return <Badge variant="destructive">Anulado</Badge>; if (entry.type === "BALANCE_WAIVER") return <Badge variant="secondary">Condonado</Badge>; return <Badge variant="secondary">Registrado</Badge>; }

export function FamilyFinancialCard({ family, canWaive }: FamilyFinancialCardProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  function submit(event: FormEvent<HTMLFormElement>, action: (data: FormData) => Promise<{ ok: boolean; message: string }>) {
    event.preventDefault(); const form = event.currentTarget; setMessage(null);
    startTransition(async () => { const result = await action(new FormData(form)); setMessage(result.message); if (result.ok) { form.reset(); router.refresh(); } });
  }
  function voidPayment(event: FormEvent<HTMLFormElement>) { if (!window.confirm("¿Querés anular este pago? El saldo se revertirá y el recibo quedará invalidado.")) { event.preventDefault(); return; } submit(event, voidFamilyPaymentAction); }

  return <section className="space-y-4 border-t border-slate-200 pt-4">
    <div className="flex flex-wrap items-end justify-between gap-3"><div><h3 className="font-medium text-slate-900">Ficha financiera</h3><p className="text-xs text-slate-600">Cuenta corriente, pagos, cargos y comprobantes de {family.name}.</p></div><div className="rounded-xl bg-slate-100 px-3 py-2 text-right"><p className="text-xs text-slate-600">Saldo actual</p><p className={`font-semibold ${Number(family.balance) > 0 ? "text-amber-700" : "text-emerald-700"}`}>{currency(family.balance)}</p></div></div>
    <div className="grid gap-3 xl:grid-cols-2">
      <form onSubmit={(event) => submit(event, registerFamilyPaymentAction)} className="grid gap-2 rounded-xl border border-slate-200 p-3 md:grid-cols-[minmax(0,1fr)_160px_160px_auto] md:items-end"><input type="hidden" name="familyId" value={family.id}/><label className="grid gap-1 text-xs font-medium text-slate-700">Importe<Input name="amount" type="number" min="0.01" step="0.01" required/></label><label className="grid gap-1 text-xs font-medium text-slate-700">Medio<select name="method" defaultValue="BANK_TRANSFER" className="h-9 rounded-md border border-input bg-background px-3 text-sm"><option value="CASH">Efectivo</option><option value="BANK_TRANSFER">Transferencia</option><option value="CARD">Tarjeta</option><option value="OTHER">Otro</option></select></label><label className="grid gap-1 text-xs font-medium text-slate-700">Referencia<Input name="reference" maxLength={160} placeholder="Opcional"/></label><Button disabled={isPending} type="submit">Registrar pago</Button></form>
    </div>
    {canWaive && Number(family.balance) > 0 ? <form onSubmit={(event) => submit(event, waiveFamilyBalanceAction)} className="grid gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 md:grid-cols-[minmax(0,1fr)_160px_auto] md:items-end"><input type="hidden" name="familyId" value={family.id}/><label className="grid gap-1 text-xs font-medium text-amber-900">Motivo de condonación<Textarea name="reason" minLength={2} maxLength={300} required rows={1} className="min-h-9 resize-none"/></label><label className="grid gap-1 text-xs font-medium text-amber-900">Importe máximo {currency(family.balance)}<Input name="amount" type="number" min="0.01" max={family.balance} step="0.01" required/></label><Button disabled={isPending} type="submit" variant="outline">Condonar saldo</Button></form> : null}
    {message ? <p className="text-sm text-slate-700" role="status">{message}</p> : null}
    <div className="overflow-x-auto rounded-xl border border-slate-200"><table className="w-full min-w-[720px] text-sm"><thead className="bg-slate-50 text-left text-xs text-slate-600"><tr><th className="px-3 py-2 font-medium">Fecha</th><th className="px-3 py-2 font-medium">Tipo</th><th className="px-3 py-2 font-medium">Detalle</th><th className="px-3 py-2 text-right font-medium">Importe</th><th className="px-3 py-2 font-medium">Estado</th><th className="px-3 py-2 font-medium">Acciones</th></tr></thead><tbody>{family.entries.length === 0 ? <tr><td colSpan={6} className="px-3 py-6 text-center text-slate-600">Todavía no hay movimientos registrados.</td></tr> : family.entries.map((entry) => <tr key={entry.id} className="border-t border-slate-100"><td className="px-3 py-2 text-slate-600">{new Date(entry.occurredAt).toLocaleDateString("es-AR")}</td><td className="px-3 py-2">{typeLabels[entry.type]}</td><td className="px-3 py-2"><p>{entry.description}</p>{entry.payment ? <p className="text-xs text-slate-500">{methodLabels[entry.payment.method]}{entry.payment.reference ? ` · ${entry.payment.reference}` : ""}</p> : null}</td><td className={`px-3 py-2 text-right font-medium ${Number(entry.amount) > 0 ? "text-amber-700" : "text-emerald-700"}`}>{currency(entry.amount)}</td><td className="px-3 py-2"><EntryStatus entry={entry}/></td><td className="px-3 py-2"><div className="flex flex-wrap gap-2">{entry.payment?.receipt?.pdfUrl && entry.payment.receipt.status === "ACTIVE" ? <Button nativeButton={false} render={<a href={`/api/receipts/${entry.payment.receipt.id}/download`} target="_blank" rel="noreferrer"/>} size="sm" variant="outline"><ExternalLink/>Recibo #{entry.payment.receipt.number}</Button> : null}{entry.payment?.status === "REGISTERED" ? <form onSubmit={voidPayment} className="flex gap-1"><input type="hidden" name="paymentId" value={entry.payment.id}/><Input name="reason" minLength={2} maxLength={300} required placeholder="Motivo" className="h-8 w-32"/><Button disabled={isPending} type="submit" size="sm" variant="destructive">Anular</Button></form> : null}</div></td></tr>)}</tbody></table></div>
  </section>;
}