import { DashboardLayout, DashboardCard, StatBlock } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CreditCard, Download } from "lucide-react";

const invoices = [
  { id: "INV-2026-0042", date: "May 1, 2026", amount: "$849.00", status: "Paid" },
  { id: "INV-2026-0041", date: "Apr 1, 2026", amount: "$762.00", status: "Paid" },
  { id: "INV-2026-0040", date: "Mar 1, 2026", amount: "$701.00", status: "Paid" },
  { id: "INV-2026-0039", date: "Feb 1, 2026", amount: "$680.00", status: "Paid" },
  { id: "INV-2026-0038", date: "Jan 1, 2026", amount: "$640.00", status: "Paid" },
];

const usage = [
  { item: "Compute (agent runs)", used: "324,210", cost: "$486.30" },
  { item: "Memory storage", used: "186.4 GB", cost: "$223.68" },
  { item: "Vector queries", used: "27.4M", cost: "$109.60" },
  { item: "Integrations", used: "7 active", cost: "$29.42" },
];

export default function WalletBillingPage() {
  return (
    <DashboardLayout
      title="Wallet & Billing"
      subtitle="Manage payment methods, monitor usage, and download invoices."
      actions={
        <Button
          data-testid="button-add-payment"
          className="h-auto rounded-xl bg-[linear-gradient(90deg,rgba(34,211,238,1)_0%,rgba(139,92,246,1)_100%)] px-4 py-2 text-sm text-white hover:opacity-95"
        >
          Add payment method
        </Button>
      }
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatBlock label="CURRENT BALANCE" value="$2,140.00" delta="Auto-recharge on" testId="stat-balance" />
        <StatBlock label="THIS MONTH" value="$849.00" delta="↑ 11.4%" testId="stat-month" />
        <StatBlock label="PROJECTED" value="$1,120.00" delta="By May 31" testId="stat-projected" />
        <StatBlock label="PLAN" value="Pro" delta="Upgrade to Enterprise →" testId="stat-plan" />
      </div>

      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <DashboardCard className="lg:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="text-base text-white">Usage breakdown</h2>
            <Badge className="border border-[#ffffff14] bg-[#ffffff08] text-[10px] tracking-[1px] text-cyan-300 hover:bg-[#ffffff08]">
              MAY 2026
            </Badge>
          </div>
          <div className="mt-4 overflow-hidden rounded-lg border border-[#ffffff0d]">
            <table className="w-full text-left text-sm">
              <thead className="bg-[#ffffff05] text-[10px] tracking-[1px] text-slate-500">
                <tr>
                  <th className="px-4 py-3">RESOURCE</th>
                  <th className="px-4 py-3">USED</th>
                  <th className="px-4 py-3 text-right">COST</th>
                </tr>
              </thead>
              <tbody>
                {usage.map((u) => (
                  <tr
                    key={u.item}
                    data-testid={`usage-row-${u.item.toLowerCase().replace(/[\s()]+/g, "-")}`}
                    className="border-t border-[#ffffff0d] text-slate-300"
                  >
                    <td className="px-4 py-3">{u.item}</td>
                    <td className="px-4 py-3 text-slate-400">{u.used}</td>
                    <td className="px-4 py-3 text-right text-white">{u.cost}</td>
                  </tr>
                ))}
                <tr className="border-t border-[#ffffff14] bg-[#ffffff05]">
                  <td className="px-4 py-3 text-white">Total</td>
                  <td className="px-4 py-3" />
                  <td className="px-4 py-3 text-right text-cyan-400">$849.00</td>
                </tr>
              </tbody>
            </table>
          </div>
        </DashboardCard>

        <DashboardCard>
          <h2 className="text-base text-white">Payment methods</h2>
          <div className="mt-4 space-y-3">
            <div
              data-testid="payment-method-primary"
              className="rounded-lg border border-violet-400/40 bg-[#8b5cf61a] p-4"
            >
              <div className="flex items-center gap-3">
                <CreditCard className="h-5 w-5 text-violet-300" />
                <div className="flex-1">
                  <p className="text-sm text-white">Visa •••• 4242</p>
                  <p className="text-xs text-slate-400">Expires 09/28 • Default</p>
                </div>
              </div>
            </div>
            <div
              data-testid="payment-method-backup"
              className="rounded-lg border border-[#ffffff14] bg-[#ffffff05] p-4"
            >
              <div className="flex items-center gap-3">
                <CreditCard className="h-5 w-5 text-slate-400" />
                <div className="flex-1">
                  <p className="text-sm text-white">Mastercard •••• 8810</p>
                  <p className="text-xs text-slate-500">Expires 04/27</p>
                </div>
              </div>
            </div>
          </div>
        </DashboardCard>
      </div>

      <DashboardCard className="mt-8">
        <h2 className="text-base text-white">Invoices</h2>
        <div className="mt-4 overflow-hidden rounded-lg border border-[#ffffff0d]">
          <table className="w-full text-left text-sm">
            <thead className="bg-[#ffffff05] text-[10px] tracking-[1px] text-slate-500">
              <tr>
                <th className="px-4 py-3">INVOICE</th>
                <th className="px-4 py-3">DATE</th>
                <th className="px-4 py-3">AMOUNT</th>
                <th className="px-4 py-3">STATUS</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {invoices.map((inv) => (
                <tr
                  key={inv.id}
                  data-testid={`invoice-row-${inv.id}`}
                  className="border-t border-[#ffffff0d] text-slate-300"
                >
                  <td className="px-4 py-3 font-mono text-xs">{inv.id}</td>
                  <td className="px-4 py-3 text-slate-400">{inv.date}</td>
                  <td className="px-4 py-3">{inv.amount}</td>
                  <td className="px-4 py-3">
                    <Badge className="border-0 bg-cyan-400/10 text-[10px] tracking-[1px] text-cyan-300 hover:bg-cyan-400/10">
                      {inv.status.toUpperCase()}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      data-testid={`button-download-${inv.id}`}
                      className="text-slate-500 hover:text-white"
                    >
                      <Download className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </DashboardCard>
    </DashboardLayout>
  );
}
