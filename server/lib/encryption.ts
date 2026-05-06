import {
  createCipheriv,
  createDecipheriv,
  randomBytes,
  scryptSync,
} from "node:crypto";

const ALGO = "aes-256-gcm";
const KEY_LEN = 32;
const IV_LEN = 12;
const TAG_LEN = 16;

const PASSPHRASE =
  process.env.NEUROVAULT_ENCRYPTION_KEY ||
  "neurovault-dev-passphrase-change-in-production";

const deriveKey = (salt: Buffer): Buffer =>
  scryptSync(PASSPHRASE, salt, KEY_LEN);

export interface EncryptedPayload {
  ciphertext: string;
  iv: string;
  salt: string;
  tag: string;
  algo: string;
}

export const encrypt = (plaintext: string): string => {
  const salt = randomBytes(16);
  const iv = randomBytes(IV_LEN);
  const key = deriveKey(salt);
  const cipher = createCipheriv(ALGO, key, iv);
  const ct = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();
  const payload: EncryptedPayload = {
    ciphertext: ct.toString("base64"),
    iv: iv.toString("base64"),
    salt: salt.toString("base64"),
    tag: tag.toString("base64"),
    algo: ALGO,
  };
  return Buffer.from(JSON.stringify(payload)).toString("base64");
};

export const decrypt = (envelope: string): string => {
  const payload: EncryptedPayload = JSON.parse(
    Buffer.from(envelope, "base64").toString("utf8"),
  );
  const salt = Buffer.from(payload.salt, "base64");
  const iv = Buffer.from(payload.iv, "base64");
  const tag = Buffer.from(payload.tag, "base64");
  const ct = Buffer.from(payload.ciphertext, "base64");
  const key = deriveKey(salt);
  const decipher = createDecipheriv(ALGO, key, iv);
  decipher.setAuthTag(tag);
  const pt = Buffer.concat([decipher.update(ct), decipher.final()]);
  return pt.toString("utf8");
};

const SENSITIVE_PATTERNS: { name: string; re: RegExp }[] = [
  { name: "email", re: /\b[\w.+-]+@[\w-]+\.[\w.-]+\b/g },
  { name: "ssn", re: /\b\d{3}-\d{2}-\d{4}\b/g },
  { name: "phone", re: /\b(?:\+?\d{1,3}[ -]?)?\(?\d{3}\)?[ -]?\d{3}[ -]?\d{4}\b/g },
  { name: "creditCard", re: /\b(?:\d[ -]*?){13,16}\b/g },
  { name: "apiKey", re: /\b(?:sk|pk|nv)_(?:live|test)_[A-Za-z0-9]{16,}\b/g },
];

export const detectSensitive = (text: string): string[] => {
  const found = new Set<string>();
  for (const { name, re } of SENSITIVE_PATTERNS) {
    if (re.test(text)) found.add(name);
  }
  return Array.from(found);
};

export const redact = (text: string): string => {
  let out = text;
  for (const { name, re } of SENSITIVE_PATTERNS) {
    out = out.replace(re, `[REDACTED:${name.toUpperCase()}]`);
  }
  return out;
};
