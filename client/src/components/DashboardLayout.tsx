import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import {
  Bot,
  LayoutDashboard,
  Brain,
  Plug,
  Sparkles,
  Store,
  Wallet,
  Shield,
  ShieldCheck,
  Plus,
  Bell,
  Search,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const navGroups = [
  {
    label: "WORKSPACE",
    items: [
      { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
      { label: "Create Agent", href: "/agents/new", icon: Plus },
      { label: "Marketplace", href: "/marketplace", icon: Store },
    ],
  },
  {
    label: "INTELLIGENCE",
    items: [
      { label: "Memory", href: "/memory", icon: Brain },
      { label: "AI Copilot", href: "/copilot", icon: Sparkles },
      { label: "Integrations", href: "/integrations", icon: Plug },
    ],
  },
  {
    label: "ACCOUNT",
    items: [
      { label: "Wallet & Billing", href: "/billing", icon: Wallet },
      { label: "Privacy & Security", href: "/privacy", icon: Shield },
      { label: "Admin Panel", href: "/admin", icon: ShieldCheck },
    ],
  },
];

interface DashboardLayoutProps {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  children: ReactNode;
}

export const DashboardLayout = ({
  title,
  subtitle,
  actions,
  children,
}: DashboardLayoutProps) => {
  const [location] = useLocation();

  return (
    <div className="flex min-h-screen w-full bg-[#0b0f1a] text-white [font-family:'Inter',Helvetica]">
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-[#ffffff0d] bg-[#0c0f1080] backdrop-blur-xl lg:flex">
        <div className="flex h-16 items-center border-b border-[#ffffff0d] px-6">
          <Link
            href="/"
            data-testid="link-sidebar-logo"
            className="flex items-center gap-2 text-lg tracking-[-0.5px] text-white"
          >
            <span className="inline-block h-2 w-2 rounded-full bg-[linear-gradient(90deg,rgba(34,211,238,1)_0%,rgba(139,92,246,1)_100%)]" />
            NeuroVault
          </Link>
        </div>
        <nav className="flex-1 overflow-y-auto px-3 py-6">
          {navGroups.map((group) => (
            <div key={group.label} className="mb-6">
              <p className="mb-2 px-3 text-[10px] tracking-[1px] text-slate-500">
                {group.label}
              </p>
              <ul className="space-y-1">
                {group.items.map((item) => {
                  const active = location === item.href;
                  const Icon = item.icon;
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        data-testid={`link-nav-${item.label.toLowerCase().replace(/\s+/g, "-").replace(/&/g, "and")}`}
                        className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
                          active
                            ? "bg-[#ffffff0d] text-white"
                            : "text-slate-400 hover:bg-[#ffffff08] hover:text-white"
                        }`}
                      >
                        <Icon className="h-4 w-4" />
                        {item.label}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>
        <div className="border-t border-[#ffffff0d] p-4">
          <div className="flex items-center gap-3 rounded-lg bg-[#ffffff08] p-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[linear-gradient(90deg,rgba(34,211,238,1)_0%,rgba(139,92,246,1)_100%)] text-xs">
              AK
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm text-white">Aria Kepler</p>
              <p className="truncate text-xs text-slate-500">Pro Workspace</p>
            </div>
          </div>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b border-[#ffffff0d] bg-[#0b0f1a99] px-4 backdrop-blur-xl sm:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <Link
              href="/"
              data-testid="link-mobile-logo"
              className="flex items-center gap-2 text-base text-white lg:hidden"
            >
              <span className="inline-block h-2 w-2 rounded-full bg-[linear-gradient(90deg,rgba(34,211,238,1)_0%,rgba(139,92,246,1)_100%)]" />
              NeuroVault
            </Link>
            <div className="relative hidden md:block">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                placeholder="Search agents, memories, docs…"
                data-testid="input-global-search"
                className="w-80 rounded-lg border border-[#ffffff14] bg-[#ffffff08] py-2 pl-9 pr-3 text-sm text-white placeholder:text-slate-500 focus:border-violet-400/50 focus:outline-none"
              />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              data-testid="button-notifications"
              className="relative h-9 w-9 text-slate-400 hover:bg-[#ffffff08] hover:text-white"
            >
              <Bell className="h-4 w-4" />
              <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-cyan-400" />
            </Button>
            <Badge
              data-testid="badge-network-status"
              className="border border-[#ffffff14] bg-[#ffffff08] text-[10px] tracking-[1px] text-white hover:bg-[#ffffff08]"
            >
              <span className="mr-2 inline-block h-1.5 w-1.5 rounded-full bg-cyan-400" />
              MAINNET
            </Badge>
          </div>
        </header>

        <main className="flex-1 px-4 py-8 sm:px-8">
          <div className="mx-auto w-full max-w-7xl">
            <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h1 data-testid="text-page-title" className="text-2xl text-white">
                  {title}
                </h1>
                {subtitle && (
                  <p className="mt-2 text-sm text-slate-400">{subtitle}</p>
                )}
              </div>
              {actions && (
                <div className="flex flex-wrap items-center gap-2">{actions}</div>
              )}
            </div>
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export const DashboardCard = ({
  className = "",
  children,
}: {
  className?: string;
  children: ReactNode;
}) => (
  <div
    className={`rounded-2xl border border-[#ffffff14] bg-[#ffffff08] p-6 backdrop-blur-xl ${className}`}
  >
    {children}
  </div>
);

export const StatBlock = ({
  label,
  value,
  delta,
  testId,
}: {
  label: string;
  value: string;
  delta?: string;
  testId: string;
}) => (
  <DashboardCard>
    <p className="text-[10px] tracking-[1px] text-slate-500">{label}</p>
    <p data-testid={testId} className="mt-3 text-2xl text-white">
      {value}
    </p>
    {delta && <p className="mt-1 text-xs text-cyan-400">{delta}</p>}
  </DashboardCard>
);
