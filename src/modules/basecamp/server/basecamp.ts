import "server-only";

import { createCipheriv, createDecipheriv, hkdfSync, randomBytes } from "node:crypto";

import { env } from "@/lib/env";
import { prisma } from "@/lib/prisma";

export const BASECAMP_ACCOUNT_ID = "5892708";
export const BASECAMP_PROJECT_ID = "46876325";
export const BASECAMP_PROJECT_URL = `https://app.basecamp.com/${BASECAMP_ACCOUNT_ID}/projects/${BASECAMP_PROJECT_ID}`;
export const BASECAMP_CALLBACK_URL = "https://koruosa.com.mx/api/basecamp/callback";
const API_ORIGIN = "https://3.basecampapi.com";
const API_PREFIX = `/${BASECAMP_ACCOUNT_ID}/`;
const USER_AGENT = "Koru (https://koruosa.com.mx)";

export const BASECAMP_ROLES = ["ADMIN", "SUPERADMIN", "TEACHER", "ADMIN_TEACHER"] as const;

type TokenResponse = {
  access_token: string;
  refresh_token: string;
  expires_in: number;
};

type Authorization = {
  identity?: { id?: number | string };
  accounts?: Array<{ id?: number | string; product?: string }>;
};

export type BasecampCard = {
  id: number;
  title: string;
  name: string;
  position: number;
  appUrl: string;
  preview: Array<{ title: string; url: string }>;
};

type DockTool = {
  id?: number;
  title?: string;
  name?: string;
  enabled?: boolean;
  position?: number;
  url?: string;
  app_url?: string;
};

export class BasecampError extends Error {
  constructor(public readonly code: "config" | "auth" | "account" | "forbidden" | "unavailable", message: string) {
    super(message);
  }
}

export function basecampConfigured() {
  return Boolean(env.BASECAMP_CLIENT_ID && env.BASECAMP_CLIENT_SECRET);
}

function credentials() {
  if (!env.BASECAMP_CLIENT_ID || !env.BASECAMP_CLIENT_SECRET) {
    throw new BasecampError("config", "Falta configurar la aplicación de Basecamp.");
  }
  return { clientId: env.BASECAMP_CLIENT_ID, clientSecret: env.BASECAMP_CLIENT_SECRET };
}

function encryptionKey(): Buffer {
  return Buffer.from(hkdfSync("sha256", env.BETTER_AUTH_SECRET, "koru-basecamp-v1", "oauth-token-encryption", 32));
}

function encrypt(value: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", encryptionKey(), iv);
  const body = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  return Buffer.concat([iv, cipher.getAuthTag(), body]).toString("base64");
}

function decrypt(value: string): string {
  const bytes = Buffer.from(value, "base64");
  const decipher = createDecipheriv("aes-256-gcm", encryptionKey(), bytes.subarray(0, 12));
  decipher.setAuthTag(bytes.subarray(12, 28));
  return Buffer.concat([decipher.update(bytes.subarray(28)), decipher.final()]).toString("utf8");
}

export function authorizationUrl(state: string) {
  const { clientId } = credentials();
  const url = new URL("https://launchpad.37signals.com/authorization/new");
  url.searchParams.set("response_type", "code");
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("redirect_uri", BASECAMP_CALLBACK_URL);
  url.searchParams.set("state", state);
  return url;
}

async function tokenRequest(params: Record<string, string>): Promise<TokenResponse> {
  const { clientId, clientSecret } = credentials();
  const response = await fetch("https://launchpad.37signals.com/authorization/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded", "User-Agent": USER_AGENT },
    body: new URLSearchParams({ ...params, client_id: clientId, client_secret: clientSecret }),
    cache: "no-store",
  });
  if (!response.ok) throw new BasecampError("auth", "Basecamp rechazó la autorización. Intentá conectar de nuevo.");
  const token: unknown = await response.json();
  if (!isRecord(token) || typeof token.access_token !== "string" || typeof token.refresh_token !== "string" || typeof token.expires_in !== "number") {
    throw new BasecampError("auth", "Basecamp devolvió una respuesta de autorización inválida.");
  }
  return token as TokenResponse;
}

export async function exchangeCode(code: string) {
  return tokenRequest({ grant_type: "authorization_code", redirect_uri: BASECAMP_CALLBACK_URL, code });
}

export async function getAuthorization(accessToken: string): Promise<Authorization> {
  const response = await fetch("https://launchpad.37signals.com/authorization.json", {
    headers: { Authorization: `Bearer ${accessToken}`, "User-Agent": USER_AGENT, Accept: "application/json" },
    cache: "no-store",
  });
  if (!response.ok) throw new BasecampError("auth", "No se pudo verificar tu acceso a Basecamp.");
  return response.json() as Promise<Authorization>;
}

export async function saveConnection(userId: string, identityId: string, token: TokenResponse) {
  await prisma.basecampConnection.upsert({
    where: { userId },
    create: {
      userId, basecampIdentityId: identityId,
      accessTokenCiphertext: encrypt(token.access_token),
      refreshTokenCiphertext: encrypt(token.refresh_token),
      expiresAt: new Date(Date.now() + token.expires_in * 1000),
    },
    update: {
      basecampIdentityId: identityId,
      accessTokenCiphertext: encrypt(token.access_token),
      refreshTokenCiphertext: encrypt(token.refresh_token),
      expiresAt: new Date(Date.now() + token.expires_in * 1000),
    },
  });
}

