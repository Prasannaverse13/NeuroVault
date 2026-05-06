import { useState, useRef, useEffect } from "react";
import { DashboardLayout, DashboardCard } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Send, Sparkles, FileText, Zap, Loader2, AlertCircle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { api, useWorkspaceId } from "@/lib/api";
import { useAccount } from "wagmi";

interface Message {
  role: "user" | "assistant";
  content: string;
  latencyMs?: number;
  error?: boolean;
}

const SUGGESTIONS = [
  "Summarize the recent incidents in this workspace",
  "What DevOps patterns do you see in my memories?",
  "Draft a post-mortem for the latest deployment issue",
  "Analyze recurring failures and recommend fixes",
];

const SYSTEM_GREETING =
  "Hello! I'm NeuroVault Copilot, powered by Gemini 2.5 Flash. I have full context from your workspace memories and can help with incident analysis, DevOps insights, knowledge extraction, and enterprise reasoning. What's on your mind?";

export default function AICopilotPage() {
  const workspaceId = useWorkspaceId();
  const { address } = useAccount();
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: SYSTEM_GREETING },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const { data: memData } = useQuery<{ memories: any[] }>({
    queryKey: ["/api/memory", workspaceId],
    enabled: !!workspaceId,
    queryFn: () => api.listMemories(workspaceId!),
    staleTime: 60_000,
  });

  const { data: statsData } = useQuery<{ agentCount: number }>({
    queryKey: ["/api/dashboard/stats", workspaceId],
    enabled: !!workspaceId,
    queryFn: () => api.dashboardStats(workspaceId!),
    staleTime: 60_000,
  });

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const send = async (text?: string) => {
    const content = (text ?? input).trim();
    if (!content || loading) return;
    setInput("");

    const userMsg: Message = { role: "user", content };
    const history = messages
      .filter((m) => !m.error)
      .map((m) => ({ role: m.role, content: m.content }));
    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);

    try {
      if (!workspaceId) throw new Error("No workspace connected. Please connect your wallet first.");
      const res = await api.chatCopilot(workspaceId, content, history);
      if (res.error) throw new Error(res.error);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: res.response, latencyMs: res.latencyMs },
      ]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: err.message ?? "Failed to get response.", error: true },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const memoryCount = memData?.memories?.length ?? 0;
  const agentCount = statsData?.agentCount ?? 0;

  return (
    <DashboardLayout
      title="AI Copilot"
      subtitle="Context-aware enterprise reasoning — powered by Gemini 2.5 Flash."
      actions={
        <Badge className="border border-[#ffffff14] bg-[#ffffff08] text-[10px] tracking-[1px] text-violet-300 hover:bg-[#ffffff08]">
          GEMINI 2.5 FLASH • LIVE
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
                      : m.error
                      ? "bg-rose-500/20 text-rose-300"
                      : "bg-[linear-gradient(90deg,rgba(34,211,238,1)_0%,rgba(139,92,246,1)_100%)] text-white"
                  }`}
                >
                  {m.role === "user"
                    ? (address ? address.slice(2, 4).toUpperCase() : "U")
                    : m.error
                    ? <AlertCircle className="h-4 w-4" />
                    : <Sparkles className="h-4 w-4" />}
                </div>
                <div className="flex max-w-[82%] flex-col">
                  <div
                    className={`whitespace-pre-line rounded-2xl px-4 py-3 text-sm ${
                      m.role === "user"
                        ? "bg-[#ffffff14] text-white"
                        : m.error
                        ? "bg-rose-400/10 text-rose-200"
                        : "bg-[#ffffff05] text-slate-200"
                    }`}
                  >
                    {m.content}
                  </div>
                  {m.latencyMs && (
                    <span className="mt-1 text-right text-[10px] text-slate-600">
                      {(m.latencyMs / 1000).toFixed(1)}s
                    </span>
                  )}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[linear-gradient(90deg,rgba(34,211,238,1)_0%,rgba(139,92,246,1)_100%)]">
                  <Loader2 className="h-4 w-4 animate-spin text-white" />
                </div>
                <div className="rounded-2xl bg-[#ffffff05] px-4 py-3 text-sm text-slate-400">
                  Thinking…
                </div>
              </div>
            )}
          </div>

          {messages.length <= 1 && (
            <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
              {SUGGESTIONS.map((s, i) => (
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
            onSubmit={(e) => { e.preventDefault(); send(); }}
            className="mt-4 flex items-center gap-2 rounded-xl border border-[#ffffff14] bg-[#ffffff08] p-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={loading}
              placeholder={
                workspaceId
                  ? "Ask anything about your workspace…"
                  : "Connect your wallet to start chatting…"
              }
              data-testid="input-copilot-message"
              className="flex-1 bg-transparent px-2 text-sm text-white placeholder:text-slate-500 focus:outline-none disabled:opacity-50"
            />
            <Button
              type="submit"
              disabled={loading || !input.trim()}
              data-testid="button-send-message"
              className="h-9 w-9 rounded-lg bg-[linear-gradient(90deg,rgba(34,211,238,1)_0%,rgba(139,92,246,1)_100%)] p-0 text-white hover:opacity-95 disabled:opacity-50"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </form>
        </DashboardCard>

        <div className="space-y-4">
          <DashboardCard>
            <h3 className="text-sm text-white">Context sources</h3>
            <div className="mt-3 space-y-2 text-xs">
              {[
                { icon: FileText, label: `${memoryCount} workspace memories` },
                { icon: Zap, label: `${agentCount} active agents` },
                { icon: Sparkles, label: "Gemini 2.5 Flash" },
              ].map((c) => {
                const Icon = c.icon;
                return (
                  <div key={c.label} className="flex items-center gap-2 text-slate-400">
                    <Icon className="h-3 w-3 text-violet-400" />
                    {c.label}
                  </div>
                );
              })}
            </div>
            {!workspaceId && (
              <p className="mt-3 text-[10px] text-amber-400">
                Connect wallet to enable memory context
              </p>
            )}
          </DashboardCard>

          <DashboardCard>
            <h3 className="text-sm text-white">Tips</h3>
            <ul className="mt-3 space-y-2 text-xs text-slate-400">
              <li>Mention agent roles to scope analysis (DevOps, Privacy, Billing).</li>
              <li>Copilot auto-stores conversations as memories.</li>
              <li>Memories are AES-encrypted before 0G Storage.</li>
            </ul>
          </DashboardCard>

          <DashboardCard>
            <h3 className="text-sm text-white">Pipeline</h3>
            <ol className="mt-3 space-y-1 text-[11px] text-slate-400">
              {["Memory retrieval", "DevOps / Billing agents", "Gemini 2.5 Flash", "Privacy redaction"].map(
                (step, i) => (
                  <li key={step} className="flex items-center gap-2">
                    <span className="flex h-4 w-4 items-center justify-center rounded-full bg-violet-400/20 text-[9px] text-violet-300">
                      {i + 1}
                    </span>
                    {step}
                  </li>
                ),
              )}
            </ol>
          </DashboardCard>
        </div>
      </div>
    </DashboardLayout>
  );
}
