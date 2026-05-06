import { detectSensitive, redact } from "../lib/encryption";
import type { AgentResult } from "./index";

export interface PrivacyAgentInput {
  text: string;
  enforceRedaction?: boolean;
}

export interface PrivacyDecision {
  detectedCategories: string[];
  containsSensitive: boolean;
  sanitizedText: string;
  policy: "pass" | "redact" | "block";
}

export const runPrivacyAgent = async (
  input: PrivacyAgentInput,
): Promise<AgentResult<PrivacyDecision>> => {
  const start = Date.now();
  const detected = detectSensitive(input.text);
  const containsSensitive = detected.length > 0;
  const enforce = input.enforceRedaction ?? true;
  const sanitized = containsSensitive && enforce ? redact(input.text) : input.text;
  const policy: PrivacyDecision["policy"] = !containsSensitive
    ? "pass"
    : enforce
    ? "redact"
    : "block";

  return {
    agent: "privacy",
    summary: containsSensitive
      ? `Sanitized ${detected.length} category(ies): ${detected.join(", ")}`
      : "No sensitive data detected.",
    output: {
      detectedCategories: detected,
      containsSensitive,
      sanitizedText: sanitized,
      policy,
    },
    latencyMs: Date.now() - start,
  };
};
