import { useState } from "react";
import { DashboardLayout, DashboardCard } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShieldCheck, Key, Lock, AlertTriangle, Check } from "lucide-react";

const sessions = [
  { device: "MacBook Pro · Chrome", location: "Berlin, DE", last: "Active now", current: true },
  { device: "iPhone 15 · Safari", location: "Berlin, DE", last: "2h ago", current: false },
  { device: "Linux · Firefox", location: "Amsterdam, NL", last: "3d ago", current: false },
];

const apiKeys = [
  { label: "Production", key: "nv_live_••••••••8a72", created: "Jan 14, 2026", lastUsed: "2 min ago" },
  { label: "Staging", key: "nv_test_••••••••e441", created: "Mar 02, 2026", lastUsed: "1h ago" },
  { label: "CI / Deploy", key: "nv_live_••••••••0c19", created: "Apr 28, 2026", lastUsed: "Just now" },
];

const auditLog = [
  { event: "Logged in from Chrome (Berlin, DE)", time: "Today, 09:14 UTC" },
  { event: "Created API key 'CI / Deploy'", time: "Apr 28, 14:02 UTC" },
  { event: "Connected integration: Stripe", time: "Apr 21, 11:18 UTC" },
  { event: "Updated workspace privacy policy", time: "Apr 14, 17:45 UTC" },
];

export default function PrivacySecurityPage() {
  const [twoFactor, setTwoFactor] = useState(true);
  const [piiRedaction, setPiiRedaction] = useState(true);
  const [memorySharing, setMemorySharing] = useState(false);

  return (
    <DashboardLayout
      title="Privacy & Security"
      subtitle="Workspace-wide controls for data residency, access, and compliance."
      actions={
        <Badge className="border-0 bg-cyan-400/10 text-[10px] tracking-[1px] text-cyan-300 hover:bg-cyan-400/10">
          <Check className="mr-1 h-3 w-3" /> SOC 2 TYPE II
        </Badge>
      }
    >
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <DashboardCard className="lg:col-span-2">
          <h2 className="text-base text-white">Security controls</h2>
          <div className="mt-4 space-y-3">
            {[
              {
                icon: ShieldCheck,
                title: "Two-factor authentication",
                desc: "Require TOTP on every sign-in.",
                value: twoFactor,
                set: setTwoFactor,
                testId: "toggle-2fa",
              },
              {
                icon: Lock,
                title: "PII redaction",
                desc: "Automatically scrub names, emails, and IDs from memories.",
                value: piiRedaction,
                set: setPiiRedaction,
                testId: "toggle-pii",
              },
              {
                icon: AlertTriangle,
                title: "Memory sharing across workspaces",
                desc: "Allow agents you publish to share learned memories.",
                value: memorySharing,
                set: setMemorySharing,
                testId: "toggle-memory-sharing",
              },
            ].map((s) => {
              const Icon = s.icon;
              return (
                <div
                  key={s.title}
                  className="flex items-center justify-between gap-4 rounded-lg border border-[#ffffff0d] bg-[#ffffff05] p-4"
                >
                  <div className="flex min-w-0 items-start gap-3">
                    <Icon className="mt-0.5 h-4 w-4 shrink-0 text-violet-400" />
                    <div className="min-w-0">
                      <p className="text-sm text-white">{s.title}</p>
                      <p className="text-xs text-slate-400">{s.desc}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => s.set(!s.value)}
                    data-testid={s.testId}
                    className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
                      s.value ? "bg-violet-500" : "bg-[#ffffff14]"
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all ${
                        s.value ? "left-5" : "left-0.5"
                      }`}
                    />
                  </button>
                </div>
              );
            })}
          </div>
        </DashboardCard>

        <DashboardCard>
          <h2 className="text-base text-white">Data residency</h2>
          <div className="mt-4 space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-500">Primary region</span>
              <span className="text-white">EU (Frankfurt)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Replicas</span>
              <span className="text-white">US East, AP South</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Encryption</span>
              <span className="text-cyan-400">AES-256 + TEE</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Retention</span>
              <span className="text-white">90 days (override)</span>
            </div>
          </div>
        </DashboardCard>
      </div>

      <DashboardCard className="mt-8">
        <div className="flex items-center justify-between">
          <h2 className="text-base text-white">API keys</h2>
          <Button
            data-testid="button-create-api-key"
            className="h-auto rounded-lg bg-[linear-gradient(90deg,rgba(34,211,238,1)_0%,rgba(139,92,246,1)_100%)] px-4 py-2 text-xs text-white hover:opacity-95"
          >
            <Key className="mr-1 h-3 w-3" /> New key
          </Button>
        </div>
        <div className="mt-4 space-y-2">
          {apiKeys.map((k) => (
            <div
              key={k.key}
              data-testid={`api-key-${k.label.toLowerCase().replace(/[\s/]+/g, "-")}`}
              className="flex flex-col gap-2 rounded-lg border border-[#ffffff0d] bg-[#ffffff05] p-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex items-center gap-3">
                <Badge className="border border-[#ffffff14] bg-[#ffffff08] text-[10px] tracking-[1px] text-violet-300 hover:bg-[#ffffff08]">
                  {k.label.toUpperCase()}
                </Badge>
                <code className="font-mono text-xs text-slate-300">{k.key}</code>
              </div>
              <div className="flex items-center gap-4 text-xs text-slate-500">
                <span>Created {k.created}</span>
                <span>Used {k.lastUsed}</span>
                <button
                  type="button"
                  data-testid={`button-revoke-${k.label.toLowerCase().replace(/[\s/]+/g, "-")}`}
                  className="text-rose-400 hover:text-rose-300"
                >
                  Revoke
                </button>
              </div>
            </div>
          ))}
        </div>
      </DashboardCard>

      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <DashboardCard>
          <h2 className="text-base text-white">Active sessions</h2>
          <div className="mt-4 space-y-3">
            {sessions.map((s, i) => (
              <div
                key={i}
                data-testid={`session-${i}`}
                className="flex items-center justify-between rounded-lg border border-[#ffffff0d] bg-[#ffffff05] p-3"
              >
                <div>
                  <p className="text-sm text-white">{s.device}</p>
                  <p className="text-xs text-slate-500">
                    {s.location} • {s.last}
                  </p>
                </div>
                {s.current ? (
                  <Badge className="border-0 bg-cyan-400/10 text-[10px] tracking-[1px] text-cyan-300 hover:bg-cyan-400/10">
                    THIS DEVICE
                  </Badge>
                ) : (
                  <button
                    type="button"
                    data-testid={`button-end-session-${i}`}
                    className="text-xs text-rose-400 hover:text-rose-300"
                  >
                    End session
                  </button>
                )}
              </div>
            ))}
          </div>
        </DashboardCard>

        <DashboardCard>
          <h2 className="text-base text-white">Audit log</h2>
          <ul className="mt-4 space-y-3">
            {auditLog.map((a, i) => (
              <li key={i} className="flex items-start gap-3 text-sm">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-violet-400" />
                <div className="flex-1">
                  <p className="text-slate-200">{a.event}</p>
                  <p className="text-xs text-slate-500">{a.time}</p>
                </div>
              </li>
            ))}
          </ul>
        </DashboardCard>
      </div>
    </DashboardLayout>
  );
}
