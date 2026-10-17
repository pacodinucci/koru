"use client";

import { PackagePlus, Trash2 } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  ResponsiveDialog, ResponsiveDialogBody, ResponsiveDialogContent,
  ResponsiveDialogFooter, ResponsiveDialogHeader,
  ResponsiveDialogTitle, ResponsiveDialogTrigger,
} from "@/components/ui/responsive-dialog";
import type { InvoiceProduct } from "@/modules/operations/domain/inventory-invoice";
import { createInvoiceProductAction } from "@/modules/operations/server/inventory-invoice.actions";
import {
  addManualLine, confirmationPayload, createReview, editReviewHeader, editReviewLine, emptyReview,
  failReview, invoiceFileError, lockReview, removeReviewLine, setReviewed,
  type InvoiceReview, type ReviewLine,
} from "@/modules/operations/components/inventory-invoice-review";

import { InventoryIntakeCamera } from "@/modules/operations/components/inventory-intake-camera";
import { INVOICE_FILE_ACCEPT, prepareInvoiceFile } from "@/modules/operations/components/inventory-intake-files";

type Phase = "idle" | "prepare" | "analysis" | "confirm" | "product-form" | "product";
type Mode = "camera" | "file" | "manual";
const intakeModes = [["camera", "Tomar foto"], ["file", "Subir archivo"], ["manual", "Carga manual"]] as const;
const CREATE_PRODUCT = "__create_product__";
const confidenceLabels = { high: "Alta", medium: "Media", low: "Baja" };
const selectStyle = "h-10 w-full min-w-0 rounded-md border border-slate-300 bg-white px-3 text-sm";
const cellInputStyle = "h-10 w-full min-w-0 appearance-none rounded-none border-0 bg-transparent px-3 text-sm shadow-none outline-none focus:border-0 focus:outline-none focus:ring-0 focus-visible:border-0 focus-visible:outline-none focus-visible:ring-0";