export async function getAccessToken(userId: string): Promise<string | null> {
  const connection = await prisma.basecampConnection.findUnique({ where: { userId } });
  if (!connection) return null;
  if (connection.expiresAt.getTime() > Date.now() + 60_000) return decrypt(connection.accessTokenCiphertext);

  let token: TokenResponse;
  try {
    token = await tokenRequest({ grant_type: "refresh_token", refresh_token: decrypt(connection.refreshTokenCiphertext) });
  } catch (error) {
    const current = await prisma.basecampConnection.findUnique({ where: { userId } });
    if (current && current.refreshTokenCiphertext !== connection.refreshTokenCiphertext && current.expiresAt.getTime() > Date.now()) {
      return decrypt(current.accessTokenCiphertext);
    }
    throw error;
  }
  const updated = await prisma.basecampConnection.updateMany({
    where: { userId, refreshTokenCiphertext: connection.refreshTokenCiphertext },
    data: {
      accessTokenCiphertext: encrypt(token.access_token),
      refreshTokenCiphertext: encrypt(token.refresh_token),
      expiresAt: new Date(Date.now() + token.expires_in * 1000),
    },
  });
  if (updated.count === 0) {
    const current = await prisma.basecampConnection.findUnique({ where: { userId } });
    return current ? decrypt(current.accessTokenCiphertext) : null;
  }
  return token.access_token;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function safeApiUrl(raw: string): string | null {
  try {
    const url = new URL(raw);
    return url.origin === API_ORIGIN && url.pathname.startsWith(API_PREFIX) ? url.toString() : null;
  } catch { return null; }
}

function safeAppUrl(raw: string): string | null {
  try {
    const url = new URL(raw);
    return url.protocol === "https:" && ["app.basecamp.com", "3.basecamp.com"].includes(url.hostname) && url.pathname.startsWith(API_PREFIX)
      ? url.toString() : null;
  } catch { return null; }
}

async function apiGet(url: string, accessToken: string): Promise<unknown> {
  const safeUrl = safeApiUrl(url);
  if (!safeUrl) throw new BasecampError("unavailable", "URL de Basecamp no reconocida.");
  const response = await fetch(safeUrl, {
    headers: { Authorization: `Bearer ${accessToken}`, "User-Agent": USER_AGENT, Accept: "application/json" },
    cache: "no-store",
    redirect: "error",
  });
  if (response.status === 401) throw new BasecampError("auth", "La conexión con Basecamp venció. Volvé a conectarte.");
  if (response.status === 403 || response.status === 404) throw new BasecampError("forbidden", "Tu cuenta no tiene acceso a este proyecto de Basecamp.");
  if (!response.ok) throw new BasecampError("unavailable", "Basecamp no respondió. Intentá nuevamente más tarde.");
  return response.json() as Promise<unknown>;
}

function previewItems(items: unknown): BasecampCard["preview"] {
  if (!Array.isArray(items)) return [];
  return items.slice(0, 6).flatMap((item) => {
    if (!isRecord(item) || typeof item.app_url !== "string") return [];
    const title = typeof item.title === "string" ? item.title : typeof item.summary === "string" ? item.summary : null;
    if (!title) return [];
    const url = safeAppUrl(item.app_url);
    return url ? [{ title, url }] : [];
  });
}

async function getPreview(tool: DockTool, accessToken: string): Promise<BasecampCard["preview"]> {
  if (!tool.url) return [];
  const resource = await apiGet(tool.url, accessToken);
  if (!isRecord(resource)) return [];
  if (tool.name === "todoset") return previewItems(resource.todolists);
  if (tool.name === "kanban_board") return previewItems(resource.lists);

  const listUrls = tool.name === "message_board" ? [resource.messages_url]
    : tool.name === "schedule" ? [resource.entries_url]
    : tool.name === "vault" ? [resource.documents_url, resource.uploads_url, resource.vaults_url]
    : [];
  const lists = await Promise.all(listUrls.filter((url): url is string => typeof url === "string" && Boolean(safeApiUrl(url))).map((url) => apiGet(url, accessToken).catch(() => [])));
  return lists.flatMap(previewItems).slice(0, 6);
}

export async function getProjectCards(accessToken: string): Promise<{ projectName: string; cards: BasecampCard[] }> {
  const project = await apiGet(`${API_ORIGIN}/${BASECAMP_ACCOUNT_ID}/projects/${BASECAMP_PROJECT_ID}.json`, accessToken);
  if (!isRecord(project) || !Array.isArray(project.dock)) throw new BasecampError("unavailable", "El proyecto no devolvió sus tarjetas.");
  const tools = (project.dock as DockTool[]).filter((tool) => tool.enabled === true && typeof tool.id === "number" && typeof tool.title === "string" && typeof tool.name === "string" && typeof tool.app_url === "string" && safeAppUrl(tool.app_url));
  const cards = await Promise.all(tools.map(async (tool) => {
    let preview: BasecampCard["preview"] = [];
    if (tool.url) {
      try { preview = await getPreview(tool, accessToken); } catch { /* The card link remains available if a preview cannot be loaded. */ }
    }
    return { id: tool.id!, title: tool.title!, name: tool.name!, position: tool.position ?? 0, appUrl: safeAppUrl(tool.app_url!)!, preview };
  }));
  return { projectName: typeof project.name === "string" ? project.name : "Basecamp", cards: cards.sort((a, b) => a.position - b.position) };
}

export function accountIsAvailable(authorization: Authorization) {
  return authorization.accounts?.some((account) => account.product === "bc3" && String(account.id) === BASECAMP_ACCOUNT_ID) ?? false;
}
