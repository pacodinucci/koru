"use client";

import { useEffect, useState } from "react";
import { Eye } from "lucide-react";

import { Button } from "@/components/ui/button";

type ViewOption = { id: string; label: string };
type ViewData = {
  enabled: boolean;
  selectedUserId: string | null;
  teachers: ViewOption[];
  families: ViewOption[];
};

export function DevelopmentViewSwitcher() {
  const [data, setData] = useState<ViewData | null>(null);
  const [teacherId, setTeacherId] = useState("");
  const [familyId, setFamilyId] = useState("");
  const [pending, setPending] = useState(false);

  useEffect(() => {
    fetch("/api/development/view", { cache: "no-store" })
      .then(async (response) => response.ok ? response.json() as Promise<ViewData> : null)
      .then((result) => {
        setData(result);
        if (result?.selectedUserId) {
          setTeacherId(result.selectedUserId);
          setFamilyId(result.selectedUserId);
        }
      })
      .catch(() => setData(null));
  }, []);

  async function selectView(kind: "own" | "teacher" | "family", targetUserId?: string) {
    setPending(true);
    try {
      const response = await fetch("/api/development/view", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind, targetUserId }),
      });
      const result = await response.json() as { redirectTo?: string };
      if (response.ok && result.redirectTo) window.location.assign(result.redirectTo);
    } finally {
      setPending(false);
    }
  }

  if (!data?.enabled) return null;

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-lg border border-amber-300 bg-amber-50 px-2 py-1.5 text-xs text-amber-950">
      <Eye className="size-3.5" />
      <span className="font-medium">Vista de desarrollo</span>
      <select aria-label="Elegir docente" value={teacherId} onChange={(event) => setTeacherId(event.target.value)} className="h-7 max-w-44 rounded border border-amber-300 bg-white px-1 text-xs">
        <option value="">Elegí un docente</option>
        {data.teachers.map((teacher) => <option key={teacher.id} value={teacher.id}>{teacher.label}</option>)}
      </select>
      <Button type="button" size="sm" variant="outline" disabled={!teacherId || pending} onClick={() => selectView("teacher", teacherId)}>Ver docente</Button>
      <select aria-label="Elegir familia" value={familyId} onChange={(event) => setFamilyId(event.target.value)} className="h-7 max-w-44 rounded border border-amber-300 bg-white px-1 text-xs">
        <option value="">Elegí una familia</option>
        {data.families.map((family) => <option key={family.id} value={family.id}>{family.label}</option>)}
      </select>
      <Button type="button" size="sm" variant="outline" disabled={!familyId || pending} onClick={() => selectView("family", familyId)}>Ver familia</Button>
      <Button type="button" size="sm" variant="ghost" disabled={pending || !data.selectedUserId} onClick={() => selectView("own")}>Volver a mi vista</Button>
    </div>
  );
}
