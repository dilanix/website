import type { Metadata } from "next";
import { CreditCard } from "lucide-react";
import { getBilling } from "@/lib/data/dashboard-mocks";
import { requireDashboardOrganization } from "@/lib/dashboard/session";
import {
  Metric,
  PageHeader,
  Section,
  StatusBadge,
} from "@/components/dashboard/primitives";
export const metadata: Metadata = {
  title: "Billing",
  robots: { index: false, follow: false },
};
export default async function BillingPage() {
  await requireDashboardOrganization();
  const billing = await getBilling();
  return (
    <div className="flex flex-col gap-9">
      <PageHeader
        title="Billing"
        description="Manage your Dilanix plan, usage, and billing history."
      />
      <Section title="Current plan">
        <div className="border-foreground/10 grid gap-6 rounded-xl border p-5 sm:grid-cols-[1fr_auto]">
          <div>
            <p className="text-xl font-semibold">{billing.plan.name}</p>
            <p className="text-muted-foreground mt-1 font-mono text-sm">
              {billing.plan.price}
            </p>
          </div>
          <div className="sm:text-right">
            <StatusBadge status="success">{billing.plan.status}</StatusBadge>
            <p className="text-muted-foreground mt-2 text-xs">
              Next billing date · {billing.plan.nextDate}
            </p>
          </div>
        </div>
      </Section>
      <Section title="Usage this month">
        <dl className="grid grid-cols-1 gap-y-5 sm:grid-cols-3">
          {billing.usage.map((item) => (
            <Metric key={item.label} label={item.label} value={item.value} />
          ))}
        </dl>
      </Section>
      <Section title="Payment method">
        <div className="border-foreground/10 flex items-center gap-4 rounded-xl border p-5">
          <span className="bg-foreground/5 flex h-10 w-10 items-center justify-center rounded-lg">
            <CreditCard size={18} />
          </span>
          <div>
            <p className="text-sm font-medium">{billing.payment.name}</p>
            <p className="text-muted-foreground mt-1 text-xs">
              {billing.payment.expiry}
            </p>
          </div>
        </div>
      </Section>
      <Section title="Invoices">
        <div className="border-foreground/10 overflow-x-auto rounded-xl border">
          <table className="w-full min-w-[500px] text-sm">
            <thead>
              <tr className="border-foreground/10 border-b">
                {["Invoice", "Date", "Amount", "Status"].map((h) => (
                  <th
                    key={h}
                    scope="col"
                    className="text-muted-foreground px-4 py-3 text-left font-medium"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {billing.invoices.map((invoice) => (
                <tr
                  key={invoice.id}
                  className="border-foreground/7 border-b last:border-0"
                >
                  <td className="px-4 py-3 font-mono text-xs">{invoice.id}</td>
                  <td className="text-muted-foreground px-4 py-3">
                    {invoice.date}
                  </td>
                  <td className="px-4 py-3 font-mono">{invoice.amount}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status="success">{invoice.status}</StatusBadge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>
    </div>
  );
}
