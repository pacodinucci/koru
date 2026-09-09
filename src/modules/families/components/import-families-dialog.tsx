"use client";

import * as XLSX from "xlsx";
import { DownloadIcon, UploadIcon } from "lucide-react";
import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { ResponsiveDialog, ResponsiveDialogBody, ResponsiveDialogContent, ResponsiveDialogDescription, ResponsiveDialogHeader, ResponsiveDialogTitle, ResponsiveDialogTrigger } from "@/components/ui/responsive-dialog";
import { confirmFamilyImportAction, previewFamilyImportAction } from "@/modules/families/server/families.actions";

type ImportRow = { rowNumber: number; familyName: string; motherEmail?: string; fatherEmail?: string };
type Preview = Awaited<ReturnType<typeof previewFamilyImportAction>>;

function value(row: unknown[], index: number) {
  const candidate = row[index];
  return candidate == null ? "" : String(candidate).trim();
}

function parseWorkbook(buffer: ArrayBuffer): ImportRow[] {
  const workbook = XLSX.read(buffer, { type: "array" });
  const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
  if (!firstSheet) throw new Error("La planilla no contiene hojas.");
  const data = XLSX.utils.sheet_to_json<unknown[]>(firstSheet, { header: 1, defval: "", blankrows: false });
  if (!data.length) throw new Error("La planilla está vacía.");
  const headers = data[0].map((_cell, index) => value(data[0], index).toLocaleLowerCase("es-AR"));
  const familyIndex = headers.findIndex((header) => header === "familia");
  const mailIndexes = headers.reduce<number[]>((indexes, header, index) => {
    if (header === "mail madre" || header === "mail padre" || header === "mail") indexes.push(index);
    return indexes;
  }, []);
  if (familyIndex < 0 || mailIndexes.length < 1 || mailIndexes.length > 2) {
    throw new Error("Usá los encabezados Familia, Mail madre y Mail padre (o Familia, mail, mail).");
  }
  return data.slice(1).map((row, index) => ({
    rowNumber: index + 2,
    familyName: value(row, familyIndex),
    motherEmail: value(row, mailIndexes[0]),
    fatherEmail: value(row, mailIndexes[1]),
  })).filter((row) => row.familyName || row.motherEmail || row.fatherEmail);
}

function downloadTemplate() {
  const sheet = XLSX.utils.aoa_to_sheet([["Familia", "Mail madre", "Mail padre"], ["García", "madre@ejemplo.com", "padre@ejemplo.com"]]);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, sheet, "Familias");
  XLSX.writeFile(workbook, "plantilla-familias.xlsx");
}

export function ImportFamiliesDialog() {
  const [open, setOpen] = useState(false);
  const [rows, setRows] = useState<ImportRow[]>([]);
  const [preview, setPreview] = useState<Preview | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function reset() {
    setRows([]);
    setPreview(null);
    setMessage(null);
  }

  async function onFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    reset();
    if (!file) return;
    try {
      const parsedRows = parseWorkbook(await file.arrayBuffer());
      setRows(parsedRows);
      startTransition(async () => setPreview(await previewFamilyImportAction(parsedRows)));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "No pudimos leer la planilla.");
    }
  }

  function confirm() {
    startTransition(async () => {
      const result = await confirmFamilyImportAction(rows);
      setMessage(result.message);
      if ("preview" in result && result.preview) setPreview(result.preview);
      if (result.status === "success" || result.status === "warning") {
        setRows([]);
        setPreview(null);
      }
    });
  }

  const hasIssues = Boolean(preview?.issues.length);
  return <ResponsiveDialog open={open} onOpenChange={(nextOpen) => { setOpen(nextOpen); if (!nextOpen) reset(); }}>
    <ResponsiveDialogTrigger render={<Button type="button" variant="outline" />}><UploadIcon /> Importar familias</ResponsiveDialogTrigger>
    <ResponsiveDialogContent className="font-montserrat md:max-w-2xl">
      <ResponsiveDialogHeader>
        <ResponsiveDialogTitle>Importar familias</ResponsiveDialogTitle>
        <ResponsiveDialogDescription>Cargá una planilla Excel. Cada mail recibirá una invitación para sumarse a la familia.</ResponsiveDialogDescription>
      </ResponsiveDialogHeader>
      <ResponsiveDialogBody>
        <div className="grid gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <Button type="button" variant="outline" onClick={downloadTemplate}><DownloadIcon /> Descargar plantilla</Button>
            <label className="cursor-pointer text-sm font-medium text-slate-700">
              <span className="sr-only">Seleccionar archivo Excel</span>
              <input type="file" accept=".xlsx,.xls" onChange={onFileChange} className="block w-full font-montserrat text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-slate-100 file:px-3 file:py-2 file:font-montserrat file:font-medium file:text-slate-700" />
            </label>
          </div>
          <p className="text-xs text-slate-500">Formato: <strong>Familia, Mail madre, Mail padre</strong>. También se acepta <strong>Familia, mail, mail</strong>.</p>
          {isPending ? <p className="text-sm text-slate-600">Validando planilla…</p> : null}
          {preview ? <div className="grid gap-3 rounded-xl border border-slate-200 p-4 text-sm">
            <p><strong>{preview.familiesCount}</strong> familias y <strong>{preview.invitationsCount}</strong> invitaciones listas para crear.</p>
            {preview.issues.length ? <div className="grid gap-1 rounded-lg bg-red-50 p-3 text-red-700" role="alert">
              <strong>Hay errores que deben corregirse.</strong>
              <ul className="list-disc pl-5">{preview.issues.slice(0, 20).map((issue, index) => <li key={`${issue.rowNumber}-${index}`}>{issue.rowNumber ? `Fila ${issue.rowNumber}: ` : ""}{issue.message}</li>)}</ul>
              {preview.issues.length > 20 ? <p>Y {preview.issues.length - 20} errores más.</p> : null}
            </div> : <p className="text-emerald-700">La planilla está lista para importar.</p>}
            {preview.validRows.length ? <div className="max-h-44 overflow-auto rounded-lg border border-slate-100"><table className="w-full text-left text-xs"><thead className="bg-slate-50 text-slate-600"><tr><th className="p-2">Fila</th><th className="p-2">Familia</th><th className="p-2">Invitaciones</th></tr></thead><tbody>{preview.validRows.map((row) => <tr key={row.rowNumber} className="border-t border-slate-100"><td className="p-2">{row.rowNumber}</td><td className="p-2">{row.familyName}</td><td className="p-2">{row.emails.join(", ")}</td></tr>)}</tbody></table></div> : null}
            <Button type="button" onClick={confirm} disabled={isPending || hasIssues || !preview.validRows.length} className="justify-self-end">Confirmar importación</Button>
          </div> : null}
          {message ? <p className="text-sm text-slate-700" role="status">{message}</p> : null}
        </div>
      </ResponsiveDialogBody>
    </ResponsiveDialogContent>
  </ResponsiveDialog>;
}

