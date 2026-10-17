/**
 * Sample data for the marketing site's product previews. Every name and ID is
 * invented; the shapes mirror what the real dashboard shows.
 */

export interface DemoRecommendation {
  rank: number;
  title: string;
  resource: string;
  resourceType: string;
  savingUsd: number;
  status: "ready" | "input" | "rechecking";
  command: string;
  verifiedAgainst: string;
}

export const demoRecommendations: DemoRecommendation[] = [
  {
    rank: 1,
    title: "Rightsize the over-provisioned RDS instance",
    resource: "orders-db",
    resourceType: "RDS · db.r6g.2xlarge",
    savingUsd: 1840,
    status: "ready",
    command:
      "aws rds modify-db-instance --db-instance-identifier orders-db --db-instance-class db.r6g.xlarge --region eu-west-1",
    verifiedAgainst: "rds ModifyDBInstance",
  },
  {
    rank: 2,
    title: "Delete the idle NAT gateway",
    resource: "dev-natgw-1",
    resourceType: "EC2 · NAT gateway",
    savingUsd: 412,
    status: "ready",
    command:
      "aws ec2 delete-nat-gateway --nat-gateway-id nat-0a1b2c3d4e5f6a7b8 --region eu-west-1",
    verifiedAgainst: "ec2 DeleteNatGateway",
  },
  {
    rank: 3,
    title: "Move gp2 volumes to gp3",
    resource: "api-data-vol",
    resourceType: "EBS · 2 TiB gp2",
    savingUsd: 196,
    status: "ready",
    command:
      "aws ec2 modify-volume --volume-id vol-0c2d4e6f8a1b3c5d7 --volume-type gp3 --region eu-west-1",
    verifiedAgainst: "ec2 ModifyVolume",
  },
  {
    rank: 4,
    title: "Stop the staging environment outside working hours",
    resource: "staging",
    resourceType: "Environment · 14 resources",
    savingUsd: 1120,
    status: "input",
    command: "",
    verifiedAgainst: "",
  },
];

export const demoSpendTrend = [
  2720, 2690, 2745, 2810, 2655, 2580, 2610, 2702, 2688, 2650, 2590, 2574, 2602,
  2566,
];

export const demoCostByService = [
  { label: "Amazon EC2", amountUsd: 18420 },
  { label: "Amazon RDS", amountUsd: 11260 },
  { label: "Amazon S3", amountUsd: 6380 },
  { label: "NAT Gateway", amountUsd: 4150 },
  { label: "Amazon ElastiCache", amountUsd: 3210 },
];

export const demoDatasets = [
  {
    name: "Inventory Resources",
    source: "AWS APIs",
    lastSync: "4 min ago",
    status: "healthy" as const,
  },
  {
    name: "Cost Usage",
    source: "AWS FOCUS 1.2 export",
    lastSync: "2 h ago",
    status: "healthy" as const,
  },
  {
    name: "Cost Summary",
    source: "AWS Cost Explorer",
    lastSync: "2 h ago",
    status: "healthy" as const,
  },
  {
    name: "Utilization Metrics",
    source: "Amazon CloudWatch",
    lastSync: "now",
    status: "syncing" as const,
  },
  {
    name: "Runtime Interactions",
    source: "Flow logs, ALB logs, X-Ray",
    lastSync: "18 min ago",
    status: "healthy" as const,
  },
];

export function formatUsd(value: number) {
  return `$${value.toLocaleString("en-US")}`;
}
