import { useState } from "react";
import { useLocation } from "wouter";
import { DashboardLayout, DashboardCard } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bot, ChevronRight, Check } from "lucide-react";

const templates = [
  { id: "blank", name: "Blank Agent", desc: "Start from scratch with no preset." },
  { id: "support", name: "Customer Support", desc: "Handles tickets, FAQs, escalations." },
  { id: "devops", name: "DevOps Engineer", desc: "Monitors infra, runs playbooks." },
  { id: "research", name: "Research Analyst", desc: "Synthesizes papers and reports." },
];

const memoryProfiles = [
  { id: "ephemeral", name: "Ephemeral", desc: "Forget after each session." },
  { id: "session", name: "Session Memory", desc: "Remember within a conversation." },
  { id: "persistent", name: "Persistent Vault", desc: "Long-term cognitive storage." },
];

const steps = ["Template", "Identity", "Memory", "Review"];

export default function AgentCreationPage() {
  const [, navigate] = useLocation();
  const [step, setStep] = useState(0);
  const [config, setConfig] = useState({
    template: "support",
    name: "Echo Support",
    description: "Handles inbound customer questions with full historical context.",
    memory: "persistent",
    publicListing: false,
  });

  const next = () =>
    step < steps.length - 1 ? setStep(step + 1) : navigate("/dashboard");
  const back = () => step > 0 && setStep(step - 1);

  return (
    <DashboardLayout
      title="Create a new agent"
      subtitle="Configure identity, memory profile, and capabilities for your agent."
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
            <span
              className={`text-xs ${
                i === step ? "text-white" : "text-slate-500"
              }`}
            >
              {s}
            </span>
            {i < steps.length - 1 && (
              <span className="h-px flex-1 bg-[#ffffff14]" />
            )}
          </div>
        ))}
      </div>

      <DashboardCard>
        {step === 0 && (
          <div>
            <h2 className="text-base text-white">Pick a starting template</h2>
            <p className="mt-1 text-sm text-slate-400">
              Templates ship with sensible defaults you can fine-tune later.
            </p>
            <div className="mt-6 grid grid-cols-1 gap-3 md:grid-cols-2">
              {templates.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  data-testid={`template-${t.id}`}
                  onClick={() => setConfig({ ...config, template: t.id })}
                  className={`rounded-xl border p-4 text-left transition-colors ${
                    config.template === t.id
                      ? "border-violet-400/60 bg-[#8b5cf61a]"
                      : "border-[#ffffff14] bg-[#ffffff05] hover:bg-[#ffffff0d]"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Bot className="h-4 w-4 text-violet-400" />
                    <span className="text-sm text-white">{t.name}</span>
                  </div>
                  <p className="mt-2 text-xs text-slate-400">{t.desc}</p>
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
                data-testid="input-agent-name"
                className="w-full rounded-lg border border-[#ffffff14] bg-[#ffffff08] px-3 py-2 text-sm text-white focus:border-violet-400/50 focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-slate-400">
                Description
              </label>
              <textarea
                value={config.description}
                onChange={(e) =>
                  setConfig({ ...config, description: e.target.value })
                }
                data-testid="input-agent-description"
                rows={4}
                className="w-full rounded-lg border border-[#ffffff14] bg-[#ffffff08] px-3 py-2 text-sm text-white focus:border-violet-400/50 focus:outline-none"
              />
            </div>
            <div className="flex items-center justify-between rounded-lg border border-[#ffffff14] bg-[#ffffff05] px-4 py-3">
              <div>
                <p className="text-sm text-white">List on marketplace</p>
                <p className="text-xs text-slate-500">
                  Other workspaces can install this agent.
                </p>
              </div>
              <button
                type="button"
                onClick={() =>
                  setConfig({ ...config, publicListing: !config.publicListing })
                }
                data-testid="toggle-public-listing"
                className={`relative h-6 w-11 rounded-full transition-colors ${
                  config.publicListing ? "bg-violet-500" : "bg-[#ffffff14]"
                }`}
              >
                <span
                  className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all ${
                    config.publicListing ? "left-5" : "left-0.5"
                  }`}
                />
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div>
            <h2 className="text-base text-white">Memory profile</h2>
            <p className="mt-1 text-sm text-slate-400">
              Define how this agent remembers across sessions.
            </p>
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
                  {config.memory === m.id && (
                    <Check className="h-4 w-4 text-violet-400" />
                  )}
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
                Template: templates.find((t) => t.id === config.template)?.name,
                Name: config.name,
                Description: config.description,
                Memory: memoryProfiles.find((m) => m.id === config.memory)?.name,
                "Public listing": config.publicListing ? "Yes" : "No",
              }).map(([k, v]) => (
                <div key={k} className="flex justify-between gap-4">
                  <span className="text-slate-500">{k}</span>
                  <span className="text-right text-slate-200">{v}</span>
                </div>
              ))}
            </div>
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
            data-testid="button-step-next"
            className="h-auto rounded-xl bg-[linear-gradient(90deg,rgba(34,211,238,1)_0%,rgba(139,92,246,1)_100%)] px-5 py-2 text-sm text-white hover:opacity-95"
          >
            {step === steps.length - 1 ? "Deploy agent" : "Continue"}
            <ChevronRight className="ml-1 h-4 w-4" />
          </Button>
        </div>
      </DashboardCard>
    </DashboardLayout>
  );
}
