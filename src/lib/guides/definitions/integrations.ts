import type { GuideDefinition } from "../types";

export const INTEGRATIONS_GUIDE_KEY = "guide.integrations";

export const integrationsGuide: GuideDefinition = {
  key: INTEGRATIONS_GUIDE_KEY,
  version: 1,
  title: "How Integrations work",
  description: "Connect AWS, then choose what Dilanix reads and where.",
  section: "manage",
  tours: ["manage.integrations", "manage.connection"],
  scenes: [
    {
      id: "intro",
      title: "Connect your cloud once",
      caption:
        "An integration is a provider Dilanix reads from. AWS can be connected today; Google Cloud, Azure and others show Coming soon. Connect once, and every Dilanix product works from the same data.",
      durationMs: 9000,
    },
    {
      id: "connection-model",
      title: "Provider, connection, accounts",
      caption:
        "A connection is one link between your organization and a provider. The AWS accounts it reads are its targets — one connection can hold many. You can also keep several connections, e.g. one per business unit.",
      durationMs: 11000,
    },
    {
      id: "add-connection",
      title: "1. Add a connection",
      caption:
        "In Integrations, click Add connection on Amazon Web Services, name it and click Connect. If the button says Not enabled, your organization doesn't have this provider yet — contact Dilanix.",
      durationMs: 10000,
    },
    {
      id: "read-only-role",
      title: "A read-only role, never keys",
      caption:
        "Dilanix never asks for access keys. A CloudFormation stack creates one IAM role in your account that only Dilanix's own AWS role can assume — and only with this connection's External ID. It can read; it can never change anything.",
      durationMs: 12000,
    },
    {
      id: "cloudformation",
      title: "2. Create the stack",
      caption:
        "Signed in to the AWS account you want to connect, click Launch in AWS CloudFormation. Paste the External ID from Dilanix, keep or switch off each read permission, tick the IAM acknowledgement and create the stack.",
      durationMs: 13000,
    },
    {
      id: "verify",
      title: "3. Verify the account",
      caption:
        "When the stack shows CREATE_COMPLETE, enter the 12-digit account ID. Dilanix assumes the role, checks with AWS that it really is that account, and adds it as a verified target. The connection is now Connected.",
      durationMs: 11000,
    },
    {
      id: "more-accounts",
      title: "More accounts",
      caption:
        "For another account, create the same stack there with the same External ID, then click Add target and verify its ID. Rename a target (Prod, Dev), replace its identity or disable it without touching the others. The bill lives in your management account — connect it to see every member account's cost.",
      durationMs: 13000,
    },
    {
      id: "access",
      title: "Access: what Dilanix reads",
      caption:
        "Your organization's plan grants capabilities; on the connection's Access tab you switch them on. Inventory Read brings resources and the infrastructure graph, Billing Read brings cost, Metrics Read brings CloudWatch utilization.",
      durationMs: 12000,
    },
    {
      id: "scopes",
      title: "Scopes: where Dilanix looks",
      caption:
        "Add each AWS region you use as a region scope — inventory and metrics are read only there; without any, a single default region is read. Remove a region and its resources turn Out of scope, kept as history.",
      durationMs: 12000,
    },
    {
      id: "status",
      title: "Connection status",
      caption:
        "Draft until an account is verified, then Connected. Error means verification failed — e.g. the role was deleted — and Re-verify fixes it. Disabled pauses syncing and keeps the data; enabling again asks for a fresh verification.",
      durationMs: 12000,
    },
    {
      id: "next-sync",
      title: "Then: the first sync",
      caption:
        "Nothing is read until a sync runs. On the connection's Sync & Activity tab, click Sync now and turn on automatic sync — How Sync works shows the rest.",
      durationMs: 9000,
    },
  ],
};
