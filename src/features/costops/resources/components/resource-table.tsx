import Link from "next/link";
import { ArrowDown, ArrowUp, ArrowUpDown, ChevronRight } from "lucide-react";
import { formatDateTime } from "../../utils";
import type { CostOpsIntegration } from "../../types";
import { ResourceStateBadge, ResourceTypeBadge } from "./resource-badges";
import { formatRegion, resourceDisplayName } from "../presentation";
import type { CloudResource, ResourceSort } from "../types";

export function ResourceTable({
  resources,
  integrations,
  sort,
  onSort,
}: {
  resources: CloudResource[];
  integrations: CostOpsIntegration[];
  sort: ResourceSort;
  onSort(
    field: "name" | "resource_class" | "region" | "state" | "last_seen_at",
  ): void;
}) {
  const integrationNames = new Map(
    integrations.map((item) => [item.id, item.name]),
  );
  return (
    <div className="border-foreground/10 overflow-x-auto rounded-xl border">
      <table className="w-full min-w-[1000px] text-left text-sm">
        <thead>
          <tr className="border-foreground/10 border-b">
            <Sortable
              label="Resource"
              field="name"
              sort={sort}
              onSort={onSort}
            />
            <th className="text-muted-foreground px-4 py-3 font-medium">
              Type
            </th>
            <th className="text-muted-foreground px-4 py-3 font-medium">
              Integration
            </th>
            <Sortable
              label="Region"
              field="region"
              sort={sort}
              onSort={onSort}
            />
            <Sortable label="State" field="state" sort={sort} onSort={onSort} />
            <Sortable
              label="Class"
              field="resource_class"
              sort={sort}
              onSort={onSort}
            />
            <Sortable
              label="Last seen"
              field="last_seen_at"
              sort={sort}
              onSort={onSort}
            />
            <th>
              <span className="sr-only">Open</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {resources.map((resource) => (
            <tr
              key={resource.id}
              className="border-foreground/7 hover:bg-foreground/[0.025] border-b transition-colors last:border-0"
            >
              <td className="px-4 py-3.5">
                <Link
                  href={`/dashboard/costops/resources/${resource.id}`}
                  className="group block rounded-sm"
                >
                  <span className="group-hover:text-accent block max-w-64 truncate font-medium">
                    {resourceDisplayName(resource)}
                  </span>
                  {resource.name ? (
                    <span className="text-muted-foreground mt-0.5 block max-w-64 truncate font-mono text-xs">
                      {resource.externalId}
                    </span>
                  ) : null}
                </Link>
              </td>
              <td className="px-4 py-3.5">
                <ResourceTypeBadge type={resource.resourceType} />
              </td>
              <td className="text-muted-foreground px-4 py-3.5 text-xs">
                {integrationNames.get(resource.integrationId) ?? "—"}
              </td>
              <td className="text-muted-foreground px-4 py-3.5 font-mono text-xs">
                {formatRegion(resource.region)}
              </td>
              <td className="px-4 py-3.5">
                <ResourceStateBadge state={resource.state} />
              </td>
              <td className="text-muted-foreground px-4 py-3.5 text-xs">
                {resource.resourceClass ?? "—"}
              </td>
              <td className="text-muted-foreground px-4 py-3.5 text-xs whitespace-nowrap">
                {formatDateTime(resource.lastSeenAt)}
              </td>
              <td className="pr-4">
                <Link
                  href={`/dashboard/costops/resources/${resource.id}`}
                  aria-label={`Open ${resourceDisplayName(resource)}`}
                  className="text-muted-foreground hover:text-foreground block rounded-sm p-1"
                >
                  <ChevronRight size={15} />
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
function Sortable({
  label,
  field,
  sort,
  onSort,
}: {
  label: string;
  field: "name" | "resource_class" | "region" | "state" | "last_seen_at";
  sort: ResourceSort;
  onSort(
    field: "name" | "resource_class" | "region" | "state" | "last_seen_at",
  ): void;
}) {
  const active = sort === field || sort === `-${field}`;
  const descending = sort === `-${field}`;
  const Icon = !active ? ArrowUpDown : descending ? ArrowDown : ArrowUp;
  return (
    <th className="px-4 py-3 font-medium">
      <button
        type="button"
        onClick={() => onSort(field)}
        className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5"
      >
        {label}
        <Icon size={13} />
      </button>
    </th>
  );
}
