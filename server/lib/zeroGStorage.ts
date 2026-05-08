import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile, readdir } from "node:fs/promises";
import path from "node:path";
import type { MemoryObject } from "@shared/schema";

const FALLBACK_DIR = path.resolve(process.cwd(), ".0g-fallback-cache");

// Public 0G mainnet defaults — no extra env vars needed when ZG_PRIVATE_KEY is set
const ZG_RPC_URL     = process.env.ZG_RPC_URL      || "https://evmrpc.0g.ai";
const ZG_INDEXER_RPC = process.env.ZG_INDEXER_RPC  || "https://indexer-storage.0g.ai";

export interface UploadResult {
  storageRef: string;
  backend: "0g" | "local-fallback";
  txHash?: string;
  explorerUrl?: string;
}

// Storage is considered active whenever a private key is available (RPC URLs have defaults)
const isConfigured = (): boolean => Boolean(process.env.ZG_PRIVATE_KEY);

let zgClient: any = null;

const initZeroG = async (): Promise<any> => {
  if (zgClient) return zgClient;
  if (!isConfigured()) return null;
  try {
    const sdk = await import("@0glabs/0g-ts-sdk");
    const { Indexer } = sdk as any;
    zgClient = new Indexer(ZG_INDEXER_RPC);
    return zgClient;
  } catch (err) {
    console.warn("[0g-storage] SDK init failed, using local fallback:", err);
    return null;
  }
};

const fallbackUpload = async (memory: MemoryObject): Promise<UploadResult> => {
  await mkdir(FALLBACK_DIR, { recursive: true });
  const json = JSON.stringify(memory);
  const ref = createHash("sha256").update(json).digest("hex");
  await writeFile(path.join(FALLBACK_DIR, `${ref}.json`), json, "utf8");
  return { storageRef: `local:${ref}`, backend: "local-fallback" };
};

const fallbackRetrieve = async (storageRef: string): Promise<MemoryObject | null> => {
  const ref = storageRef.replace(/^local:/, "");
  try {
    const json = await readFile(path.join(FALLBACK_DIR, `${ref}.json`), "utf8");
    return JSON.parse(json) as MemoryObject;
  } catch {
    return null;
  }
};

export const uploadMemory = async (memory: MemoryObject): Promise<UploadResult> => {
  const client = await initZeroG();
  if (!client) return fallbackUpload(memory);
  try {
    const sdk = await import("@0glabs/0g-ts-sdk");
    const { Blob } = sdk as any;
    const json = JSON.stringify(memory);
    const blob = new Blob(Buffer.from(json, "utf8"));
    const [tx, err] = await client.upload(blob, ZG_RPC_URL, process.env.ZG_PRIVATE_KEY);
    if (err) throw err;
    return {
      storageRef: tx?.rootHash ?? tx?.toString?.() ?? "0g-uploaded",
      backend: "0g",
      txHash: tx?.txHash,
      explorerUrl: tx?.txHash
        ? `https://chainscan.0g.ai/tx/${tx.txHash}`
        : undefined,
    };
  } catch (err) {
    console.warn("[0g-storage] upload failed, using fallback:", err);
    return fallbackUpload(memory);
  }
};

export const retrieveMemory = async (storageRef: string): Promise<MemoryObject | null> => {
  if (storageRef.startsWith("local:")) return fallbackRetrieve(storageRef);
  const client = await initZeroG();
  if (!client) return fallbackRetrieve(storageRef);
  try {
    const data = await client.download(storageRef);
    return JSON.parse(Buffer.from(data).toString("utf8")) as MemoryObject;
  } catch (err) {
    console.warn("[0g-storage] download failed:", err);
    return fallbackRetrieve(storageRef);
  }
};

export const listFallbackMemories = async (): Promise<string[]> => {
  try {
    const files = await readdir(FALLBACK_DIR);
    return files.filter((f) => f.endsWith(".json")).map((f) => `local:${f.replace(".json", "")}`);
  } catch {
    return [];
  }
};

export const storageStatus = () => ({
  backend: isConfigured() ? "0g" : "local-fallback",
  configured: isConfigured(),
  endpoint: ZG_INDEXER_RPC,
  rpcUrl: ZG_RPC_URL,
});
