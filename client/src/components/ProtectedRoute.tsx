import { ReactNode } from "react";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useAccount } from "wagmi";
import { Badge } from "@/components/ui/badge";
import { ShieldCheck, Lock, Brain, Cpu, Database, Activity } from "lucide-react";

const PREVIEW_CARDS = [
  { icon: Brain, label: "AI Copilot", desc: "Gemini-powered enterprise reasoning" },
  { icon: Database, label: "Memory Store", desc: "Encrypted decentralized persistence" },
  { icon: Cpu, label: "Agent Marketplace", desc: "Deploy & manage AI agents" },
  { icon: Activity, label: "Live Dashboard", desc: "Real-time workspace analytics" },
];

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { isConnected } = useAccount();

  if (isConnected) return <>{children}</>;

  return (
    <div className="relative flex min-h-screen w-full flex-col items-center justify-center overflow-hidden bg-[#0b0f1a] px-4 py-12 text-white">
      <div className="absolute left-1/4 top-1/3 -z-0 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#7c3aed12] blur-[120px]" />
      <div className="absolute right-1/4 bottom-1/3 -z-0 h-[400px] w-[400px] rounded-full bg-[#0891b212] blur-[100px]" />

      <div className="relative z-10 flex w-full max-w-2xl flex-col items-center text-center">
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-[#ffffff14] bg-[#ffffff08] backdrop-blur-sm">
          <Lock className="h-7 w-7 text-violet-400" />
        </div>

        <Badge className="mb-4 border border-violet-400/30 bg-violet-400/10 px-3 py-1 text-[10px] tracking-[2px] text-violet-300 hover:bg-violet-400/10">
          ENTERPRISE ACCESS REQUIRED
        </Badge>

        <h1 className="text-3xl font-semibold tracking-tight text-white">
          Connect Wallet to Access
          <span className="block bg-[linear-gradient(90deg,rgba(34,211,238,1)_0%,rgba(139,92,246,1)_100%)] bg-clip-text text-transparent">
            NeuroVault Enterprise
          </span>
        </h1>

        <p className="mt-3 max-w-md text-sm leading-relaxed text-slate-400">
          Your wallet is your enterprise identity. No passwords, no email — all workspace ownership, agent identity, and memory is secured on-chain.
        </p>

        <div className="mt-8 flex justify-center">
          <ConnectButton
            accountStatus="full"
            chainStatus="icon"
            showBalance={false}
          />
        </div>

        <div className="mt-10 grid w-full grid-cols-2 gap-3 sm:grid-cols-4">
          {PREVIEW_CARDS.map((card) => {
            const Icon = card.icon;
            return (
              <div
                key={card.label}
                className="relative overflow-hidden rounded-xl border border-[#ffffff0d] bg-[#ffffff04] p-4 text-left opacity-50 select-none"
              >
                <div className="absolute inset-0 flex items-center justify-center">
                  <Lock className="h-5 w-5 text-slate-600" />
                </div>
                <Icon className="h-5 w-5 text-slate-600 blur-[1px]" />
                <p className="mt-3 text-xs text-slate-600 blur-[1px]">{card.label}</p>
                <p className="mt-1 text-[10px] text-slate-700 blur-[1px]">{card.desc}</p>
              </div>
            );
          })}
        </div>

        <div className="mt-10 flex items-center gap-2 text-[11px] text-slate-600">
          <ShieldCheck className="h-3.5 w-3.5 text-cyan-700" />
          Secured by 0G Chain · AES-256-GCM Encrypted · Wallet-only auth
        </div>
      </div>
    </div>
  );
}
