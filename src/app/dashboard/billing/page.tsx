import type { Metadata } from "next";
import { getBillingPlan, getInvoices } from "@/lib/data/dashboard";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = {
  title: "Billing",
  robots: { index: false, follow: false },
};

const statusTone = {
  paid: "success",
  pending: "accent",
  failed: "neutral",
} as const;

export default async function BillingPage() {
  const [plan, invoices] = await Promise.all([getBillingPlan(), getInvoices()]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Billing</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Plan, payment method, and invoice history.
        </p>
      </div>

      <div className="border-foreground/10 rounded-xl border p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-muted-foreground text-xs">Current plan</p>
            <p className="text-foreground mt-1 text-xl font-semibold">
              {plan.name} — ${plan.priceUsd}/{plan.interval}
            </p>
            <p className="text-muted-foreground mt-1 text-sm">
              {plan.seats} seats · renews{" "}
              {new Date(plan.renewsOn).toLocaleDateString("en-US", {
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
            </p>
          </div>
          <Badge tone="neutral">Plan management isn&apos;t connected yet</Badge>
        </div>
      </div>

      <div className="border-foreground/10 rounded-xl border p-5">
        <p className="text-muted-foreground text-xs">Payment method</p>
        <p className="text-foreground mt-1 text-sm">Visa •••• 4242</p>
        <p className="text-muted-foreground mt-1 text-sm">
          Updating payment details isn&apos;t connected yet.
        </p>
      </div>

      <div>
        <h2 className="text-lg font-semibold tracking-tight">Invoices</h2>
        <div className="border-foreground/10 mt-4 overflow-x-auto rounded-xl border">
          <table className="w-full min-w-[420px] text-left text-sm">
            <thead>
              <tr className="border-foreground/10 border-b">
                <th className="text-muted-foreground px-4 py-3 font-medium">
                  Invoice
                </th>
                <th className="text-muted-foreground px-4 py-3 font-medium">
                  Date
                </th>
                <th className="text-muted-foreground px-4 py-3 text-right font-medium">
                  Amount
                </th>
                <th className="text-muted-foreground px-4 py-3 text-right font-medium">
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((invoice) => (
                <tr
                  key={invoice.id}
                  className="border-foreground/5 border-b last:border-0"
                >
                  <td className="text-foreground px-4 py-3 font-mono text-xs">
                    {invoice.id}
                  </td>
                  <td className="text-muted-foreground px-4 py-3">
                    {new Date(invoice.date).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </td>
                  <td className="text-foreground px-4 py-3 text-right font-mono">
                    ${invoice.amountUsd.toLocaleString("en-US")}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Badge tone={statusTone[invoice.status]}>
                      {invoice.status}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
