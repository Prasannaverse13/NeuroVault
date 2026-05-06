import type { Memory } from "@shared/schema";
import { embed, cosine } from "../lib/embeddings";
import { decrypt } from "../lib/encryption";
import { agentReason } from "../lib/gemini";
import type { AgentResult } from "./index";

export interface MemoryAgentInput {
  query: string;
  memories: Memory[];
  topK?: number;
}

export interface RankedMemory {
  memoryId: string;
  agentId: string;
  type: string;
  summary: string;
  score: number;
  tags: string[];
  decryptedPreview?: string;
}

export const runMemoryAgent = async (
  input: MemoryAgentInput,
): Promise<AgentResult<RankedMemory[]>> => {
  const start = Date.now();
  const queryVec = embed(input.query);
  const ranked: RankedMemory[] = input.memories
    .map((m) => {
      const score = m.embedding
        ? cosine(queryVec, m.embedding as number[])
        : cosine(queryVec, embed(m.summary));
      let decryptedPreview: string | undefined;
      try {
        decryptedPreview = decrypt(m.encryptedPayload).slice(0, 300);
      } catch {
        decryptedPreview = undefined;
      }
      return {
        memoryId: m.id,
        agentId: m.agentId,
        type: m.type,
        summary: m.summary,
        score: Number(score.toFixed(4)),
        tags: m.tags,
        decryptedPreview,
      };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, input.topK ?? 5);

  const contextSummaries = ranked.map((m) => m.summary);
  let analysis = `Retrieved ${ranked.length} relevant memories from ${input.memories.length} total.`;
  if (ranked.length > 0) {
    try {
      analysis = await agentReason("Memory Retrieval", input.query, contextSummaries);
    } catch {
      // keep default
    }
  }

  return {
    agent: "memory",
    summary: analysis,
    output: ranked,
    latencyMs: Date.now() - start,
  };
};
