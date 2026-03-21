"use server";

import { z } from "zod";

import { cmsLandingTextKeys } from "@/modules/admin/data/cms-landing-content";
import {
  publishCmsTextMap,
  saveCmsDraftTextMap,
} from "@/modules/cms/server/cms-text.repository";

const cmsTextMapSchema = z.record(z.string(), z.string());

function sanitizePayload(payload: Record<string, string>) {
  return Object.fromEntries(
    cmsLandingTextKeys.map((key) => [key, payload[key] ?? ""]),
  );
}

export async function saveCmsDraftAction(payload: unknown) {
  const parsed = cmsTextMapSchema.safeParse(payload);

  if (!parsed.success) {
    return { ok: false as const, message: "Invalid payload." };
  }

  await saveCmsDraftTextMap(sanitizePayload(parsed.data));

  return { ok: true as const, message: "Draft saved." };
}

export async function publishCmsAction(payload: unknown) {
  const parsed = cmsTextMapSchema.safeParse(payload);

  if (!parsed.success) {
    return { ok: false as const, message: "Invalid payload." };
  }

  await publishCmsTextMap(sanitizePayload(parsed.data));

  return { ok: true as const, message: "Published successfully." };
}
