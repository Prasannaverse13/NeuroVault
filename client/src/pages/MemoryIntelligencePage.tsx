import { useState } from "react";
import { DashboardLayout, DashboardCard, StatBlock } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Database, Search, Trash2, Loader2, Plus } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, useWorkspaceId } from "@/lib/api";
import { useAccount } from "wagmi";

interface Memory {
  id: string;
  agentId: string;
  type: string;
  tags: string[];
  summary: string;
  storageRef: string | null;
  createdAt: string;
}

const timeAgo = (d: string) => {
  const diff = Date.now() - new Date(d).getTime();
  if (diff < 60_000) return "just now";
  if (diff < 3_600_000) return `${Math.round(diff / 60_000)}m`;
  if (diff < 86_400_000) return `${Math.round(diff / 3_600_000)}h`;
  return `${Math.round(diff / 86_400_000)}d`;
};

export default function MemoryIntelligencePage() {
  const workspaceId = useWorkspaceId();
  const { address } = useAccount();
  const qc = useQueryClient();
  const [query, setQuery] = useState("");
  const [newPayload, setNewPayload] = useState("");
  const [showIngest, setShowIngest] = useState(false);

  const { data, isLoading } = useQuery<{ memories: Memory[] }>({
    queryKey: ["/api/memory", workspaceId],
    enabled: !!workspaceId,
    queryFn: () => api.listMemories(workspaceId!),
    staleTime: 30_000,
    refetchInterval: 30_000,
  });

  const ingestMutation = useMutation({
    mutationFn: async (payload: string) => {
      if (!workspaceId || !address) throw new Error("Wallet not connected");
      const agents = await api.listAgents(workspaceId);
      const agentId = agents.agents?.[0]?.id ?? workspaceId;
      return api.createMemory({ workspaceId, agentId, payload });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/memory", workspaceId] });
      qc.invalidateQueries({ queryKey: ["/api/dashboard/stats", workspaceId] });
      setNewPayload("");
      setShowIngest(false);
    },
  });

  const memories = data?.memories ?? [];
  const filtered = query
    ? memories.filter(
        (m) =>
          m.summary.toLowerCase().includes(query.toLowerCase()) ||
          m.tags.some((t) => t.toLowerCase().includes(query.toLowerCase())) ||
          m.type.toLowerCase().includes(query.toLowerCase()),
      )
    : memories;

  const storageRefs = memories.filter((m) => m.storageRef?.startsWith("local:")).length;
  const zeroGRefs = memories.filter((m) => m.storageRef && !m.storageRef.startsWith("local:")).length;
  const totalSizeEst = (memories.length * 0.008).toFixed(1);

  return (
    <DashboardLayout
      title="Memory intelligence"
      subtitle="Inspect, search, and manage Gemini-summarized memories across your workspace."
      actions={
        <Button
          data-testid="button-ingest"
          onClick={() => setShowIngest(!showIngest)}
          className="h-auto rounded-xl bg-[linear-gradient(90deg,rgba(34,211,238,1)_0%,rgba(139,92,246,1)_100%)] px-4 py-2 text-sm text-white hover:opacity-95"
        >
          <Plus className="mr-1 h-3.5 w-3.5" /> Ingest Memory
        </Button>
      }
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatBlock label="TOTAL MEMORIES" value={isLoading ? "—" : String(memories.length)} delta="In workspace" testId="stat-vectors" />
        <StatBlock label="EST. SIZE" value={`${totalSizeEst} MB`} delta="Encrypted at rest" testId="stat-storage" />
        <StatBlock label="0G STORAGE" value={isLoading ? "—" : String(zeroGRefs)} delta={`${storageRefs} local fallback`} testId="stat-recall" />
        <StatBlock label="CATEGORIES" value={isLoading ? "—" : String(new Set(memories.map((m) => m.type)).size)} delta="Gemini-classified" testId="stat-evictions" />
      </div>

      {showIngest && (
        <DashboardCard className="mt-6">
          <h2 className="text-base text-white">Ingest new memory</h2>
          <p className="mt-1 text-xs text-slate-400">
            Paste any raw content — logs, tickets, conversations. Gemini will summarize and auto-tag it,
            then AES-encrypt and store it.
          </p>
          <textarea
            value={newPayload}
            onChange={(e) => setNewPayload(e.target.value)}
            placeholder="Paste logs, incident reports, conversations, or any raw content…"
            data-testid="input-memory-payload"
            rows={6}
            className="mt-4 w-full rounded-lg border border-[#ffffff14] bg-[#ffffff08] px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-violet-400/50 focus:outline-none"
          />
          <div className="mt-3 flex items-center gap-3">
            <Button
              onClick={() => ingestMutation.mutate(newPayload)}
              disabled={!newPayload.trim() || ingestMutation.isPending || !workspaceId}
              data-testid="button-submit-memory"
              className="h-auto rounded-xl bg-[linear-gradient(90deg,rgba(34,211,238,1)_0%,rgba(139,92,246,1)_100%)] px-4 py-2 text-sm text-white hover:opacity-95 disabled:opacity-50"
            >
              {ingestMutation.isPending ? (
                <><Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> Gemini processing…</>
              ) : "Ingest & Encrypt"}
            </Button>
            {ingestMutation.isSuccess && (
              <span className="text-xs text-cyan-400">Memory stored successfully.</span>
            )}
            {ingestMutation.isError && (
              <span className="text-xs text-rose-400">{(ingestMutation.error as Error).message}</span>
            )}
          </div>
        </DashboardCard>
      )}

      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <DashboardCard className="lg:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="text-base text-white">Memory search</h2>
            <Badge className="border border-[#ffffff14] bg-[#ffffff08] text-[10px] tracking-[1px] text-violet-300 hover:bg-[#ffffff08]">
              GEMINI TAGS
            </Badge>
          </div>
          <div className="relative mt-4">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search summaries, tags, or categories…"
              data-testid="input-memory-search"
              className="w-full rounded-lg border border-[#ffffff14] bg-[#ffffff08] py-2 pl-9 pr-3 text-sm text-white placeholder:text-slate-500 focus:border-violet-400/50 focus:outline-none"
            />
          </div>

          <div className="mt-4 space-y-2">
            {isLoading && (
              <div className="flex items-center justify-center py-10">
                <Loader2 className="h-6 w-6 animate-spin text-violet-400" />
              </div>
            )}
            {!isLoading && !workspaceId && (
              <p className="py-8 text-center text-sm text-slate-500">
                Connect your wallet to view memories.
              </p>
            )}
            {!isLoading && workspaceId && filtered.length === 0 && (
              <p className="py-8 text-center text-sm text-slate-500">
                {query ? `No memories match "${query}".` : "No memories yet. Ingest your first one above."}
              </p>
            )}
            {filtered.map((m, i) => (
              <div
                key={m.id}
                data-testid={`memory-row-${i}`}
                className="flex items-start justify-between gap-4 rounded-lg border border-[#ffffff0d] bg-[#ffffff05] p-3"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-slate-200">{m.summary}</p>
                  <div className="mt-1 flex flex-wrap items-center gap-1.5">
                    <span className="text-xs text-slate-500">{m.type}</span>
                    {m.tags.slice(0, 3).map((t) => (
                      <span
                        key={t}
                        className="rounded-full border border-violet-400/20 bg-violet-400/10 px-1.5 py-0.5 text-[10px] text-violet-300"
                      >
                        {t}
                      </span>
                    ))}
                    <span className="text-xs text-slate-500">• {timeAgo(m.createdAt)} ago</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {m.storageRef && (
                    <span className="text-[10px] text-cyan-500" title={m.storageRef}>
                      {m.storageRef.startsWith("local:") ? "local" : "0G"}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </DashboardCard>

        <DashboardCard>
          <h2 className="text-base text-white">Storage</h2>
          <div className="mt-4 space-y-3">
            <div data-testid="cluster-local" className="rounded-lg border border-[#ffffff0d] bg-[#ffffff05] p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Database className="h-4 w-4 text-violet-400" />
                  <span className="text-sm text-white">0G Storage</span>
                </div>
                <Badge className="border-0 bg-cyan-400/10 text-[10px] tracking-[1px] text-cyan-300 hover:bg-transparent">
                  {zeroGRefs > 0 ? "ACTIVE" : "FALLBACK"}
                </Badge>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-slate-400">
                <div>
                  <p className="text-slate-500">Chain</p>
                  <p className="text-slate-200">0G Galileo</p>
                </div>
                <div>
                  <p className="text-slate-500">Memories</p>
                  <p className="text-slate-200">{memories.length}</p>
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-[#ffffff0d] bg-[#ffffff05] p-4">
              <p className="text-sm text-white">Local fallback</p>
              <p className="mt-1 text-xs text-slate-500">
                {storageRefs} memories cached locally (0G env vars not set).
              </p>
            </div>

            <div className="rounded-lg border border-violet-400/20 bg-violet-400/5 p-3 text-xs text-violet-300">
              All payloads are AES-256-GCM encrypted before storage. PII redacted via Privacy Agent.
            </div>
          </div>
        </DashboardCard>
      </div>
    </DashboardLayout>
  );
}
