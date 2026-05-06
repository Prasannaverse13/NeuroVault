import { GoogleGenerativeAI, type Content } from "@google/generative-ai";

const apiKey = process.env.GOOGLE_API_KEY;
let _genAI: GoogleGenerativeAI | null = null;

export const isGeminiConfigured = (): boolean => Boolean(apiKey);

const getGenAI = (): GoogleGenerativeAI => {
  if (!apiKey) throw new Error("GOOGLE_API_KEY environment variable is not set");
  if (!_genAI) _genAI = new GoogleGenerativeAI(apiKey);
  return _genAI;
};

const DEFAULT_MODEL = "gemini-2.5-flash";

const getModel = (modelName = DEFAULT_MODEL) =>
  getGenAI().getGenerativeModel({ model: modelName });

export const generateText = async (prompt: string): Promise<string> => {
  const model = getModel();
  const result = await model.generateContent(prompt);
  return result.response.text();
};

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export const chatWithHistory = async (
  systemInstruction: string,
  history: ChatMessage[],
  userMessage: string,
): Promise<string> => {
  const model = getGenAI().getGenerativeModel({
    model: DEFAULT_MODEL,
    systemInstruction,
  });

  const geminiHistory: Content[] = history.slice(0, -1).map((m) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }],
  }));

  const chat = model.startChat({ history: geminiHistory });
  const result = await chat.sendMessage(userMessage);
  return result.response.text();
};

export const generateJSON = async <T = unknown>(prompt: string): Promise<T> => {
  const model = getGenAI().getGenerativeModel({
    model: DEFAULT_MODEL,
    generationConfig: { responseMimeType: "application/json" },
  });
  const result = await model.generateContent(prompt);
  const text = result.response.text();
  try {
    return JSON.parse(text) as T;
  } catch {
    const match = text.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (match) return JSON.parse(match[1]) as T;
    throw new Error("Gemini did not return valid JSON");
  }
};

export const summarizeMemory = async (rawContent: string): Promise<{
  summary: string;
  tags: string[];
  category: string;
  importance: "low" | "medium" | "high";
}> => {
  return generateJSON<{ summary: string; tags: string[]; category: string; importance: "low" | "medium" | "high" }>(
    `You are an enterprise knowledge extraction AI. Analyze this content and return structured JSON.

Content: """
${rawContent.slice(0, 6000)}
"""

Return ONLY a JSON object (no markdown) with these exact fields:
{
  "summary": "A concise 1-2 sentence summary of the core information",
  "tags": ["tag1", "tag2", "tag3"],
  "category": "one of: DevOps | Infra | Incident | Finance | Security | Support | Knowledge",
  "importance": "one of: low | medium | high"
}

Auto-classify: incidents/outages → importance high; operational data → medium; general info → low.`,
  );
};

export const generateInsights = async (memorySummaries: string[]): Promise<Array<{
  title: string;
  description: string;
  category: string;
  severity: "info" | "warning" | "critical";
  recommendation: string;
}>> => {
  if (memorySummaries.length === 0) {
    return [{
      title: "No memories stored yet",
      description: "Start adding memories to your workspace to unlock AI-powered enterprise insights.",
      category: "Knowledge",
      severity: "info",
      recommendation: "Use the AI Copilot to ingest logs, tickets, or conversations.",
    }];
  }
  return generateJSON(
    `You are an enterprise operations intelligence AI. Analyze these workspace memories and generate 3-5 actionable insights.

Memories:
${memorySummaries.slice(0, 30).map((s, i) => `${i + 1}. ${s}`).join("\n")}

Return ONLY a JSON array (no markdown) of insight objects:
[{
  "title": "Short title",
  "description": "What pattern or finding you detected from the memories",
  "category": "DevOps | Infra | Finance | Security | Support | Knowledge",
  "severity": "info | warning | critical",
  "recommendation": "Specific actionable recommendation"
}]

Focus on: recurring failures, cost anomalies, operational patterns, security risks, knowledge gaps.`,
  );
};

export const agentReason = async (
  agentRole: string,
  query: string,
  context: string[],
): Promise<string> => {
  return generateText(
    `You are a ${agentRole} AI agent in the NeuroVault Enterprise platform.

Query: ${query}

Relevant context from memory:
${context.length > 0 ? context.map((c, i) => `${i + 1}. ${c}`).join("\n") : "No prior context available."}

Provide a concise, expert-level analysis and recommendation. Be specific and actionable. 2-4 sentences.`,
  );
};
