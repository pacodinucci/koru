export type LandingRenderMode = "code-first" | "cms";

export function getLandingRenderMode(): LandingRenderMode {
  const raw = process.env.NEXT_PUBLIC_LANDING_MODE?.trim().toLowerCase();
  return raw === "cms" ? "cms" : "code-first";
}

export function isCodeFirstLandingMode() {
  return getLandingRenderMode() === "code-first";
}

