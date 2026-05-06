import { useState } from "react";
import { useLocation } from "wouter";
import { DashboardLayout, DashboardCard } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bot, ChevronRight, Check, Loader2 } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api, useWorkspaceId } from "@/lib/api";
import { useAccount } from "wagmi";

const templates = [
  { id: "support", name: "Customer Support", desc: "Handles tickets, FAQs, and escalations with full memory context.", role: "support" },
  { id: "devops", name: "DevOps Engineer", desc: "Monitors infra, runs playbooks, and analyzes incidents.", role: "devops" },
  { id: "finance", name: "Finance Analyst", desc: "Tracks costs, usage, and billing anomalies.", role: "finance" },
  { id: "memory", name: "Memory Archivist", desc: "Extracts and organizes enterprise knowledge.", role: "memory" },
  { id: "privacy", name: "Privacy Guardian", desc: "Enforces PII policies and data governance.", role: "privacy" },
];

const memoryProfiles = [
  { id: "ephemeral", name: "Ephemeral", desc: "Forget after each session." },
  { id: "session", name: "Session Memory", desc: "Remember within a conversation." },
  { id: "persistent", name: "Persistent Vault", desc: "Long-term cognitive storage on 0G." },
];

const steps = ["Template", "Identity", "Memory", "Review"];

