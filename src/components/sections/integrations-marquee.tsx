"use client";

export function IntegrationsMarquee() {
  const integrations = [
    { name: "Amazon Web Services", category: "Cloud & EKS", tag: "AWS" },
    { name: "Google Cloud Platform", category: "GCP & Vertex AI", tag: "GCP" },
    { name: "Microsoft Azure", category: "Azure & AKS", tag: "Azure" },
    { name: "OpenAI API", category: "GPT-4o & Embeddings", tag: "OpenAI" },
    { name: "Anthropic", category: "Claude 3.5 Sonnet", tag: "Anthropic" },
    { name: "Kubernetes", category: "Container Clusters", tag: "K8s" },
    { name: "Datadog", category: "Metrics Correlation", tag: "Datadog" },
    { name: "Snowflake & BigQuery", category: "Data Warehousing", tag: "Data" },
  ];

  return (
    <div className="border-foreground/10 bg-foreground/[0.015] border-y py-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <p className="text-muted-foreground mb-6 text-center font-mono text-xs font-medium tracking-widest uppercase">
          Seamless Zero-Agent Ingestion Across Modern Stacks
        </p>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-8">
          {integrations.map((item, idx) => (
            <div
              key={idx}
              className="border-foreground/5 bg-card-strong/60 hover:border-foreground/15 hover:bg-card-strong flex flex-col items-center justify-center rounded-xl border p-3 text-center transition-all duration-200"
            >
              <span className="text-foreground font-mono text-xs font-bold">
                {item.tag}
              </span>
              <span className="text-muted-foreground mt-0.5 max-w-[100px] truncate text-[10px]">
                {item.name}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
