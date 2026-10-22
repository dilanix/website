import {
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import type { CorePublicPlan } from "@/lib/core/api";
import { PricingCards } from "./pricing-cards";

afterEach(cleanup);

const plans: CorePublicPlan[] = [
  {
    code: "starter",
    name: "Starter",
    tagline: "For small teams.",
    description: null,
    is_highlighted: false,
    sort_order: 0,
    cta_kind: "request_access",
    prices: [
      { interval: "month", amount: "49.00", currency: "USD", label: null },
      { interval: "year", amount: "490.00", currency: "USD", label: null },
    ],
    features: [
      {
        code: "product.cost",
        name: "Product Access: Cost",
        description: null,
        is_product: true,
      },
    ],
    limits: [
      {
        code: "cloud.accounts",
        name: "Connected cloud accounts",
        unit: "accounts",
        value: 1,
      },
      {
        code: "organization.members",
        name: "Organization members",
        unit: "members",
        value: null,
      },
    ],
    marketing_features: ["Email support"],
  },
  {
    code: "growth",
    name: "Growth",
    tagline: null,
    description: null,
    is_highlighted: true,
    sort_order: 1,
    cta_kind: "contact_sales",
    prices: [
      { interval: "month", amount: "199.00", currency: "USD", label: null },
    ],
    features: [
      {
        code: "platform.api_keys",
        name: "API Keys Platform Access",
        description: null,
        is_product: false,
      },
    ],
    limits: [
      {
        code: "cloud.accounts",
        name: "Connected cloud accounts",
        unit: "accounts",
        value: 5,
      },
    ],
    marketing_features: [],
  },
  {
    code: "enterprise",
    name: "Enterprise",
    tagline: null,
    description: null,
    is_highlighted: false,
    sort_order: 2,
    cta_kind: "contact_sales",
    prices: [
      { interval: "custom", amount: null, currency: "USD", label: null },
    ],
    features: [],
    limits: [],
    marketing_features: [],
  },
];

describe("PricingCards", () => {
  it("renders Core's plans with prices, limits, features and a contact CTA", () => {
    render(<PricingCards plans={plans} />);

    const starter = screen.getByRole("article", { name: "Starter plan" });
    expect(within(starter).getByText("$49")).toBeTruthy();
    expect(within(starter).getByText("1 account")).toBeTruthy();
    expect(within(starter).getByText("Unlimited members")).toBeTruthy();
    expect(within(starter).getByText("Cost")).toBeTruthy();
    expect(within(starter).getByText("Email support")).toBeTruthy();
    expect(
      within(starter)
        .getByRole("link", { name: /Request access/ })
        .getAttribute("href"),
    ).toBe("/contact?plan=starter");

    const growth = screen.getByRole("article", { name: "Growth plan" });
    expect(within(growth).getByText("Most popular")).toBeTruthy();
    expect(within(growth).getByText("API Keys")).toBeTruthy();
    expect(within(growth).getByText("Up to 5 accounts")).toBeTruthy();

    const enterprise = screen.getByRole("article", { name: "Enterprise plan" });
    expect(within(enterprise).getByText("Custom")).toBeTruthy();
    expect(screen.queryByText(/checkout/i)).toBeNull();
  });

  it("switches to yearly prices shown per month", () => {
    render(<PricingCards plans={plans} />);

    fireEvent.click(screen.getByRole("radio", { name: "Yearly" }));

    const starter = screen.getByRole("article", { name: "Starter plan" });
    expect(within(starter).getByText("$40.83")).toBeTruthy();
    expect(
      within(starter).getByText(/\$490 billed yearly · save 17%/),
    ).toBeTruthy();
    // A plan with no yearly price keeps its monthly one.
    expect(
      within(screen.getByRole("article", { name: "Growth plan" })).getByText(
        "$199",
      ),
    ).toBeTruthy();
  });

  it("marks the organization's current plan", () => {
    render(<PricingCards plans={plans} currentPlanCode="growth" />);

    const growth = screen.getByRole("article", { name: "Growth plan" });
    expect(within(growth).getByText("Your plan")).toBeTruthy();
    expect(within(growth).queryByText("Most popular")).toBeNull();
  });
});