export default function AgentCreationPage() {
  const [, navigate] = useLocation();
  const workspaceId = useWorkspaceId();
  const { address } = useAccount();
  const qc = useQueryClient();

  const [step, setStep] = useState(0);
  const [config, setConfig] = useState({
    templateId: "support",
    name: "",
    description: "",
    memory: "persistent",
    publicListing: false,
  });

  const selectedTemplate = templates.find((t) => t.id === config.templateId) ?? templates[0];

  const createMutation = useMutation({
    mutationFn: async () => {
      if (!workspaceId || !address) throw new Error("Wallet not connected");
      return api.createAgent({
        workspaceId,
        ownerWallet: address,
        name: config.name || selectedTemplate.name,
        role: selectedTemplate.role,
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/dashboard/stats", workspaceId] });
      navigate("/dashboard");
    },
  });

  const next = () => {
    if (step < steps.length - 1) {
      setStep(step + 1);
    } else {
      createMutation.mutate();
    }
  };
  const back = () => step > 0 && setStep(step - 1);

  return (
    <DashboardLayout
      title="Create a new agent"
      subtitle="Configure identity, memory profile, and capabilities — deployed to the 0G chain."
    >
      <div className="mb-8 flex items-center gap-2">
        {steps.map((s, i) => (
          <div key={s} className="flex flex-1 items-center gap-2">
            <div
              className={`flex h-7 w-7 items-center justify-center rounded-full text-xs ${
                i <= step
                  ? "bg-[linear-gradient(90deg,rgba(34,211,238,1)_0%,rgba(139,92,246,1)_100%)] text-white"
                  : "border border-[#ffffff14] bg-[#ffffff08] text-slate-500"
              }`}
            >
              {i < step ? <Check className="h-3 w-3" /> : i + 1}
            </div>
            <span className={`text-xs ${i === step ? "text-white" : "text-slate-500"}`}>{s}</span>
            {i < steps.length - 1 && <span className="h-px flex-1 bg-[#ffffff14]" />}
          </div>
        ))}
      </div>

      <DashboardCard>
        {step === 0 && (
          <div>
            <h2 className="text-base text-white">Pick a starting template</h2>
            <p className="mt-1 text-sm text-slate-400">Each agent role has a tailored Gemini system prompt and memory strategy.</p>
            <div className="mt-6 grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
              {templates.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  data-testid={`template-${t.id}`}
                  onClick={() => setConfig({ ...config, templateId: t.id })}
                  className={`rounded-xl border p-4 text-left transition-colors ${
                    config.templateId === t.id
                      ? "border-violet-400/60 bg-[#8b5cf61a]"
                      : "border-[#ffffff14] bg-[#ffffff05] hover:bg-[#ffffff0d]"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Bot className="h-4 w-4 text-violet-400" />
                    <span className="text-sm text-white">{t.name}</span>
                  </div>
                  <p className="mt-2 text-xs text-slate-400">{t.desc}</p>
                  <Badge className="mt-3 border border-[#ffffff14] bg-[#ffffff08] text-[9px] tracking-[1px] text-slate-400 hover:bg-[#ffffff08]">
                    {t.role.toUpperCase()}
                  </Badge>
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-4">
            <h2 className="text-base text-white">Agent identity</h2>
            <div>
              <label className="mb-1 block text-xs text-slate-400">Name</label>
              <input
                type="text"
                value={config.name}
                onChange={(e) => setConfig({ ...config, name: e.target.value })}
                placeholder={selectedTemplate.name}
                data-testid="input-agent-name"
                className="w-full rounded-lg border border-[#ffffff14] bg-[#ffffff08] px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-violet-400/50 focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-slate-400">Description</label>
              <textarea
                value={config.description}
                onChange={(e) => setConfig({ ...config, description: e.target.value })}
                placeholder={selectedTemplate.desc}
                data-testid="input-agent-description"
                rows={3}
                className="w-full rounded-lg border border-[#ffffff14] bg-[#ffffff08] px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-violet-400/50 focus:outline-none"
              />
            </div>
            <div className="rounded-lg border border-[#ffffff14] bg-[#ffffff05] px-4 py-3 text-sm">
              <p className="text-slate-400">Owner wallet</p>
              <p className="mt-1 font-mono text-xs text-white">{address ?? "— connect wallet —"}</p>
            </div>
            <div className="flex items-center justify-between rounded-lg border border-[#ffffff14] bg-[#ffffff05] px-4 py-3">
              <div>
                <p className="text-sm text-white">List on marketplace</p>
                <p className="text-xs text-slate-500">Other workspaces can install this agent.</p>
              </div>
              <button
                type="button"
                onClick={() => setConfig({ ...config, publicListing: !config.publicListing })}
                data-testid="toggle-public-listing"
                className={`relative h-6 w-11 rounded-full transition-colors ${config.publicListing ? "bg-violet-500" : "bg-[#ffffff14]"}`}
              >
                <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all ${config.publicListing ? "left-5" : "left-0.5"}`} />
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div>
            <h2 className="text-base text-white">Memory profile</h2>
            <p className="mt-1 text-sm text-slate-400">Define how this agent remembers across sessions.</p>
            <div className="mt-6 space-y-3">
              {memoryProfiles.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  data-testid={`memory-profile-${m.id}`}
                  onClick={() => setConfig({ ...config, memory: m.id })}
                  className={`flex w-full items-center justify-between rounded-xl border p-4 text-left transition-colors ${
                    config.memory === m.id
                      ? "border-violet-400/60 bg-[#8b5cf61a]"
                      : "border-[#ffffff14] bg-[#ffffff05] hover:bg-[#ffffff0d]"
                  }`}
                >
                  <div>
                    <p className="text-sm text-white">{m.name}</p>
                    <p className="mt-1 text-xs text-slate-400">{m.desc}</p>
                  </div>
                  {config.memory === m.id && <Check className="h-4 w-4 text-violet-400" />}
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 3 && (
          <div>
            <h2 className="text-base text-white">Review configuration</h2>
            <div className="mt-6 space-y-3 rounded-xl border border-[#ffffff14] bg-[#ffffff05] p-4 text-sm">
              {Object.entries({
                Template: selectedTemplate.name,
                Role: selectedTemplate.role,
                Name: config.name || selectedTemplate.name,
                Memory: memoryProfiles.find((m) => m.id === config.memory)?.name,
                "Owner wallet": address ? `${address.slice(0, 10)}…` : "—",
                "Public listing": config.publicListing ? "Yes" : "No",
                Workspace: workspaceId ? workspaceId.slice(0, 16) + "…" : "—",
              }).map(([k, v]) => (
                <div key={k} className="flex justify-between gap-4">
                  <span className="text-slate-500">{k}</span>
                  <span className="text-right text-slate-200">{v}</span>
                </div>
              ))}
            </div>
            {!workspaceId && (
              <div className="mt-4 rounded-lg border border-amber-400/30 bg-amber-400/5 px-4 py-3 text-sm text-amber-300">
                Connect your wallet before deploying an agent.
              </div>
            )}
            {createMutation.isError && (
              <div className="mt-4 rounded-lg border border-rose-400/30 bg-rose-400/5 px-4 py-3 text-sm text-rose-300">
                {(createMutation.error as Error).message}
              </div>
            )}
            <Badge className="mt-4 border border-[#ffffff14] bg-[#ffffff08] text-[10px] tracking-[1px] text-cyan-300 hover:bg-[#ffffff08]">
              READY TO DEPLOY
            </Badge>
          </div>
        )}

        <div className="mt-8 flex items-center justify-between border-t border-[#ffffff0d] pt-6">
          <Button
            type="button"
            variant="ghost"
            onClick={back}
            disabled={step === 0}
            data-testid="button-step-back"
            className="text-slate-400 hover:bg-[#ffffff08] hover:text-white disabled:opacity-30"
          >
            Back
          </Button>
          <Button
            type="button"
            onClick={next}
            disabled={createMutation.isPending || (step === steps.length - 1 && !workspaceId)}
            data-testid="button-step-next"
            className="h-auto rounded-xl bg-[linear-gradient(90deg,rgba(34,211,238,1)_0%,rgba(139,92,246,1)_100%)] px-5 py-2 text-sm text-white hover:opacity-95 disabled:opacity-50"
          >
            {createMutation.isPending ? (
              <><Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> Deploying…</>
            ) : step === steps.length - 1 ? (
              "Deploy agent"
            ) : (
              "Continue"
            )}
            {!createMutation.isPending && <ChevronRight className="ml-1 h-4 w-4" />}
          </Button>
        </div>
      </DashboardCard>
    </DashboardLayout>
  );
}
