/**
 * Formats a cost-product amount as `"20.00 USD"` — always 2 decimals, no
 * localized currency symbol (this product's own convention, distinct from
 * `formatCostAmount` in `lib/billing/cost-summaries.ts`, which is for the
 * separate `/dashboard/costs` billing surface).
 *
 * A value that rounds to zero at 2 decimals but is genuinely negative (e.g.
 * usage nearly fully offset by a credit) is normalized to `0` first —
 * otherwise `toLocaleString` renders a literal negative zero ("-0" or
 * "-0.00"), which reads as a broken number rather than "effectively
 * nothing".
 */
export function formatAmount(amount: number, currency: string): string {
  const normalized = Math.round(amount * 100) === 0 ? 0 : amount;
  return `${normalized.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} ${currency}`;
}
