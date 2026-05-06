/**
 * 0G Compute Network abstraction layer.
 * Designed for future 0G Compute decentralized inference integration.
 *
 * Today this simulates inference execution with structured templated output.
 * To wire real inference: implement `executeOn0GCompute` against the 0G Serving
 * Provider API and switch the `provider` env to "0g".
 */

import { createHash } from "node:crypto";

export type ComputeProvider = "simulated" | "0g" | "openai";

export interface InferenceRequest {
  prompt: string;
  context?: string[];
  model?: string;
  maxTokens?: number;
  metadata?: Record<string, unknown>;
}

export interface InferenceResponse {
  output: string;
  provider: ComputeProvider;
  model: string;
  latencyMs: number;
  jobId: string;
  trace?: { providerNode?: string; verifiedHash?: string };
}

const provider: ComputeProvider =
  (process.env.COMPUTE_PROVIDER as ComputeProvider) || "simulated";

const hashJob = (req: InferenceRequest): string =>
  createHash("sha256")
    .update(JSON.stringify(req))
    .digest("hex")
    .slice(0, 16);

const simulate = async (req: InferenceRequest): Promise<InferenceResponse> => {
  const start = Date.now();
  const ctxSummary = (req.context ?? []).slice(0, 3).join(" • ") || "no prior context";
  const output =
    `Based on ${ctxSummary}, the following analysis applies to: "${req.prompt}". ` +
    `(Templated response — connect a real model or 0G Compute provider for live inference.)`;
  await new Promise((r) => setTimeout(r, 40));
  return {
    output,
    provider: "simulated",
    model: req.model ?? "neurovault-template-v1",
    latencyMs: Date.now() - start,
    jobId: hashJob(req),
    trace: { providerNode: "local-simulator", verifiedHash: hashJob(req) },
  };
};

export const executeInference = async (
  req: InferenceRequest,
): Promise<InferenceResponse> => {
  if (provider === "simulated") return simulate(req);
  // Stubs for future providers — keep API stable.
  if (provider === "0g") {
    console.warn("[0g-compute] real 0G Compute provider not yet wired; simulating");
    return simulate(req);
  }
  if (provider === "openai") {
    console.warn("[0g-compute] OPENAI provider stub; configure server/lib/zeroGCompute.ts to call OpenAI");
    return simulate(req);
  }
  return simulate(req);
};

export const computeStatus = () => ({ provider });
