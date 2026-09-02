const LOCAL_ORIGIN = "http://koru.local";

export function getCalendarActionReturnTo(formData: FormData) {
  const value = formData.get("returnTo");
  if (typeof value !== "string" || !value.startsWith("/")) return undefined;

  try {
    const url = new URL(value, LOCAL_ORIGIN);
    if (url.origin !== LOCAL_ORIGIN) return undefined;
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return undefined;
  }
}

export function withCalendarActionResult(
  returnTo: string,
  key: "ok" | "error",
  value: string,
) {
  const url = new URL(returnTo, LOCAL_ORIGIN);
  url.searchParams.delete("ok");
  url.searchParams.delete("error");
  url.searchParams.set(key, value);
  return `${url.pathname}${url.search}${url.hash}`;
}