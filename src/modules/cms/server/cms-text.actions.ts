"use server";

import { z } from "zod";

import {
  publishCmsTextMap,
  saveCmsDraftTextMap,
} from "@/modules/cms/server/cms-text.repository";

const cmsTextMapSchema = z.record(z.string(), z.string());

export async function saveCmsDraftAction(payload: unknown) {
  const parsed = cmsTextMapSchema.safeParse(payload);

  if (!parsed.success) {
    return { ok: false as const, message: "Invalid payload." };
  }

  await saveCmsDraftTextMap(parsed.data);

  return { ok: true as const, message: "Draft saved." };
}

export async function publishCmsAction(payload: unknown) {
  const parsed = cmsTextMapSchema.safeParse(payload);

  if (!parsed.success) {
    return { ok: false as const, message: "Invalid payload." };
  }

  await publishCmsTextMap(parsed.data);

  return { ok: true as const, message: "Published successfully." };
}
