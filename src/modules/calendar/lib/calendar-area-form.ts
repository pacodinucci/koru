export function calendarAreaFields(formData: FormData) {
  const string = (name: string) => String(formData.get(name) ?? "").trim();
  const strings = (name: string) => [...new Set(formData.getAll(name).filter((v): v is string => typeof v === "string").map(v => v.trim()).filter(Boolean))];
  const scope = string("accessScope") || "LEGACY";
  if (!["LEGACY", "INTERNAL", "AREAS", "PEOPLE"].includes(scope)) throw new Error("invalid_access_scope");
  return {
    accessScope: scope as "LEGACY" | "INTERNAL" | "AREAS" | "PEOPLE",
    responsibleAreaId: string("responsibleAreaId") || null,
    involvedAreaIds: strings("involvedAreaIds"),
    audienceAreaIds: strings("audienceAreaIds"),
  };
}
