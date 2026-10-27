import type { GuideVideo } from "../types";

/** The Build on Dilanix page's explainer: one sample project, from the first
 *  conversation to a product running in the customer's organization. Its
 *  visuals are `BUILD_ON_DILANIX_VISUALS`; every name and number is sample
 *  data. */
export const buildOnDilanixVideo: GuideVideo = {
  key: "explainer.build-on-dilanix",
  title: "How a product gets built on Dilanix",
  scenes: [
    {
      id: "intro",
      title: "Your product, on a platform that already runs",
      caption:
        "Most of what a data product needs already runs in Dilanix. We connect your systems to it and build only the part that is specific to your business. Here is one sample project, start to finish.",
      durationMs: 10000,
    },
    {
      id: "discovery",
      title: "Discovery: what the product must decide",
      caption:
        "We start with your process. In this sample, a subscription business wants to know what each customer really costs and which customers to reprice. Together we list the systems that hold the data.",
      durationMs: 11000,
    },
    {
      id: "design",
      title: "Design: mapped onto the platform",
      caption:
        "Every need is mapped onto Dilanix. Accounts, roles, sync, allocation and the recommendation engine already exist. What's left — the connectors and screens specific to you — is the scope we agree with you.",
      durationMs: 12000,
    },
    {
      id: "connect",
      title: "Build: connect your systems",
      caption:
        "We build connectors for your systems on the same integration framework AWS uses. Each one is verified, then synced on a schedule with checkpoints and retries — isolated to your organization.",
      durationMs: 12000,
    },
    {
      id: "allocate",
      title: "Allocation: cost per customer",
      caption:
        "Allocation rules split shared cloud and support costs across customers. Nothing goes uncounted — whatever no rule claims shows up as Unallocated.",
      durationMs: 11000,
    },
    {
      id: "screens",
      title: "Your screens, inside Dilanix",
      caption:
        "Your product gets its own screens, next to Cost and Infrastructure. Here: revenue, cost and margin for every customer, from data that refreshes on its own.",
      durationMs: 11000,
    },
    {
      id: "recommend",
      title: "Recommendations from your rules",
      caption:
        "Your rules run on the recommendation engine: detect, review, then rank by impact, confidence and effort. AI explains each one, and its output is checked against your data.",
      durationMs: 12000,
    },
    {
      id: "launch",
      title: "Launch, then we run it",
      caption:
        "The product goes live in your Dilanix organization. Your team signs in with their roles, and we host it, operate it and keep improving it with you.",
      durationMs: 11000,
    },
  ],
};
