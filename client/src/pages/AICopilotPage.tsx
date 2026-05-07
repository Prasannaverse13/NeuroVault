import { useState, useRef, useEffect } from "react";
import { DashboardLayout, DashboardCard } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Send, Sparkles, FileText, Zap, Loader2, AlertCircle,
  GitBranch, GitCommit, CircleDot, GitPullRequest, RefreshCw, ExternalLink,
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, useWorkspaceId } from "@/lib/api";
import { useAccount } from "wagmi";
import { SiGithub } from "react-icons/si";

interface Message {
  role: "user" | "assistant";
  content: string;
  latencyMs?: number;
  error?: boolean;
  githubDataUsed?: boolean;
}

const SUGGESTIONS = [
  "What repositories are connected to my workspace?",
  "List recent commits and summarize the activity",
  "Show open issues and suggest priorities",
  "Analyze pull requests — any blocked ones?",
  "Summarize the recent incidents in this workspace",
  "What DevOps patterns do you see in my memories?",
];

const SYSTEM_GREETING =
  "Hello! I'm NeuroVault Copilot, powered by Gemini 2.5 Flash. I have live access to your GitHub repositories — ask me about commits, issues, pull requests, or repository activity. I also have full context from your workspace memories.\n\nWhat's on your mind?";

export default function AICopilotPage() {
  const workspaceId = useWorkspaceId();
  const qc = useQueryClient();
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

  const { data: ghData, isLoading: ghLoading, error: ghError } = useQuery({
    queryKey: ["/api/github/repos", workspaceId],
    enabled: !!workspaceId,
    queryFn: () => api.githubRepos(workspaceId!),
    staleTime: 120_000,
    retry: false,
  });

  const syncMut = useMutation({
    mutationFn: () => api.githubSync(workspaceId!),
    onSuccess: (result) => {
      qc.invalidateQueries({ queryKey: ["/api/memory", workspaceId] });
      qc.invalidateQueries({ queryKey: ["/api/github/repos", workspaceId] });
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `GitHub sync complete. Indexed ${result.memoriesCreated} repositories into workspace memory:\n${result.repos.slice(0, 10).map((r) => `• ${r}`).join("\n")}`,
        },
      ]);
    },
    onError: (e: any) => {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: `Sync failed: ${e.message}`, error: true },
      ]);
    },
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
        {
          role: "assistant",
          content: res.response,
          latencyMs: res.latencyMs,
          githubDataUsed: res.githubDataUsed,
        },
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
  const repos = ghData?.repos ?? [];
  const githubConnected = !ghError && (ghLoading || repos.length > 0);

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
        {/* Chat window */}
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
                  <div className="mt-1 flex items-center gap-2">
                    {m.latencyMs && (
                      <span className="text-[10px] text-slate-600">
                        {(m.latencyMs / 1000).toFixed(1)}s
                      </span>
                    )}
                    {m.githubDataUsed && (
                      <span className="flex items-center gap-1 text-[10px] text-emerald-500">
                        <SiGithub className="h-2.5 w-2.5" /> live GitHub data
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[linear-gradient(90deg,rgba(34,211,238,1)_0%,rgba(139,92,246,1)_100%)]">
                  <Loader2 className="h-4 w-4 animate-spin text-white" />
                </div>
                <div className="rounded-2xl bg-[#ffffff05] px-4 py-3 text-sm text-slate-400">
                  Fetching live data &amp; thinking…
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
                  ? "Ask about repos, commits, issues, or anything in your workspace…"
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

        {/* Sidebar */}
        <div className="space-y-4">
          {/* GitHub panel */}
          <DashboardCard>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <SiGithub className="h-4 w-4 text-white" />
                <h3 className="text-sm text-white">GitHub</h3>
              </div>
              {workspaceId && githubConnected && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => syncMut.mutate()}
                  disabled={syncMut.isPending || !workspaceId}
                  data-testid="button-github-sync"
                  className="h-6 w-6 rounded p-0 text-slate-500 hover:text-white"
                  title="Sync to memory"
                >
                  {syncMut.isPending
                    ? <Loader2 className="h-3 w-3 animate-spin" />
                    : <RefreshCw className="h-3 w-3" />}
                </Button>
              )}
            </div>

            {!workspaceId ? (
              <p className="mt-2 text-[11px] text-amber-400">Connect wallet to access GitHub</p>
            ) : ghLoading ? (
              <div className="mt-3 flex items-center gap-2 text-xs text-slate-500">
                <Loader2 className="h-3 w-3 animate-spin" /> Loading repos…
              </div>
            ) : ghError || repos.length === 0 ? (
              <div className="mt-3">
                <p className="text-[11px] text-slate-500">
                  {ghError ? "GitHub not connected." : "No repositories found."}
                </p>
                <a
                  href="/integrations"
                  className="mt-1 block text-[11px] text-violet-400 hover:text-violet-300 underline"
                >
                  Connect GitHub →
                </a>
              </div>
            ) : (
              <div className="mt-3 space-y-2">
                <p className="text-[10px] text-slate-500">{repos.length} repositories</p>
                {repos.slice(0, 6).map((r) => (
                  <a
                    key={r.id}
                    href={r.htmlUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex items-start justify-between gap-2 rounded-lg border border-[#ffffff0d] bg-[#ffffff05] p-2 transition-colors hover:bg-[#ffffff0d]"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-[11px] font-medium text-slate-300 group-hover:text-white">
                        {r.name}
                      </p>
                      <div className="mt-0.5 flex items-center gap-2 text-[10px] text-slate-600">
                        {r.language && <span className="text-violet-400">{r.language}</span>}
                        {r.openIssuesCount > 0 && (
                          <span className="flex items-center gap-0.5">
                            <CircleDot className="h-2.5 w-2.5 text-rose-400" />{r.openIssuesCount}
                          </span>
                        )}
                      </div>
                    </div>
                    <ExternalLink className="h-3 w-3 shrink-0 text-slate-700 group-hover:text-slate-400" />
                  </a>
                ))}
                {repos.length > 6 && (
                  <p className="text-[10px] text-slate-600">+{repos.length - 6} more repos accessible</p>
                )}
              </div>
            )}
          </DashboardCard>

          {/* Context sources */}
          <DashboardCard>
            <h3 className="text-sm text-white">Context sources</h3>
            <div className="mt-3 space-y-2 text-xs">
              {[
                { icon: FileText, label: `${memoryCount} workspace memories` },
                { icon: Zap, label: `${agentCount} active agents` },
                { icon: SiGithub, label: repos.length > 0 ? `${repos.length} GitHub repos` : "GitHub not connected" },
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
          </DashboardCard>

          {/* Pipeline */}
          <DashboardCard>
            <h3 className="text-sm text-white">Pipeline</h3>
            <ol className="mt-3 space-y-1 text-[11px] text-slate-400">
              {[
                "GitHub API fetch",
                "Memory retrieval",
                "DevOps / Billing agents",
                "Gemini 2.5 Flash",
                "Privacy redaction",
              ].map((step, i) => (
                <li key={step} className="flex items-center gap-2">
                  <span className={`flex h-4 w-4 items-center justify-center rounded-full text-[9px] ${
                    i === 0 ? "bg-emerald-400/20 text-emerald-300" : "bg-violet-400/20 text-violet-300"
                  }`}>
                    {i + 1}
                  </span>
                  {step}
                  {i === 0 && (
                    <span className="ml-auto text-[9px] text-emerald-500 font-medium">LIVE</span>
                  )}
                </li>
              ))}
            </ol>
          </DashboardCard>

          {/* Quick queries */}
          <DashboardCard>
            <h3 className="text-sm text-white">Quick queries</h3>
            <div className="mt-3 space-y-1.5">
              {[
                { icon: GitBranch, label: "List my repos", query: "What repositories are connected to my workspace?" },
                { icon: GitCommit, label: "Recent commits", query: "Show me recent commits and summarize the activity" },
                { icon: CircleDot, label: "Open issues", query: "List open issues and suggest which to prioritize" },
                { icon: GitPullRequest, label: "Pull requests", query: "Show open pull requests — any that need review?" },
              ].map((q) => {
                const Icon = q.icon;
                return (
                  <button
                    key={q.label}
                    type="button"
                    onClick={() => send(q.query)}
                    disabled={loading}
                    className="flex w-full items-center gap-2 rounded-lg border border-[#ffffff0d] bg-[#ffffff05] px-2.5 py-2 text-left text-[11px] text-slate-400 transition-colors hover:bg-[#ffffff0d] hover:text-white disabled:opacity-40"
                  >
                    <Icon className="h-3 w-3 shrink-0 text-violet-400" />
                    {q.label}
                  </button>
                );
              })}
            </div>
          </DashboardCard>
        </div>
      </div>
    </DashboardLayout>
  );
}
