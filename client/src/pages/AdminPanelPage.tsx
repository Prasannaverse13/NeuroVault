import { useState } from "react";
import { DashboardLayout, DashboardCard, StatBlock } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MoreHorizontal, UserPlus } from "lucide-react";

const members = [
  { name: "Aria Kepler", email: "aria@neurovault.ai", role: "Owner", status: "Active", lastActive: "Now" },
  { name: "Elias Vance", email: "elias@neurovault.ai", role: "Admin", status: "Active", lastActive: "12 min ago" },
  { name: "Mira Solis", email: "mira@neurovault.ai", role: "Engineer", status: "Active", lastActive: "1h ago" },
  { name: "Theo Park", email: "theo@neurovault.ai", role: "Engineer", status: "Active", lastActive: "3h ago" },
  { name: "Nora Ito", email: "nora@neurovault.ai", role: "Analyst", status: "Invited", lastActive: "—" },
  { name: "Ravi Shah", email: "ravi@partner.io", role: "Viewer", status: "Active", lastActive: "2d ago" },
];

const roles = ["Owner", "Admin", "Engineer", "Analyst", "Viewer"];

const systemHealth = [
  { name: "API gateway", status: "Operational", uptime: "99.99%" },
  { name: "Memory clusters", status: "Operational", uptime: "99.97%" },
  { name: "Inference layer", status: "Degraded", uptime: "99.21%" },
  { name: "Marketplace", status: "Operational", uptime: "100%" },
];

export default function AdminPanelPage() {
  const [filter, setFilter] = useState("All");
  const visible = filter === "All" ? members : members.filter((m) => m.role === filter);

  return (
    <DashboardLayout
      title="Admin panel"
      subtitle="Manage workspace members, roles, and system-wide health."
      actions={
        <Button
          data-testid="button-invite-member"
          className="h-auto rounded-xl bg-[linear-gradient(90deg,rgba(34,211,238,1)_0%,rgba(139,92,246,1)_100%)] px-4 py-2 text-sm text-white hover:opacity-95"
        >
          <UserPlus className="mr-2 h-4 w-4" /> Invite member
        </Button>
      }
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatBlock label="MEMBERS" value="6" delta="↑ 1 invited" testId="stat-members" />
        <StatBlock label="WORKSPACES" value="3" delta="Pro plan limit: 5" testId="stat-workspaces" />
        <StatBlock label="MONTHLY ACTIVE" value="14" delta="↑ 2 this week" testId="stat-mau" />
        <StatBlock label="OPEN INCIDENTS" value="1" delta="Inference latency" testId="stat-incidents" />
      </div>

      <DashboardCard className="mt-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-base text-white">Members</h2>
          <div className="flex flex-wrap gap-2">
            {["All", ...roles].map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setFilter(r)}
                data-testid={`filter-role-${r.toLowerCase()}`}
                className={`rounded-full px-3 py-1 text-xs transition-colors ${
                  filter === r
                    ? "bg-[linear-gradient(90deg,rgba(34,211,238,1)_0%,rgba(139,92,246,1)_100%)] text-white"
                    : "border border-[#ffffff14] bg-[#ffffff08] text-slate-400 hover:text-white"
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-4 overflow-hidden rounded-lg border border-[#ffffff0d]">
          <table className="w-full text-left text-sm">
            <thead className="bg-[#ffffff05] text-[10px] tracking-[1px] text-slate-500">
              <tr>
                <th className="px-4 py-3">MEMBER</th>
                <th className="px-4 py-3">ROLE</th>
                <th className="px-4 py-3">STATUS</th>
                <th className="px-4 py-3">LAST ACTIVE</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {visible.map((m) => (
                <tr
                  key={m.email}
                  data-testid={`member-row-${m.email}`}
                  className="border-t border-[#ffffff0d] text-slate-300"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[linear-gradient(90deg,rgba(34,211,238,1)_0%,rgba(139,92,246,1)_100%)] text-xs">
                        {m.name.split(" ").map((n) => n[0]).join("")}
                      </div>
                      <div>
                        <p className="text-white">{m.name}</p>
                        <p className="text-xs text-slate-500">{m.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <Badge className="border border-[#ffffff14] bg-[#ffffff08] text-[10px] tracking-[1px] text-violet-300 hover:bg-[#ffffff08]">
                      {m.role.toUpperCase()}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`text-xs ${
                        m.status === "Active" ? "text-cyan-400" : "text-amber-300"
                      }`}
                    >
                      {m.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-500">{m.lastActive}</td>
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      data-testid={`button-member-actions-${m.email}`}
                      className="text-slate-500 hover:text-white"
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </DashboardCard>

      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <DashboardCard>
          <h2 className="text-base text-white">System health</h2>
          <div className="mt-4 space-y-3">
            {systemHealth.map((s) => (
              <div
                key={s.name}
                data-testid={`health-${s.name.toLowerCase().replace(/\s+/g, "-")}`}
                className="flex items-center justify-between rounded-lg border border-[#ffffff0d] bg-[#ffffff05] p-3 text-sm"
              >
                <span className="text-white">{s.name}</span>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-slate-500">{s.uptime}</span>
                  <Badge
                    className={`border-0 text-[10px] tracking-[1px] hover:bg-transparent ${
                      s.status === "Operational"
                        ? "bg-cyan-400/10 text-cyan-300"
                        : "bg-amber-400/10 text-amber-300"
                    }`}
                  >
                    {s.status.toUpperCase()}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </DashboardCard>

        <DashboardCard>
          <h2 className="text-base text-white">Workspace settings</h2>
          <div className="mt-4 space-y-3 text-sm">
            <div className="flex items-center justify-between rounded-lg border border-[#ffffff0d] bg-[#ffffff05] p-3">
              <div>
                <p className="text-white">Workspace name</p>
                <p className="text-xs text-slate-500">NeuroVault Labs</p>
              </div>
              <button
                type="button"
                data-testid="button-edit-workspace"
                className="text-xs text-violet-400 hover:text-violet-300"
              >
                Edit
              </button>
            </div>
            <div className="flex items-center justify-between rounded-lg border border-[#ffffff0d] bg-[#ffffff05] p-3">
              <div>
                <p className="text-white">Default agent runtime</p>
                <p className="text-xs text-slate-500">GPT-4 Turbo</p>
              </div>
              <button
                type="button"
                data-testid="button-edit-runtime"
                className="text-xs text-violet-400 hover:text-violet-300"
              >
                Change
              </button>
            </div>
            <div className="flex items-center justify-between rounded-lg border border-rose-400/40 bg-rose-400/5 p-3">
              <div>
                <p className="text-rose-200">Delete workspace</p>
                <p className="text-xs text-rose-300/70">
                  This action is permanent and irreversible.
                </p>
              </div>
              <button
                type="button"
                data-testid="button-delete-workspace"
                className="text-xs text-rose-300 hover:text-rose-200"
              >
                Delete
              </button>
            </div>
          </div>
        </DashboardCard>
      </div>
    </DashboardLayout>
  );
}
