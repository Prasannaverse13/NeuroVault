import { useState, useRef, useEffect } from "react";
import { DashboardLayout, DashboardCard } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Send, Sparkles, FileText, Zap } from "lucide-react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const initialMessages: Message[] = [
  {
    role: "assistant",
    content:
      "Hey! I'm your NeuroVault Copilot. I can analyze runs, draft prompts, summarize memories, or write SQL against your clusters. What's on your mind?",
  },
];

const suggestions = [
  "Summarize the last 24h of Atlas DevOps runs",
  "Draft a prompt for a refund support agent",
  "Show me memories tagged 'pricing experiment'",
  "Why did run r-9009 fail?",
];

const sampleReplies = [
  "Looking at the last 24 hours, Atlas DevOps handled 2,148 runs with a 99.6% success rate. The 9 failures clustered around the 14:00 UTC deploy — likely related to the staging gate timeout you flagged on Tuesday.",
  "Here's a refund support draft:\n\n• Verify order via order ID + email\n• Apply refund tier policy (full/partial)\n• Acknowledge tone: empathetic, no jargon\n• Escalate if order > $500 or aged > 90d",
  "Found 7 memories tagged 'pricing experiment'. Top match (94% recall): Q3 experiment B converted 14% better than control on the Pro tier.",
  "Run r-9009 failed at step 3 (deploy validation). Root cause: the staging gate webhook returned 504 after 3.4s. The agent retried twice before bubbling. Suggest raising the timeout to 8s.",
];

export default function AICopilotPage() {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages]);

  const send = (text?: string) => {
    const content = (text ?? input).trim();
    if (!content) return;
    const reply = sampleReplies[messages.length % sampleReplies.length];
    setMessages([
      ...messages,
      { role: "user", content },
      { role: "assistant", content: reply },
    ]);
    setInput("");
  };

  return (
    <DashboardLayout
      title="AI Copilot"
      subtitle="Pair-program with NeuroVault — context-aware across your entire workspace."
      actions={
        <Badge className="border border-[#ffffff14] bg-[#ffffff08] text-[10px] tracking-[1px] text-violet-300 hover:bg-[#ffffff08]">
          GPT-4 TURBO • CONTEXT 27.4M
        </Badge>
      }
    >
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
        <DashboardCard className="flex h-[640px] flex-col lg:col-span-3">
          <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto pr-2">
            {messages.map((m, i) => (
              <div
                key={i}
                data-testid={`message-${i}`}
                className={`flex gap-3 ${m.role === "user" ? "flex-row-reverse" : ""}`}
              >
                <div
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs ${
                    m.role === "user"
                      ? "bg-[#ffffff14] text-white"
                      : "bg-[linear-gradient(90deg,rgba(34,211,238,1)_0%,rgba(139,92,246,1)_100%)] text-white"
                  }`}
                >
                  {m.role === "user" ? "AK" : <Sparkles className="h-4 w-4" />}
                </div>
                <div
                  className={`max-w-[80%] whitespace-pre-line rounded-2xl px-4 py-3 text-sm ${
                    m.role === "user"
                      ? "bg-[#ffffff14] text-white"
                      : "bg-[#ffffff05] text-slate-200"
                  }`}
                >
                  {m.content}
                </div>
              </div>
            ))}
          </div>

          {messages.length <= 1 && (
            <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
              {suggestions.map((s, i) => (
                <button
                  key={s}
                  type="button"
                  data-testid={`suggestion-${i}`}
                  onClick={() => send(s)}
                  className="rounded-lg border border-[#ffffff14] bg-[#ffffff05] px-3 py-2 text-left text-xs text-slate-300 transition-colors hover:bg-[#ffffff0d]"
                >
                  {s}
                </button>
              ))}
            </div>
          )}

          <form
            onSubmit={(e) => {
              e.preventDefault();
              send();
            }}
            className="mt-4 flex items-center gap-2 rounded-xl border border-[#ffffff14] bg-[#ffffff08] p-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask anything about your workspace…"
              data-testid="input-copilot-message"
              className="flex-1 bg-transparent px-2 text-sm text-white placeholder:text-slate-500 focus:outline-none"
            />
            <Button
              type="submit"
              data-testid="button-send-message"
              className="h-9 w-9 rounded-lg bg-[linear-gradient(90deg,rgba(34,211,238,1)_0%,rgba(139,92,246,1)_100%)] p-0 text-white hover:opacity-95"
            >
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </DashboardCard>

        <div className="space-y-4">
          <DashboardCard>
            <h3 className="text-sm text-white">Context sources</h3>
            <div className="mt-3 space-y-2 text-xs">
              {[
                { icon: FileText, label: "27.4M memories" },
                { icon: Zap, label: "14 active agents" },
                { icon: Sparkles, label: "7 integrations" },
              ].map((c) => {
                const Icon = c.icon;
                return (
                  <div
                    key={c.label}
                    className="flex items-center gap-2 text-slate-400"
                  >
                    <Icon className="h-3 w-3 text-violet-400" />
                    {c.label}
                  </div>
                );
              })}
            </div>
          </DashboardCard>

          <DashboardCard>
            <h3 className="text-sm text-white">Tips</h3>
            <ul className="mt-3 space-y-2 text-xs text-slate-400">
              <li>Use @agent-name to scope a question.</li>
              <li>Prefix with /sql for direct cluster queries.</li>
              <li>Hit ⌘K from anywhere to open Copilot.</li>
            </ul>
          </DashboardCard>
        </div>
      </div>
    </DashboardLayout>
  );
}
