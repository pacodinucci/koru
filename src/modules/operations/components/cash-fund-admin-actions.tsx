"use client";

import { MinusCircle, PlusCircle, Settings2 } from "lucide-react";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { optimizeImageForUpload } from "@/modules/media/client/optimize-image";
import { ResponsiveDialog, ResponsiveDialogBody, ResponsiveDialogContent, ResponsiveDialogDescription, ResponsiveDialogFooter, ResponsiveDialogHeader, ResponsiveDialogTitle, ResponsiveDialogTrigger } from "@/components/ui/responsive-dialog";
import { createCashFundAdminDebitAction, createExtraCashFundAllocationAction, setCashFundGroupBudgetAction, setCashFundRenewalFrequencyAction } from "@/modules/operations/server/cash-fund.actions";

type Group = { id: string; name: string; amountPerPeriod: number | null };
type RenewalFrequency = "WEEKLY" | "BIWEEKLY" | "MONTHLY";
type ActionKind = "credit" | "debit";

const actionConfig = {
  credit: { title: "Acreditar fondos", description: "Sumá fondos al saldo disponible de un grupo.", amountLabel: "Monto a acreditar", buttonLabel: "Acreditar fondos", action: createExtraCashFundAllocationAction, icon: PlusCircle },
  debit: { title: "Registrar débito", description: "Descontá un importe del saldo de un grupo dejando registro del motivo.", amountLabel: "Monto a debitar", buttonLabel: "Registrar débito", action: createCashFundAdminDebitAction, icon: MinusCircle },
} satisfies Record<ActionKind, { title: string; description: string; amountLabel: string; buttonLabel: string; action: (formData: FormData) => Promise<{ ok: boolean; message: string }>; icon: typeof PlusCircle }>;

export function CashFundAdminActions({ groups, renewalFrequency, canOperate, canConfigure }: { groups: Group[]; renewalFrequency: RenewalFrequency; canOperate: boolean; canConfigure: boolean }) {
  return <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:justify-end">
    {canOperate ? <CashFundActionDialog kind="credit" groups={groups} /> : null}
    {canOperate ? <CashFundActionDialog kind="debit" groups={groups} /> : null}
    {canConfigure ? <CashFundConfigurationDialog groups={groups} renewalFrequency={renewalFrequency} /> : null}
  </div>;
}

function CashFundActionDialog({ kind, groups }: { kind: ActionKind; groups: Group[] }) {
  const config = actionConfig[kind]; const Icon = config.icon; const router = useRouter();
  const [open, setOpen] = useState(false); const [pending, startTransition] = useTransition(); const [message, setMessage] = useState("");
  const [receiptImage, setReceiptImage] = useState<File | null>(null); const [isOptimizingImage, setIsOptimizingImage] = useState(false);
  function submit(event: React.FormEvent<HTMLFormElement>) { event.preventDefault(); const form = event.currentTarget; const data = new FormData(form); if (kind === "debit") { data.delete("receiptImage"); if (receiptImage) data.set("receiptImage", receiptImage); } setMessage(""); startTransition(async () => { const result = await config.action(data); setMessage(result.message); if (result.ok) { form.reset(); setReceiptImage(null); router.refresh(); } }); }
  return <ResponsiveDialog open={open} onOpenChange={(next) => { setOpen(next); if (!next) { setMessage(""); setReceiptImage(null); } }}>
    <ResponsiveDialogTrigger render={<Button type="button" variant={kind === "credit" ? "default" : "outline"} className="w-full justify-center sm:w-auto" />}><Icon className="size-4" />{config.buttonLabel}</ResponsiveDialogTrigger>
    <ResponsiveDialogContent className="font-montserrat md:max-w-md"><ResponsiveDialogHeader><ResponsiveDialogTitle>{config.title}</ResponsiveDialogTitle><ResponsiveDialogDescription>{config.description}</ResponsiveDialogDescription></ResponsiveDialogHeader>
      <form onSubmit={submit} className="contents"><ResponsiveDialogBody className="grid gap-4">
        <div className="grid gap-2"><Label htmlFor={`${kind}-group`}>Grupo</Label><select id={`${kind}-group`} name="groupId" className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm" required autoFocus><option value="">Seleccionar grupo</option>{groups.map((group) => <option key={group.id} value={group.id}>{group.name}</option>)}</select></div>
        <div className="grid gap-2"><Label htmlFor={`${kind}-amount`}>{config.amountLabel}</Label><Input id={`${kind}-amount`} name="amount" type="number" min="0.01" step="0.01" inputMode="decimal" placeholder="0,00" required /></div>
        <div className="grid gap-2"><Label htmlFor={`${kind}-description`}>{kind === "debit" ? "Comprobante (descripción)" : "Motivo"}</Label><Input id={`${kind}-description`} name="description" minLength={2} maxLength={300} placeholder="Detalle del movimiento" required /></div>
        {kind === "debit" ? <div className="grid gap-2"><Label htmlFor="debit-receipt-image">Comprobante (imagen)</Label><Input id="debit-receipt-image" name="receiptImage" type="file" accept="image/*" disabled={isOptimizingImage} onChange={async (event) => { const file = event.target.files?.[0]; setReceiptImage(null); if (!file) return; setIsOptimizingImage(true); try { setReceiptImage(await optimizeImageForUpload(file)); } finally { setIsOptimizingImage(false); } }} /><p className="text-xs text-slate-500">La imagen se optimiza antes de subirse.</p></div> : null}
        {message ? <p role="status" className="text-sm text-slate-600">{message}</p> : null}
      </ResponsiveDialogBody><ResponsiveDialogFooter><Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button><Button type="submit" disabled={pending || isOptimizingImage || groups.length === 0}>{pending ? "Guardando…" : config.buttonLabel}</Button></ResponsiveDialogFooter></form>
    </ResponsiveDialogContent>
  </ResponsiveDialog>;
}

