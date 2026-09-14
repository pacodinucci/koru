import "server-only";

import { createCipheriv, createDecipheriv, randomBytes } from "crypto";

import { env } from "@/lib/env";

const ALGORITHM = "aes-256-gcm";
const IV_BYTES = 12;
const AUTH_TAG_BYTES = 16;
const CURRENT_CIPHER_VERSION = "v1";

function getEncryptionKey() {
  const encodedKey = env.INVITATION_TOKEN_ENCRYPTION_KEY;
  if (!encodedKey) throw new Error("invitation_token_encryption_key_missing");

  const key = Buffer.from(encodedKey, "base64");
  if (key.length !== 32) throw new Error("invitation_token_encryption_key_invalid");
  return key;
}

export function encryptInvitationToken(token: string) {
  const iv = randomBytes(IV_BYTES);
  const cipher = createCipheriv(ALGORITHM, getEncryptionKey(), iv);
  const ciphertext = Buffer.concat([cipher.update(token, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return [
    CURRENT_CIPHER_VERSION,
    iv.toString("base64url"),
    authTag.toString("base64url"),
    ciphertext.toString("base64url"),
  ].join(".");
}

export function decryptInvitationToken(value: string) {
  const [version, encodedIv, encodedAuthTag, encodedCiphertext, ...rest] = value.split(".");
  if (version !== CURRENT_CIPHER_VERSION || !encodedIv || !encodedAuthTag || !encodedCiphertext || rest.length) {
    throw new Error("invitation_token_ciphertext_invalid");
  }

  const iv = Buffer.from(encodedIv, "base64url");
  const authTag = Buffer.from(encodedAuthTag, "base64url");
  if (iv.length !== IV_BYTES || authTag.length !== AUTH_TAG_BYTES) {
    throw new Error("invitation_token_ciphertext_invalid");
  }

  try {
    const decipher = createDecipheriv(ALGORITHM, getEncryptionKey(), iv);
    decipher.setAuthTag(authTag);
    return Buffer.concat([
      decipher.update(Buffer.from(encodedCiphertext, "base64url")),
      decipher.final(),
    ]).toString("utf8");
  } catch {
    throw new Error("invitation_token_ciphertext_invalid");
  }
}
