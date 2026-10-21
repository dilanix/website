import {
  Container,
  Cpu,
  Database,
  HardDrive,
  Network,
  Server,
  Workflow,
  Zap,
} from "lucide-react";

/**
 * Provider-neutral resource icon with a safe fallback for resource families
 * introduced by Core after this frontend was shipped.
 */
export function ResourceCategoryIcon({
  category,
  size,
}: {
  category: string;
  size: number;
}) {
  if (category === "compute") return <Cpu size={size} />;
  if (category === "database") return <Database size={size} />;
  if (category === "container") return <Container size={size} />;
  if (category === "network") return <Network size={size} />;
  if (category === "storage") return <HardDrive size={size} />;
  if (category === "cache") return <Zap size={size} />;
  if (category === "orchestration") return <Workflow size={size} />;
  return <Server size={size} />;
}
