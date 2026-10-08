"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { previewFamilyBillingAction, regularizeFamilyBillingAction } from "@/modules/families/server/student-billing.actions";
type Preview = Awaited<ReturnType<typeof previewFamilyBillingAction>>;
export function FamilyBillingPreview({ familyId }: { familyId: string }) {
 const [preview, setPreview] = useState<Preview | null>(null);
 const [message, setMessage] = useState("");
 const [pending, startTransition] = useTransition(); const router = useRouter();
 const total = preview?.charges.reduce((sum, c) => sum + Math.round(Number(c.amount) * 100), 0) ?? 0;
 const currency = (amount: number) => amount.toLocaleString("es-AR", { style: "currency", currency: "ARS" });
 return <section className="space-y-3 rounded-xl border border-slate-200 p-4">
  <h3 className="font-medium">Cargos por alumno</h3>
  <p className="text-sm text-slate-600">La cuenta familiar suma la cuota y los rubros de cada alumno. Revisá los cargos faltantes del año actual antes de cargar pagos. Para alumnos sin historial identificado, se tomará su plan actual desde su mes de inicio; verificá que corresponda a esos períodos.</p>
  <Button disabled={pending} variant="outline" onClick={() => startTransition(async () => { setMessage(""); try { setPreview(await previewFamilyBillingAction(familyId)); } catch { setMessage("No se pudo preparar la vista previa. Intentá nuevamente."); } })}>Revisar cargos faltantes</Button>
  {preview ? <div className="space-y-2">
   {preview.warnings.map(w => <p key={w} className="text-sm text-amber-800" role="alert">{w}</p>)}
   <p className="text-sm">{preview.schedules} cronogramas nuevos · {preview.charges.length} cargos vencidos · total a agregar: {currency(total / 100)}</p>
   {preview.charges.length ? <div className="max-h-80 overflow-auto"><table className="w-full min-w-[600px] text-sm"><thead><tr><th className="text-left">Alumno</th><th className="text-left">Concepto</th><th className="text-left">Período</th><th className="text-right">Importe</th></tr></thead><tbody>{preview.charges.map((c, i) => <tr key={i}><td>{c.student}</td><td>{c.concept}</td><td>{c.period}</td><td className="text-right">{currency(Number(c.amount))}</td></tr>)}</tbody></table></div> : null}
   <Button disabled={pending || preview.warnings.length > 0 || (!preview.schedules && !preview.charges.length)} onClick={() => startTransition(async () => { try { const result = await regularizeFamilyBillingAction(familyId, preview.token); setMessage(result.message); setPreview(null); if(result.ok) router.refresh(); } catch { setMessage("No se pudo completar. Volvé a revisar antes de reintentar."); setPreview(null); } })}>Confirmar cargos y cronogramas</Button>
  </div> : null}
  {message ? <p role="status" className="text-sm">{message}</p> : null}
 </section>;
}
