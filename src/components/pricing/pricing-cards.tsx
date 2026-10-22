"use client";

import { useState } from "react";
import { ArrowRight, Check, Sparkles } from "lucide-react";
import type { CorePublicPlan } from "@/lib/core/api";
import {
  displayPrice,
  hasYearlyPricing,
  limitSentence,
  type BillingInterval,
} from "@/lib/plans/format";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const CTA_LABEL: Record<CorePublicPlan["cta_kind"], string> = {
  contact_sales: "Contact sales",
  request_access: "Request access",
};

function contactHref(plan: CorePublicPlan) {
  return `/contact?plan=${encodeURIComponent(plan.code)}`;
}

function IntervalToggle({
  value,
  onChange,
}: {
  value: BillingInterval;
  onChange: (value: BillingInterval) => void;
}) {
  const options: { value: BillingInterval; label: string }[] = [
    { value: "month", label: "Monthly" },
    { value: "year", label: "Yearly" },
  ];
  return (
    <div
      role="radiogroup"
      aria-label="Billing interval"
      className="border-border-soft bg-card-strong/70 inline-flex rounded-full border p-1 shadow-[0_10px_28px_var(--shadow-card)] backdrop-blur-xl"
    >
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          role="radio"
          aria-checked={value === option.value}
          onClick={() => onChange(option.value)}
          className={cn(
            "rounded-full px-4 py-1.5 text-xs font-semibold transition-all",
            value === option.value
              ? "text-accent-foreground bg-[linear-gradient(135deg,var(--accent),var(--accent-secondary))] shadow-[0_8px_20px_var(--shadow-brand)]"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

export function PlanCard({
  plan,
  interval,
  current = false,
  ctaHref,
}: {
  plan: CorePublicPlan;
  interval: BillingInterval;
  /** Marks the organization's own plan (dashboard). */
  current?: boolean;
  ctaHref?: string;
}) {
  const price = displayPrice(plan, interval);
  const products = plan.features.filter((feature) => feature.is_product);
  const features = plan.features.filter((feature) => !feature.is_product);
  const highlighted = plan.is_highlighted && !current;

  return (
    <article
      aria-label={`${plan.name} plan`}
      className={cn(
        "relative flex h-full flex-col rounded-[1.6rem] border p-6 backdrop-blur-xl transition-all duration-300 sm:p-7",
        highlighted
          ? "border-accent/45 bg-card-strong/90 shadow-[0_28px_80px_var(--shadow-brand)] lg:-translate-y-2"
          : "border-border-soft bg-card-strong/64 shadow-[0_18px_48px_var(--shadow-card)] hover:-translate-y-1",
        current && "border-success/45",
      )}
    >
      {highlighted ? (
        <>
          <div
            aria-hidden="true"
            className="from-accent/14 to-accent-secondary/6 pointer-events-none absolute inset-0 -z-10 rounded-[1.6rem] bg-gradient-to-b via-transparent"
          />
          <span className="text-accent-foreground absolute -top-3 left-1/2 inline-flex -translate-x-1/2 items-center gap-1.5 rounded-full bg-[linear-gradient(135deg,var(--accent),var(--accent-secondary))] px-3 py-1 text-[10px] font-semibold tracking-[0.12em] whitespace-nowrap uppercase shadow-[0_10px_26px_var(--shadow-brand)]">
            <Sparkles size={11} /> Most popular
          </span>
        </>
      ) : null}
      {current ? (
        <span className="border-success/30 bg-success/10 text-success absolute top-5 right-5 rounded-full border px-2.5 py-0.5 text-[10px] font-semibold tracking-wide uppercase">
          Your plan
        </span>
      ) : null}

      <h3 className="text-xl font-semibold tracking-[-0.03em]">{plan.name}</h3>
      {plan.tagline ? (
        <p className="text-muted-foreground mt-2 min-h-10 text-sm leading-5">
          {plan.tagline}
        </p>
      ) : null}

      <div className="mt-6 min-h-[5.25rem]">
        {price ? (
          <>
            <p className="flex items-baseline gap-1.5">
              <span className="font-mono text-4xl font-semibold tracking-[-0.05em]">
                {price.headline}
              </span>
              {price.suffix ? (
                <span className="text-muted-foreground text-sm">
                  {price.suffix}
                </span>
              ) : null}
            </p>
            {price.note ? (
              <p className="text-muted-foreground mt-1.5 text-xs">
                {price.note}
              </p>
            ) : null}
          </>
        ) : (
          <p className="text-muted-foreground text-sm">Pricing on request</p>
        )}
      </div>

      <a
        href={ctaHref ?? contactHref(plan)}
        className={cn(
          buttonVariants(highlighted ? "primary" : "secondary"),
          "group mt-2 w-full",
        )}
      >
        {CTA_LABEL[plan.cta_kind]}
        <ArrowRight
          size={14}
          className="transition-transform group-hover:translate-x-0.5"
        />
      </a>

      <div className="border-border-soft mt-7 space-y-5 border-t pt-6">
        {plan.limits.length ? (
          <ul className="space-y-2.5">
            {plan.limits.map((limit) => (
              <li
                key={limit.code}
                className="flex items-center gap-2.5 text-sm font-medium"
              >
                <span className="border-accent/20 bg-accent/10 text-accent flex size-5 shrink-0 items-center justify-center rounded-full border">
                  <Check size={11} strokeWidth={3} />
                </span>
                {limitSentence(limit)}
              </li>
            ))}
          </ul>
        ) : null}
        {products.length ? (
          <div>
            <p className="text-muted-foreground mb-2.5 text-[10px] font-semibold tracking-[0.14em] uppercase">
              Products
            </p>
            <ul className="space-y-2.5">
              {products.map((feature) => (
                <li
                  key={feature.code}
                  className="flex items-start gap-2.5 text-sm"
                >
                  <Check
                    size={15}
                    className="text-success mt-0.5 shrink-0"
                    strokeWidth={2.5}
                  />
                  {feature.name.replace(/^Product Access:\s*/, "")}
                </li>
              ))}
            </ul>
          </div>
        ) : null}
        {features.length || plan.marketing_features.length ? (
          <div>
            <p className="text-muted-foreground mb-2.5 text-[10px] font-semibold tracking-[0.14em] uppercase">
              Includes
            </p>
            <ul className="space-y-2.5">
              {features.map((feature) => (
                <li
                  key={feature.code}
                  className="flex items-start gap-2.5 text-sm"
                >
                  <Check
                    size={15}
                    className="text-success mt-0.5 shrink-0"
                    strokeWidth={2.5}
                  />
                  {feature.name.replace(/\s*Platform Access$/, "")}
                </li>
              ))}
              {plan.marketing_features.map((item) => (
                <li key={item} className="flex items-start gap-2.5 text-sm">
                  <Check
                    size={15}
                    className="text-success mt-0.5 shrink-0"
                    strokeWidth={2.5}
                  />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
    </article>
  );
}

/** Pricing cards from Core's public plan catalog, with a monthly/yearly
 * switch when any plan has a yearly price. Display only — the call to action
 * is a conversation, never a checkout. */
export function PricingCards({
  plans,
  currentPlanCode,
  ctaHref,
}: {
  plans: CorePublicPlan[];
  currentPlanCode?: string | null;
  ctaHref?: string;
}) {
  const yearly = hasYearlyPricing(plans);
  const [interval, setInterval] = useState<BillingInterval>("month");

  return (
    <div className="flex flex-col items-center gap-10">
      {yearly ? (
        <IntervalToggle value={interval} onChange={setInterval} />
      ) : null}
      <div
        className={cn(
          "grid w-full gap-5",
          plans.length === 1 && "mx-auto max-w-md",
          plans.length === 2 && "mx-auto max-w-4xl md:grid-cols-2",
          plans.length >= 3 && "md:grid-cols-2 lg:grid-cols-3",
          plans.length >= 4 && "xl:grid-cols-4",
        )}
      >
        {plans.map((plan) => (
          <PlanCard
            key={plan.code}
            plan={plan}
            interval={interval}
            current={plan.code === currentPlanCode}
            ctaHref={ctaHref}
          />
        ))}
      </div>
    </div>
  );
}
