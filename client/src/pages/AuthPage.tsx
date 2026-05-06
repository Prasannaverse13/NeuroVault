import { useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useAccount } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ShieldCheck, Wallet, Database, Zap } from "lucide-react";
import { api, setWorkspaceId } from "@/lib/api";

export default function AuthPage() {
  const [, navigate] = useLocation();
  const { address, isConnected } = useAccount();

  useEffect(() => {
    if (!isConnected || !address) return;
    let cancelled = false;
    api.walletConnect(address).then((res) => {
      if (cancelled || !res?.workspace?.id) return;
      setWorkspaceId(res.workspace.id);
      navigate("/dashboard");
    });
    return () => { cancelled = true; };
  }, [address, isConnected, navigate]);

  return (
    <div className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-[#0b0f1a] px-4 py-12 text-white [font-family:'Inter',Helvetica]">
      <div className="absolute left-1/2 top-1/2 -z-0 h-[700px] w-[700px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#7c3aed1a] blur-[80px]" />

      <Card className="relative z-10 w-full max-w-lg overflow-hidden rounded-2xl border border-[#ffffff14] bg-[#ffffff08] shadow-[0px_25px_50px_-12px_#00000040] backdrop-blur-xl">
        <CardContent className="p-8">
          <Link
            href="/"
            data-testid="link-auth-logo"
            className="mb-6 flex items-center gap-2 text-lg tracking-[-0.5px] text-white"
          >
            <span className="inline-block h-2 w-2 rounded-full bg-[linear-gradient(90deg,rgba(34,211,238,1)_0%,rgba(139,92,246,1)_100%)]" />
            NeuroVault
          </Link>

          <Badge className="mb-4 border border-[#ffffff1a] bg-[#ffffff0d] px-3 py-1 text-[10px] tracking-[1px] text-violet-400 hover:bg-[#ffffff0d]">
            WALLET-ONLY ENTERPRISE AUTH
          </Badge>

          <h1 className="text-2xl text-white">Connect your wallet</h1>
          <p className="mt-2 text-sm text-slate-400">
            Your wallet address becomes your enterprise identity. No passwords,
            no email — workspace and agent ownership are tied to your address on
            the 0G chain.
          </p>

          <div className="mt-6 flex justify-center">
            <ConnectButton
              accountStatus="full"
              chainStatus="full"
              showBalance={true}
              data-testid="button-connect-wallet"
            />
          </div>

          {isConnected && address && (
            <div
              data-testid="text-connected-address"
              className="mt-6 rounded-lg border border-violet-400/40 bg-[#8b5cf61a] p-4 text-sm"
            >
              <p className="text-slate-300">Connected:</p>
              <code className="mt-1 block break-all font-mono text-xs text-violet-200">
                {address}
              </code>
              <p className="mt-3 text-xs text-cyan-300">
                Initializing workspace…
              </p>
            </div>
          )}

          <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {[
              { icon: Wallet, title: "Wallet identity", desc: "Address = workspace owner" },
              { icon: Database, title: "0G Storage", desc: "Decentralized memory" },
              { icon: ShieldCheck, title: "TEE privacy", desc: "AES-256 + redaction" },
              { icon: Zap, title: "On-chain agents", desc: "ID + ownership tracked" },
            ].map((f) => {
              const Icon = f.icon;
              return (
                <div
                  key={f.title}
                  className="rounded-lg border border-[#ffffff14] bg-[#ffffff05] p-3"
                >
                  <Icon className="h-4 w-4 text-violet-400" />
                  <p className="mt-2 text-xs text-white">{f.title}</p>
                  <p className="text-[10px] text-slate-500">{f.desc}</p>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
