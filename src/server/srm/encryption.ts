import "server-only";
import { randomBytes, createCipheriv, createDecipheriv } from "crypto";
import { getEncryptionKey } from "@/server/env";
export function encrypt(data: unknown): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", getEncryptionKey(), iv);
  const encrypted = Buffer.concat([cipher.update(JSON.stringify(data), "utf8"), cipher.final()]);
  return `1:${iv.toString("hex")}:${cipher.getAuthTag().toString("hex")}:${encrypted.toString("hex")}`;
}
export function decrypt(data: string): unknown {
  const parts = data.split(":");
  if (parts.length === 4 && parts.shift() !== "1") throw new Error("SESSION_STORE_ERROR");
  if (parts.length !== 3) throw new Error("SESSION_STORE_ERROR");
  const [iv, tag, payload] = parts;
  const cipher = createDecipheriv("aes-256-gcm", getEncryptionKey(), Buffer.from(iv, "hex"));
  cipher.setAuthTag(Buffer.from(tag, "hex"));
  return JSON.parse(Buffer.concat([cipher.update(Buffer.from(payload, "hex")), cipher.final()]).toString("utf8"));
}