function CashFundConfigurationDialog({ groups, renewalFrequency }: { groups: Group[]; renewalFrequency: RenewalFrequency }) {
  const router = useRouter(); const [open, setOpen] = useState(false); const [pending, startTransition] = useTransition(); const [message, setMessage] = useState("");
  function submit(event: React.FormEvent<HTMLFormElement>) { event.preventDefault(); const data = new FormData(event.currentTarget); setMessage(""); startTransition(async () => { const [budget, frequency] = await Promise.all([setCashFundGroupBudgetAction(data), setCashFundRenewalFrequencyAction(data)]); const result = !budget.ok ? budget : frequency; setMessage(result.message); if (budget.ok && frequency.ok) router.refresh(); }); }
  return <ResponsiveDialog open={open} onOpenChange={(next) => { setOpen(next); if (!next) setMessage(""); }}><ResponsiveDialogTrigger render={<Button type="button" variant="outline" className="w-full justify-center sm:w-auto" />}><Settings2 className="size-4" />Configuración</ResponsiveDialogTrigger>
    <ResponsiveDialogContent className="font-montserrat md:max-w-md"><ResponsiveDialogHeader><ResponsiveDialogTitle>Presupuesto de grupo</ResponsiveDialogTitle><ResponsiveDialogDescription>Definí el importe que recibe cada grupo en cada período de renovación.</ResponsiveDialogDescription></ResponsiveDialogHeader>
      <form onSubmit={submit} className="contents"><ResponsiveDialogBody className="grid gap-4"><div className="grid gap-2"><Label htmlFor="cash-fund-budget-group">Grupo</Label><select id="cash-fund-budget-group" name="groupId" className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm" required><option value="">Seleccionar grupo</option>{groups.map((group) => <option key={group.id} value={group.id}>{group.name}</option>)}</select></div><div className="grid gap-2"><Label htmlFor="cash-fund-period-amount">Presupuesto por período</Label><Input id="cash-fund-period-amount" name="amountPerPeriod" type="number" min="0.01" step="0.01" inputMode="decimal" placeholder="0,00" required /></div><div className="grid gap-2"><Label htmlFor="cash-fund-renewal-frequency">Frecuencia de renovación</Label><select id="cash-fund-renewal-frequency" name="renewalFrequency" className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm" defaultValue={renewalFrequency} required><option value="WEEKLY">Semanal</option><option value="BIWEEKLY">Quincenal</option><option value="MONTHLY">Mensual</option></select></div>{message ? <p role="status" className="text-sm text-slate-600">{message}</p> : null}</ResponsiveDialogBody><ResponsiveDialogFooter><Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button><Button type="submit" disabled={pending || groups.length === 0}>{pending ? "Guardando…" : "Guardar configuración"}</Button></ResponsiveDialogFooter></form>
    </ResponsiveDialogContent>
  </ResponsiveDialog>;
}
