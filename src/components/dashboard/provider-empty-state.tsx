import { EmptyState } from "./primitives";
export function ProviderEmptyState() {
  return (
    <EmptyState
      title="Connect your first provider"
      description="CostOps needs access to billing or usage data before it can analyze your infrastructure."
      actions={
        <>
          <button className="bg-accent text-accent-foreground rounded-lg px-4 py-2 text-sm font-medium">
            Connect AWS
          </button>
          <button className="border-foreground/15 rounded-lg border px-4 py-2 text-sm font-medium">
            Connect OpenAI
          </button>
        </>
      }
    />
  );
}