export function InventoryInvoiceImport({ products, canConfigure }: {
  products: InvoiceProduct[];
  canConfigure: boolean;
}) {
  const router = useRouter();
  const id = useId();
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState("");
  const [review, setReview] = useState<InvoiceReview>(emptyReview(""));
  const [mode, setMode] = useState<Mode>("file");
  const [createdProducts, setCreatedProducts] = useState<InvoiceProduct[]>([]);
  const [productRow, setProductRow] = useState<number | null>(null);
  const [productError, setProductError] = useState("");
  const [phase, setPhase] = useState<Phase>("idle");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const reviewRef = useRef<InvoiceReview>(review);
  const fileRef = useRef<File | null>(null);
  const busy = useRef<Phase>("idle");
  const sequence = useRef(0);
  const controller = useRef<AbortController | null>(null);
  const confirmationBody = useRef<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const catalog = [...products, ...createdProducts.filter((created) => !products.some((product) => product.id === created.id))];
  const editingDisabled = phase !== "idle" || review.locked;
  const hasLines = review.lines.length > 0;

  useEffect(() => () => {
    if (preview) URL.revokeObjectURL(preview);
  }, [preview]);

  useEffect(() => () => {
    sequence.current += 1;
    controller.current?.abort();
  }, []);

  function updateReview(next: InvoiceReview) {
    reviewRef.current = next;
    setReview(next);
  }

  function cancelAnalysis() {
    sequence.current += 1;
    controller.current?.abort();
    controller.current = null;
    if (busy.current === "analysis" || busy.current === "prepare") {
      busy.current = "idle";
      setPhase("idle");
    }
  }

  async function changeFile(next: File | null, source: "camera" | "file" = "file") {
    if (!next || reviewRef.current.locked || reviewRef.current.lines.length || !["idle", "analysis", "prepare"].includes(busy.current)) return;
    cancelAnalysis();
    const request = ++sequence.current;
    busy.current = "prepare";
    setPhase("prepare");
    setMode(source);
    fileRef.current = null;
    setFile(null);
    setPreview("");
    setError("");
    setMessage("");
    try {
      const prepared = await prepareInvoiceFile(next);
      if (request !== sequence.current || reviewRef.current.locked) return;
      const problem = invoiceFileError(prepared);
      if (problem) throw new Error(problem);
      fileRef.current = prepared;
      setFile(prepared);
      setPreview(URL.createObjectURL(prepared));
    } catch (cause) {
      if (request === sequence.current) setError(cause instanceof Error ? cause.message : "No se pudo preparar el archivo.");
    } finally {
      if (request === sequence.current) { busy.current = "idle"; setPhase("idle"); }
    }
  }

  function switchMode(next: Mode) {
    if (reviewRef.current.locked || !["idle", "analysis", "prepare"].includes(busy.current)) return;
    if (next === mode) return;
    cancelAnalysis();
    clearConsumedDraft();
    if (next === "manual") {
      let initial = emptyReview("", reviewRef.current);
      for (let index = 0; index < 5; index++) initial = addManualLine(initial, crypto.randomUUID());
      updateReview(initial);
    }
    setMode(next);
    setOpen(true);
    setError("");
    setMessage("");
  }

  function navigateTabs(event: React.KeyboardEvent<HTMLButtonElement>, current: Mode) {
    if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
    event.preventDefault();
    if (reviewRef.current.locked || !["idle", "analysis", "prepare"].includes(busy.current)) return;
    const index = intakeModes.findIndex(([value]) => value === current);
    const nextIndex = event.key === "Home" ? 0 : event.key === "End" ? intakeModes.length - 1
      : (index + (event.key === "ArrowRight" ? 1 : -1) + intakeModes.length) % intakeModes.length;
    const next = intakeModes[nextIndex][0];
    switchMode(next);
    event.currentTarget.parentElement?.querySelector<HTMLButtonElement>(`[data-mode="${next}"]`)?.focus();
  }

  async function analyze() {
    const selected = fileRef.current;
    if (!selected || mode === "manual" || reviewRef.current.locked || reviewRef.current.lines.length || busy.current !== "idle") return;
    const problem = invoiceFileError(selected);
    if (problem) { setError(problem); return; }
    busy.current = "analysis";
    setPhase("analysis");
    setError("");
    setMessage("");
    const request = ++sequence.current;
    const abort = new AbortController();
    controller.current = abort;
    const body = new FormData();
    body.set("file", selected);
    try {
      const response = await fetch("/api/operations/inventory/invoice", { method: "POST", body, signal: abort.signal });
      const result = await response.json();
      if (request !== sequence.current || abort.signal.aborted || reviewRef.current.locked || reviewRef.current.lines.length) return;
      if (!response.ok || result.ok !== true) throw new Error(typeof result.message === "string" ? result.message : "No se pudo analizar la factura.");
      updateReview(createReview(result.draft, crypto.randomUUID(), reviewRef.current));
      setMessage("Interpretación lista. Revisá cada línea antes de confirmar el ingreso.");
    } catch (cause) {
      if (request === sequence.current && !abort.signal.aborted) {
        setError(cause instanceof Error ? cause.message : "No se pudo analizar la factura. Volvé a intentar.");
      }
    } finally {
      if (request === sequence.current) {
        busy.current = "idle";
        controller.current = null;
        setPhase("idle");
      }
    }
  }

  function editLine(index: number, patch: Partial<Pick<ReviewLine, "productId" | "quantity" | "unitCost" | "included">>) {
    if (busy.current !== "idle" || !reviewRef.current) return;
    updateReview(editReviewLine(reviewRef.current, index, patch, crypto.randomUUID()));
    setError("");
    setMessage("");
  }

  function editHeader(patch: Partial<Pick<InvoiceReview, "supplier" | "date" | "totalAmount" | "invoiceNumber">>) {
    if (busy.current !== "idle" || !reviewRef.current) return;
    updateReview(editReviewHeader(reviewRef.current, patch, crypto.randomUUID()));
    setError("");
    setMessage("");
  }

  function chooseProduct(index: number, value: string) {
    if (busy.current !== "idle" || reviewRef.current.locked) return;
    if (value !== CREATE_PRODUCT) { editLine(index, { productId: value }); return; }
    if (!canConfigure || !reviewRef.current.lines[index]?.included) return;
    busy.current = "product-form";
    setPhase("product-form");
    setProductError("");
    setProductRow(index);
  }

  function cancelProductCreation() {
    if (busy.current !== "product-form") return;
    setProductRow(null);
    setProductError("");
    busy.current = "idle";
    setPhase("idle");
  }

  async function createProduct(event: React.FormEvent<HTMLFormElement>, index: number) {
    event.preventDefault();
    if (!canConfigure || busy.current !== "product-form" || productRow !== index || !reviewRef.current || reviewRef.current.locked) return;
    const form = event.currentTarget;
    const data = new FormData(form);
    busy.current = "product";
    setPhase("product");
    setProductError("");
    let created = false;
    try {
      const result = await createInvoiceProductAction(data);
      if (!result.ok) { setProductError(result.message); return; }
      setCreatedProducts((current) => [...current.filter((product) => product.id !== result.product.id), result.product]);
      if (reviewRef.current) updateReview(editReviewLine(reviewRef.current, index, { productId: result.product.id }, crypto.randomUUID()));
      setMessage(`${result.message} Ingresá la cantidad en la unidad del nuevo producto. El stock todavía no cambió.`);
      form.reset();
      created = true;
      setProductRow(null);
    } catch {
      setProductError("No se pudo verificar la creación del producto. Revisá el catálogo antes de volver a crearlo.");
    } finally {
      busy.current = created ? "idle" : "product-form";
      setPhase(created ? "idle" : "product-form");
    }
  }

  function clearConsumedDraft(resetTotal = false) {
    confirmationBody.current = null;
    updateReview(emptyReview("", resetTotal ? { ...reviewRef.current, totalAmount: "" } : reviewRef.current));
    fileRef.current = null;
    setFile(null);
    setPreview("");
    if (fileInput.current) fileInput.current.value = "";
  }

  async function confirm() {
    const current = reviewRef.current;
    if (!current || busy.current !== "idle") return;
    if (!current.locked || !confirmationBody.current) {
      const result = confirmationPayload(current, catalog);
      if (!result.ok) { setError(result.message); return; }
      confirmationBody.current = JSON.stringify(result.payload);
    }
    const bodySnapshot = confirmationBody.current;
    busy.current = "confirm";
    setPhase("confirm");
    updateReview(lockReview(current));
    setError("");
    setMessage("");
    try {
      const response = await fetch("/api/operations/inventory/invoice/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: bodySnapshot,
      });
      const body = await response.json();
      if (response.ok && body.ok === true) {
        clearConsumedDraft(true);
        setMessage(typeof body.message === "string" ? body.message : "Ingreso registrado.");
        router.refresh();
      } else if (body.ok === false && typeof body.message === "string") {
        // Only these endpoint responses prove rejection before any stock commit.
        // Server failures (and batch conflicts) cannot safely release retry identity.
        const verifiedRejection = response.status === 400 || response.status === 403;
        updateReview(failReview(current, !verifiedRejection));
        if (!current.locked && verifiedRejection) confirmationBody.current = null;
        setError(body.message);
      } else {
        throw new Error("Respuesta no verificable");
      }
    } catch {
      updateReview(failReview(current, true));
      setError("No pudimos verificar el ingreso. No edites ni vuelvas a cargar esta factura: reintentá la misma confirmación para evitar duplicar stock. No recargues la página.");
    } finally {
      busy.current = "idle";
      setPhase("idle");
    }
  }

  const validation = confirmationPayload(review, catalog);
  const canConfirm = validation.ok || (review.locked && confirmationBody.current !== null);
  return (
    <ResponsiveDialog open={open} onOpenChange={(next) => {
      if (busy.current === "confirm" || busy.current === "product" || busy.current === "product-form") return;
      if (!next) cancelAnalysis();
      setOpen(next);
    }}>
      <ResponsiveDialogTrigger render={<Button type="button" className="w-full justify-center sm:w-auto" />}>
        <PackagePlus className="size-4" />Registrar ingreso
      </ResponsiveDialogTrigger>
      <ResponsiveDialogContent className="font-montserrat md:max-w-3xl" showCloseButton={phase !== "confirm" && phase !== "product" && phase !== "product-form"}>
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle>Registrar ingreso</ResponsiveDialogTitle>
        </ResponsiveDialogHeader>
        <ResponsiveDialogBody className="grid gap-5" aria-busy={phase !== "idle"}>
          <div role="tablist" aria-label="Forma de ingreso" className="grid grid-cols-3 border-b border-slate-300">
            {intakeModes.map(([value, label]) => <button key={value} type="button" role="tab" id={`${id}-tab-${value}`} data-mode={value} aria-controls={`${id}-panel-${value}`} aria-selected={mode === value} tabIndex={mode === value ? 0 : -1} disabled={review.locked || phase === "confirm" || phase === "product" || phase === "product-form"} onClick={() => switchMode(value)} onKeyDown={(event) => navigateTabs(event, value)} className={`-mb-px min-h-11 border-b-2 px-2 py-3 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-600 disabled:opacity-50 sm:px-4 ${mode === value ? "border-violet-700 bg-violet-50 text-violet-900" : "border-transparent text-slate-600 hover:bg-slate-50"}`}>{label}</button>)}
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="grid gap-2"><Label htmlFor={`${id}-supplier`}>Proveedor</Label><Input id={`${id}-supplier`} value={review.supplier} required disabled={editingDisabled} maxLength={200} onChange={(event) => editHeader({ supplier: event.target.value })} /></div>
            <div className="grid gap-2"><Label htmlFor={`${id}-date`}>Fecha del ingreso</Label><Input id={`${id}-date`} type="date" value={review.date} required disabled={editingDisabled} onChange={(event) => editHeader({ date: event.target.value })} /></div>
          </div>
          {mode !== "manual" ? <div className="grid gap-2"><Label htmlFor={`${id}-total`}>Total de la compra</Label><Input id={`${id}-total`} type="number" min="0" max="9999999999.99" step="0.01" inputMode="decimal" value={review.totalAmount} required disabled={editingDisabled} onChange={(event) => editHeader({ totalAmount: event.target.value })} /></div> : null}
          {intakeModes.map(([panelMode]) => <section key={panelMode} role="tabpanel" id={`${id}-panel-${panelMode}`} aria-labelledby={`${id}-tab-${panelMode}`} hidden={mode !== panelMode} tabIndex={0} className="min-w-0 space-y-5 focus-visible:outline-2 focus-visible:outline-violet-600">
          {mode === panelMode ? <>
          {mode === "camera" ? <InventoryIntakeCamera active={open && !hasLines && !file} onCapture={(photo) => changeFile(photo, "camera")} onCancel={() => switchMode("file")} onChooseFile={() => switchMode("file")} /> : null}
          {!hasLines && (mode === "file" || (mode === "camera" && file)) ? <section className="grid gap-4" aria-label={mode === "camera" ? "Foto capturada" : "Archivo de la factura"}>
            {mode === "file" ? <div className="grid min-w-0 gap-2">
              <Label htmlFor={`${id}-file`}>Elegir imagen, PDF o planilla</Label>
              <Input ref={fileInput} id={`${id}-file`} type="file" accept={INVOICE_FILE_ACCEPT} disabled={review.locked} onChange={(event) => changeFile(event.target.files?.[0] ?? null)} />
            </div> : <Button type="button" variant="outline" disabled={phase !== "idle" || review.locked} onClick={() => { clearConsumedDraft(); setError(""); setMessage(""); }}>Volver a tomar foto</Button>}
            {file ? <div className="grid gap-2 rounded-lg border p-3">
              <p className="break-all text-sm">{file.name} · {(file.size / 1024 / 1024).toFixed(2)} MB</p>
              {preview && file.type.startsWith("image/") ? (
                // Local blob preview; no remote image optimization or upload before analysis.
                <picture><img src={preview} alt="Vista previa de la factura seleccionada" className="max-h-56 max-w-full rounded object-contain" /></picture>
              ) : null}
              {preview && file.type === "application/pdf" ? <a href={preview} target="_blank" rel="noreferrer" className="text-sm underline">Abrir vista previa del PDF</a> : null}
            </div> : null}
            <Button type="button" disabled={!file || phase !== "idle"} onClick={analyze}>{phase === "analysis" ? "Analizando…" : "Analizar factura"}</Button>
            {phase === "analysis" ? <Button type="button" variant="outline" onClick={cancelAnalysis}>Cancelar análisis</Button> : null}
          </section> : null}
          {hasLines || mode === "manual" ? <>
            {review.warnings.length ? <ul aria-label="Advertencias de interpretación" className="list-inside list-disc rounded border border-amber-300 p-3 text-sm">{review.warnings.map((warning, index) => <li key={index}>{warning}</li>)}</ul> : null}
            <div className="grid gap-2"><Label htmlFor={`${id}-number`}>Número de factura (opcional)</Label><Input id={`${id}-number`} value={review.invoiceNumber} disabled={editingDisabled} maxLength={100} onChange={(event) => editHeader({ invoiceNumber: event.target.value })} /></div>
            {mode === "manual" ? <>
              <div className="min-w-0 overflow-x-auto">
                <div className="grid min-w-[440px] grid-cols-[minmax(0,1fr)_2.5rem] items-start gap-2">
                <div className="border border-slate-300">
                <table className="w-full table-fixed border-collapse text-left text-sm" aria-label="Productos del ingreso manual">
                  <thead className="bg-slate-100"><tr className="h-11"><th scope="col" className="w-3/4 border-b border-r border-slate-300 px-3 py-2">Producto</th><th scope="col" className="w-1/4 border-b border-slate-300 px-3 py-2">Cantidad</th></tr></thead>
                  <tbody>{review.lines.map((line, index) => {
                    return <tr key={index} id={`${id}-manual-row-${index}`} className="h-11 border-t border-slate-300">
                      <td className="border-r border-slate-300 p-0 focus-within:bg-violet-50"><select id={`${id}-line-${index}-product`} aria-label={`Producto de la fila ${index + 1}`} className={cellInputStyle} value={line.productId} disabled={editingDisabled} onChange={(event) => chooseProduct(index, event.target.value)}>
                        <option value="">Seleccionar producto</option>
                        {catalog.map((item) => <option key={item.id} value={item.id}>{item.name} · {item.unit}</option>)}
                        {canConfigure ? <option value={CREATE_PRODUCT}>Crear producto</option> : null}
                      </select></td>
                      <td className="p-0 focus-within:bg-violet-50"><input className={cellInputStyle} id={`${id}-line-${index}-quantity`} aria-label={`Cantidad de la fila ${index + 1}`} type="number" min="0.001" max="999999999.999" step="0.001" inputMode="decimal" value={line.quantity} disabled={editingDisabled} onChange={(event) => editLine(index, { quantity: event.target.value })} />
                      </td>
                    </tr>;
                  })}</tbody>
                </table>
                </div>
                <div role="group" aria-label="Eliminar filas" className="grid auto-rows-[44px] pt-px">
                  <div aria-hidden="true" />
                  {review.lines.map((_, index) => <div key={index} className="flex items-center justify-center">
                    <Button type="button" variant="ghost" size="icon" aria-label={`Quitar línea ${index + 1}`} title={`Quitar línea ${index + 1}`} aria-controls={`${id}-manual-row-${index}`} disabled={editingDisabled} onClick={() => {
                      if (busy.current === "idle") updateReview(removeReviewLine(reviewRef.current, index, crypto.randomUUID()));
                    }}><Trash2 className="size-4" aria-hidden={true} /></Button>
                  </div>)}
                </div>
                </div>
              </div>
              <Button type="button" variant="outline" disabled={editingDisabled} onClick={() => {
                if (busy.current === "idle") updateReview(addManualLine(reviewRef.current, crypto.randomUUID()));
              }}>Agregar producto</Button>
              <div className="ml-auto grid w-full gap-2 sm:max-w-xs"><Label htmlFor={`${id}-total`}>Total de la compra</Label><Input id={`${id}-total`} type="number" min="0" max="9999999999.99" step="0.01" inputMode="decimal" value={review.totalAmount} required disabled={editingDisabled} onChange={(event) => editHeader({ totalAmount: event.target.value })} /></div>
            </> : review.lines.map((line, index) => {
              const rowId = `${id}-line-${index}`;
              const product = catalog.find((item) => item.id === line.productId);
              const suggestedProduct = catalog.find((item) => item.id === line.original.productId);
              return <section key={index} className="grid min-w-0 gap-3 rounded-lg border border-slate-200 p-3" aria-labelledby={`${rowId}-title`}>
                <h3 id={`${rowId}-title`} className="break-words font-semibold">{index + 1}. {line.manual ? product?.name ?? "Seleccionar producto" : line.original.description}</h3>
                {!line.manual ? <><p className="text-sm text-slate-600">Factura: {line.original.invoiceQuantity ?? "Cantidad desconocida"} {line.original.invoiceUnit ?? "(unidad desconocida)"} · Confianza: {confidenceLabels[line.original.confidence]}</p>
                <p className="text-sm text-slate-600">Sugerencia original: {suggestedProduct ? `${suggestedProduct.name} (${suggestedProduct.unit})` : "Sin producto identificado"} · Stock: {line.original.stockQuantity ?? "Sin resolver"} · Conversión: {line.original.unitsPerInvoiceUnit ?? "Desconocida"} unidades de catálogo por unidad de factura.</p>
                {line.original.note ? <p className="text-sm text-amber-800">{line.original.note}</p> : null}</> : null}
                <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={line.included} disabled={editingDisabled} onChange={(event) => editLine(index, { included: event.target.checked })} />Incluir línea {index + 1}</label>
                <fieldset disabled={editingDisabled || !line.included} className="grid min-w-0 gap-3 sm:grid-cols-2">
                  <legend className="sr-only">Revisión de línea {index + 1}</legend>
                  <div className="grid min-w-0 gap-2 sm:col-span-2">
                    <Label htmlFor={`${rowId}-product`}>Producto del catálogo</Label>
                    <select id={`${rowId}-product`} className={selectStyle} value={line.productId} onChange={(event) => chooseProduct(index, event.target.value)}>
                      <option value="">Seleccionar producto</option>
                      {line.productId && !product ? <option value={line.productId}>Producto desconocido: seleccioná uno válido</option> : null}
                      {catalog.map((item) => <option key={item.id} value={item.id}>{item.name} · {item.unit}</option>)}
                      {canConfigure && line.included ? <option value={CREATE_PRODUCT}>Crear producto</option> : null}
                    </select>
                  </div>
                  <div className="grid gap-2"><Label htmlFor={`${rowId}-quantity`}>Cantidad de stock ({product?.unit ?? "seleccioná producto"})</Label><Input id={`${rowId}-quantity`} type="number" min="0.001" max="999999999.999" step="0.001" inputMode="decimal" value={line.quantity} onChange={(event) => editLine(index, { quantity: event.target.value })} /></div>
                  <div className="grid gap-2"><Label htmlFor={`${rowId}-cost`}>Costo por unidad de stock ({product?.unit ?? "catálogo"}, opcional)</Label><Input id={`${rowId}-cost`} type="number" min="0" step="0.01" inputMode="decimal" value={line.unitCost} onChange={(event) => editLine(index, { unitCost: event.target.value })} /></div>
                  {!line.manual ? <p className="text-xs text-slate-600 sm:col-span-2">{line.conversion === null ? "Conversión sin resolver" : `Conversión sugerida: ${line.conversion} ${product?.unit ?? "unidades de catálogo"} por ${line.original.invoiceUnit ?? "unidad de factura"}.`}</p> : null}
                </fieldset>
                {line.manual ? <Button type="button" variant="outline" disabled={editingDisabled} onClick={() => {
                  if (busy.current === "idle") updateReview(removeReviewLine(reviewRef.current, index, crypto.randomUUID()));
                }}>Quitar línea {index + 1}</Button> : null}
              </section>;
            })}
            <label className="flex items-start gap-2 text-sm"><input type="checkbox" checked={review.reviewed} disabled={editingDisabled} onChange={(event) => {
              if (busy.current === "idle" && reviewRef.current) updateReview(setReviewed(reviewRef.current, event.target.checked));
            }} />Revisé los productos, las unidades, las cantidades, los costos y el total de la compra.</label>
            {validation && !validation.ok ? <p className="text-sm text-amber-800">{validation.message}</p> : null}
            {review.locked ? <p role="alert" className="text-sm font-medium text-amber-800">Confirmación pendiente de verificar. Solo se permite reintentar el mismo ingreso; no recargues la página.</p> : null}
          </> : null}
          </> : null}
          </section>)}
          {phase !== "idle" && phase !== "product-form" ? <p role="status">{phase === "prepare" ? "Preparando archivo…" : phase === "analysis" ? "Interpretando factura con OpenAI…" : phase === "confirm" ? "Registrando ingreso…" : "Creando producto…"}</p> : null}
          {error ? <p role="alert" className="break-words text-sm text-red-700">{error}</p> : null}
          {message ? <p role="status" className="break-words text-sm text-slate-700">{message}</p> : null}
        </ResponsiveDialogBody>
        <ResponsiveDialogFooter>
          <Button type="button" variant="outline" disabled={phase === "confirm" || phase === "product" || phase === "product-form"} onClick={() => { if (["confirm", "product", "product-form"].includes(busy.current)) return; cancelAnalysis(); setOpen(false); }}>Cerrar{hasLines ? " (conservar borrador)" : ""}</Button>
          {hasLines || mode === "manual" ? <Button type="button" disabled={phase !== "idle" || !canConfirm} onClick={confirm}>{phase === "confirm" ? "Confirmando…" : review.locked ? "Reintentar confirmación" : "Confirmar ingreso revisado"}</Button> : null}
          {hasLines && !review.locked ? <Button type="button" variant="outline" className="col-span-2" disabled={phase !== "idle"} onClick={() => {
            if (busy.current !== "idle" || reviewRef.current?.locked) return;
            clearConsumedDraft();
            setError("");
            setMessage("Borrador descartado. El stock no cambió.");
          }}>Descartar borrador y elegir otro archivo</Button> : null}
        </ResponsiveDialogFooter>
      </ResponsiveDialogContent>
      {productRow !== null ? <ResponsiveDialog open onOpenChange={(next) => { if (!next) cancelProductCreation(); }}>
        <ResponsiveDialogContent aria-label="Crear producto" className="font-montserrat md:max-w-lg" showCloseButton={phase !== "product"}>
          <ResponsiveDialogHeader><ResponsiveDialogTitle>Crear producto</ResponsiveDialogTitle></ResponsiveDialogHeader>
          <form className="contents" onSubmit={(event) => createProduct(event, productRow)}>
            <ResponsiveDialogBody>
              <fieldset disabled={phase === "product" || review.locked} className="grid gap-4">
                <div className="grid gap-2"><Label htmlFor={`${id}-new-product-name`}>Nombre del nuevo producto</Label><Input id={`${id}-new-product-name`} name="name" minLength={2} maxLength={120} defaultValue={review.lines[productRow]?.manual ? "" : review.lines[productRow]?.original.description.slice(0, 120) ?? ""} required /></div>
                <div className="grid gap-2"><Label htmlFor={`${id}-new-product-unit`}>Unidad de catálogo</Label><Input id={`${id}-new-product-unit`} name="unit" maxLength={30} placeholder="Ej.: unidad, caja, ml" required /></div>
                <div className="grid gap-2"><Label htmlFor={`${id}-new-product-minimum`}>Stock mínimo</Label><Input id={`${id}-new-product-minimum`} name="minimumStock" type="number" min="0" step="0.001" defaultValue="0" required /></div>
              </fieldset>
              {productError ? <p role="alert" className="mt-3 text-sm text-red-700">{productError}</p> : null}
            </ResponsiveDialogBody>
            <ResponsiveDialogFooter>
              <Button type="button" variant="outline" disabled={phase === "product"} onClick={cancelProductCreation}>Cancelar creación</Button>
              <Button type="submit" disabled={phase === "product"}>{phase === "product" ? "Creando…" : "Crear producto y seleccionarlo"}</Button>
            </ResponsiveDialogFooter>
          </form>
        </ResponsiveDialogContent>
      </ResponsiveDialog> : null}
    </ResponsiveDialog>
  );
}
