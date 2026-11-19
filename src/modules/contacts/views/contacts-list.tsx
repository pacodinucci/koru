"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { SOURCE_LABELS, STATUS_LABELS, type ContactRow } from "../contacts.domain";

type Page = { items: ContactRow[]; total: number; page: number; pageSize: number };
export function ContactsList() {
  const params = useSearchParams(); const pathname = usePathname(); const router = useRouter();
  const query = params.toString();
  const [loaded, setLoaded] = useState<{ key: string; page: Page } | null>(null);
  const [failure, setFailure] = useState<{ key: string; error: string } | null>(null);
  const [retry, setRetry] = useState(0);
  const requestKey = `${query}:${retry}`;
  const page = loaded?.key === requestKey ? loaded.page : null;
  const error = failure?.key === requestKey ? failure.error : "";
  useEffect(() => {
    const controller = new AbortController();
    fetch(`/api/dashboard/contacts?${query}`, { cache: "no-store", signal: controller.signal }).then(async (response) => {
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      if (!controller.signal.aborted) setLoaded({ key: requestKey, page: result });
    }).catch((cause) => { if (!controller.signal.aborted) setFailure({ key: requestKey, error: cause.message || "No pudimos cargar los contactos." }); });
    return () => controller.abort();
  }, [query, requestKey]);
  function pageLink(number: number) { const next = new URLSearchParams(query); next.set("page", String(number)); return `${pathname}?${next}`; }
  return <div className="space-y-6"><h1 className="text-2xl font-semibold">Contactos</h1>
    <form key={query} className="flex flex-wrap items-end gap-3" onSubmit={(event) => {
      event.preventDefault(); const data = new FormData(event.currentTarget); const next = new URLSearchParams();
      for (const key of ["q", "source", "status"]) { const value = String(data.get(key) ?? ""); if (value) next.set(key, value); }
      router.push(`${pathname}?${next}`);
    }}>
      <label className="space-y-1">Buscar por nombre o correo<input name="q" maxLength={200} defaultValue={params.get("q") ?? ""} className="block rounded border p-2" type="search" /></label>
      <label className="space-y-1">Origen<select name="source" defaultValue={params.get("source") ?? ""} className="block rounded border p-2"><option value="">Todos</option>{Object.entries(SOURCE_LABELS).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label>
      <label className="space-y-1">Estado<select name="status" defaultValue={params.get("status") ?? ""} className="block rounded border p-2"><option value="">Todos</option>{Object.entries(STATUS_LABELS).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label>
      <Button type="submit">Aplicar filtros</Button>
    </form>
    {error ? <div role="alert"><p>{error}</p><Button variant="outline" onClick={() => setRetry((value) => value + 1)}>Reintentar</Button></div> : !page ? <p role="status">Cargando contactos…</p> : <>
      <p role="status">{page.total} contactos</p>
      {page.items.length === 0 ? <p>No hay contactos para estos filtros.</p> : <div className="overflow-x-auto rounded border"><table className="w-full text-left text-sm"><caption className="sr-only">Contactos recibidos, del más reciente al más antiguo</caption><thead><tr>{["Nombre", "Origen", "Correo / teléfono", "Recibido", "Estado", "Detalle"].map((label) => <th key={label} scope="col" className="p-3">{label}</th>)}</tr></thead><tbody>{page.items.map((row) => <tr key={`${row.source}:${row.id}`} className="border-t"><td className="p-3">{row.name || "Sin nombre"}</td><td className="p-3">{SOURCE_LABELS[row.source]}</td><td className="p-3 break-all">{row.email}<br />{row.phone || "Sin teléfono"}</td><td className="p-3">{new Date(row.receivedAt).toLocaleString("es-AR")}</td><td className="p-3">{STATUS_LABELS[row.status]}</td><td className="p-3"><Link className="underline" href={`/dashboard/contactos/${row.source}/${encodeURIComponent(row.id)}?${query}`}>Ver detalle<span className="sr-only"> de {row.name}</span></Link></td></tr>)}</tbody></table></div>}
      <nav aria-label="Páginas de contactos" className="flex gap-4">{page.page > 1 && <Link className="underline" href={pageLink(page.page - 1)}>Anterior</Link>}<span>Página {page.page} de {Math.max(1, Math.ceil(page.total / page.pageSize))}</span>{page.page * page.pageSize < page.total && <Link className="underline" href={pageLink(page.page + 1)}>Siguiente</Link>}</nav>
    </>}
  </div>;
}
