"use client";

import { useMemo, useState, type ReactNode } from "react";
import {
  BookOpen,
  Check,
  Copy,
  ExternalLink,
  Info,
  AlertTriangle,
  FileText,
  List,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { ProductDocumentation } from "@/lib/core/api";

interface TocItem {
  id: string;
  title: string;
  level: number;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}

function CodeBlock({ code, language }: { code: string; language: string }) {
  const [copied, setCopied] = useState(false);

  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  return (
    <div className="border-foreground/10 my-4 overflow-hidden rounded-xl border bg-zinc-950 font-mono text-xs text-zinc-100 shadow-sm dark:bg-zinc-900">
      <div className="flex items-center justify-between border-b border-zinc-800 bg-zinc-900/80 px-4 py-2 text-zinc-400">
        <span className="text-[11px] font-semibold tracking-wider uppercase">
          {language || "text"}
        </span>
        <button
          type="button"
          onClick={onCopy}
          className="flex items-center gap-1.5 rounded px-2 py-1 text-[11px] font-medium text-zinc-300 transition-colors hover:bg-zinc-800 hover:text-white"
        >
          {copied ? (
            <>
              <Check size={13} className="text-emerald-400" />
              <span className="text-emerald-400">Copied</span>
            </>
          ) : (
            <>
              <Copy size={13} />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>
      <div className="overflow-x-auto p-4 leading-relaxed">
        <pre>
          <code>{code}</code>
        </pre>
      </div>
    </div>
  );
}

function renderInline(text: string): ReactNode[] {
  // Regex to split by inline code, bold, italic, and links
  const tokens: ReactNode[] = [];
  let remaining = text;
  let keyIndex = 0;

  while (remaining.length > 0) {
    // Check for inline code `code`
    const codeMatch = remaining.match(/^`([^`]+)`/);
    if (codeMatch) {
      tokens.push(
        <code
          key={`code-${keyIndex++}`}
          className="bg-foreground/10 text-foreground rounded px-1.5 py-0.5 font-mono text-[13px]"
        >
          {codeMatch[1]}
        </code>,
      );
      remaining = remaining.slice(codeMatch[0].length);
      continue;
    }

    // Check for bold **text**
    const boldMatch = remaining.match(/^\*\*([^*]+)\*\*/);
    if (boldMatch) {
      tokens.push(
        <strong
          key={`bold-${keyIndex++}`}
          className="text-foreground font-semibold"
        >
          {renderInline(boldMatch[1])}
        </strong>,
      );
      remaining = remaining.slice(boldMatch[0].length);
      continue;
    }

    // Check for italic *text*
    const italicMatch = remaining.match(/^\*([^*]+)\*/);
    if (italicMatch) {
      tokens.push(
        <em key={`italic-${keyIndex++}`} className="italic">
          {renderInline(italicMatch[1])}
        </em>,
      );
      remaining = remaining.slice(italicMatch[0].length);
      continue;
    }

    // Check for markdown links [label](url)
    const linkMatch = remaining.match(/^\[([^\]]+)\]\(([^)]+)\)/);
    if (linkMatch) {
      tokens.push(
        <a
          key={`link-${keyIndex++}`}
          href={linkMatch[2]}
          target={linkMatch[2].startsWith("http") ? "_blank" : undefined}
          rel={
            linkMatch[2].startsWith("http") ? "noopener noreferrer" : undefined
          }
          className="text-accent underline underline-offset-4 hover:opacity-80"
        >
          {linkMatch[1]}
          {linkMatch[2].startsWith("http") && (
            <ExternalLink size={12} className="ml-1 inline opacity-70" />
          )}
        </a>,
      );
      remaining = remaining.slice(linkMatch[0].length);
      continue;
    }

    // Regular plain text character or chunk
    const nextSpecial = remaining.search(/[`*\[]/);
    if (nextSpecial === -1) {
      tokens.push(remaining);
      break;
    } else if (nextSpecial === 0) {
      tokens.push(remaining[0]);
      remaining = remaining.slice(1);
    } else {
      tokens.push(remaining.slice(0, nextSpecial));
      remaining = remaining.slice(nextSpecial);
    }
  }

  return tokens;
}

function parseMarkdownToBlocks(markdown: string): ReactNode[] {
  const lines = markdown.split("\n");
  const blocks: ReactNode[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Fenced Code block ```lang
    if (line.trim().startsWith("```")) {
      const language = line.trim().slice(3).trim();
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].trim().startsWith("```")) {
        codeLines.push(lines[i]);
        i++;
      }
      i++; // Skip closing ```
      blocks.push(
        <CodeBlock
          key={`code-block-${i}`}
          code={codeLines.join("\n")}
          language={language}
        />,
      );
      continue;
    }

    // Horizontal Rule ---
    if (
      line.trim() === "---" ||
      line.trim() === "***" ||
      line.trim() === "___"
    ) {
      blocks.push(<hr key={`hr-${i}`} className="border-foreground/10 my-8" />);
      i++;
      continue;
    }

    // Headings #, ##, ###, ####
    const headingMatch = line.match(/^(#{1,4})\s+(.+)$/);
    if (headingMatch) {
      const level = headingMatch[1].length;
      const title = headingMatch[2].trim();
      const id = slugify(title);

      if (level === 1) {
        blocks.push(
          <h1
            key={`h1-${i}`}
            id={id}
            className="text-foreground mt-10 mb-4 scroll-mt-24 text-2xl font-bold tracking-tight first:mt-0 sm:text-3xl"
          >
            {renderInline(title)}
          </h1>,
        );
      } else if (level === 2) {
        blocks.push(
          <h2
            key={`h2-${i}`}
            id={id}
            className="border-foreground/10 text-foreground mt-8 mb-4 scroll-mt-24 border-b pb-2 text-xl font-semibold tracking-tight"
          >
            {renderInline(title)}
          </h2>,
        );
      } else if (level === 3) {
        blocks.push(
          <h3
            key={`h3-${i}`}
            id={id}
            className="text-foreground mt-6 mb-3 scroll-mt-24 text-lg font-semibold tracking-tight"
          >
            {renderInline(title)}
          </h3>,
        );
      } else {
        blocks.push(
          <h4
            key={`h4-${i}`}
            id={id}
            className="text-foreground mt-4 mb-2 scroll-mt-24 text-base font-semibold"
          >
            {renderInline(title)}
          </h4>,
        );
      }
      i++;
      continue;
    }

    // Callout / Blockquote > text
    if (line.trim().startsWith(">")) {
      const quoteLines: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith(">")) {
        quoteLines.push(lines[i].replace(/^>\s?/, ""));
        i++;
      }
      const quoteContent = quoteLines.join("\n").trim();

      // Check if alert box e.g. [!NOTE], [!WARNING], [!IMPORTANT]
      const alertMatch = quoteContent.match(
        /^\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]\s*([\s\S]*)$/i,
      );
      if (alertMatch) {
        const type = alertMatch[1].toUpperCase();
        const body = alertMatch[2];
        const isWarning = type === "WARNING" || type === "CAUTION";
        const isNote = type === "NOTE" || type === "TIP";

        blocks.push(
          <div
            key={`alert-${i}`}
            className={cn(
              "my-4 flex items-start gap-3 rounded-xl border p-4 text-sm leading-relaxed",
              isWarning
                ? "border-amber-500/30 bg-amber-500/10 text-amber-950 dark:text-amber-200"
                : isNote
                  ? "border-blue-500/30 bg-blue-500/10 text-blue-950 dark:text-blue-200"
                  : "border-purple-500/30 bg-purple-500/10 text-purple-950 dark:text-purple-200",
            )}
          >
            {isWarning ? (
              <AlertTriangle
                className="mt-0.5 shrink-0 text-amber-600 dark:text-amber-400"
                size={18}
              />
            ) : (
              <Info
                className="mt-0.5 shrink-0 text-blue-600 dark:text-blue-400"
                size={18}
              />
            )}
            <div className="flex-1">
              <span className="mb-1 block text-xs font-semibold tracking-wider uppercase">
                {type}
              </span>
              <p>{renderInline(body)}</p>
            </div>
          </div>,
        );
      } else {
        blocks.push(
          <blockquote
            key={`quote-${i}`}
            className="border-accent text-muted-foreground my-4 border-l-4 pl-4 italic"
          >
            {renderInline(quoteContent)}
          </blockquote>,
        );
      }
      continue;
    }

    // Markdown Table | col | col |
    if (line.trim().startsWith("|") && line.trim().endsWith("|")) {
      const tableLines: string[] = [];
      while (
        i < lines.length &&
        lines[i].trim().startsWith("|") &&
        lines[i].trim().endsWith("|")
      ) {
        tableLines.push(lines[i].trim());
        i++;
      }

      if (tableLines.length >= 2) {
        const headerCols = tableLines[0]
          .slice(1, -1)
          .split("|")
          .map((c) => c.trim());
        const bodyRows = tableLines.slice(2).map((r) =>
          r
            .slice(1, -1)
            .split("|")
            .map((c) => c.trim()),
        );

        blocks.push(
          <div
            key={`table-${i}`}
            className="border-foreground/10 my-6 overflow-x-auto rounded-xl border"
          >
            <table className="w-full text-left text-sm">
              <thead className="border-foreground/10 bg-foreground/[0.03] text-foreground border-b font-semibold">
                <tr>
                  {headerCols.map((col, idx) => (
                    <th key={`th-${idx}`} className="px-4 py-3">
                      {renderInline(col)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-foreground/10 text-muted-foreground divide-y">
                {bodyRows.map((row, rIdx) => (
                  <tr key={`tr-${rIdx}`} className="hover:bg-foreground/[0.01]">
                    {row.map((cell, cIdx) => (
                      <td
                        key={`td-${cIdx}`}
                        className="px-4 py-3 leading-relaxed"
                      >
                        {renderInline(cell)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>,
        );
        continue;
      }
    }

    // Unordered List - or *
    if (/^\s*[-*]\s+/.test(line)) {
      const listItems: { text: string; indent: number }[] = [];
      while (i < lines.length && /^\s*[-*]\s+/.test(lines[i])) {
        const indent = lines[i].search(/\S/);
        listItems.push({
          text: lines[i].replace(/^\s*[-*]\s+/, ""),
          indent,
        });
        i++;
      }

      blocks.push(
        <ul
          key={`ul-${i}`}
          className="text-muted-foreground my-3 list-disc space-y-1.5 pl-6 text-sm leading-relaxed"
        >
          {listItems.map((item, idx) => (
            <li key={`li-${idx}`} className="marker:text-accent">
              {renderInline(item.text)}
            </li>
          ))}
        </ul>,
      );
      continue;
    }

    // Ordered List 1. 2.
    if (/^\s*\d+\.\s+/.test(line)) {
      const listItems: string[] = [];
      while (i < lines.length && /^\s*\d+\.\s+/.test(lines[i])) {
        listItems.push(lines[i].replace(/^\s*\d+\.\s+/, ""));
        i++;
      }

      blocks.push(
        <ol
          key={`ol-${i}`}
          className="text-muted-foreground my-3 list-decimal space-y-1.5 pl-6 text-sm leading-relaxed"
        >
          {listItems.map((item, idx) => (
            <li
              key={`oli-${idx}`}
              className="marker:text-foreground marker:font-semibold"
            >
              {renderInline(item)}
            </li>
          ))}
        </ol>,
      );
      continue;
    }

    // Empty line
    if (!line.trim()) {
      i++;
      continue;
    }

    // Normal Paragraph
    blocks.push(
      <p
        key={`p-${i}`}
        className="text-muted-foreground my-3 text-sm leading-relaxed"
      >
        {renderInline(line)}
      </p>,
    );
    i++;
  }

  return blocks;
}

function extractToc(markdown: string): TocItem[] {
  const lines = markdown.split("\n");
  const toc: TocItem[] = [];

  for (const line of lines) {
    const headingMatch = line.match(/^(#{1,3})\s+(.+)$/);
    if (headingMatch) {
      const level = headingMatch[1].length;
      const title = headingMatch[2].trim().replace(/[*_`]/g, "");
      const id = slugify(title);
      toc.push({ id, title, level });
    }
  }

  return toc;
}

export function ProductDocsView({ docs }: { docs: ProductDocumentation }) {
  const [copiedLink, setCopiedLink] = useState(false);

  const toc = useMemo(
    () => extractToc(docs.documentation || ""),
    [docs.documentation],
  );
  const contentBlocks = useMemo(
    () => parseMarkdownToBlocks(docs.documentation || ""),
    [docs.documentation],
  );

  const formattedDate = docs.updated_at
    ? new Date(docs.updated_at).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : null;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } catch {}
  };

  return (
    <div className="flex flex-col gap-8">
      {/* Top Meta & Action Bar */}
      <div className="border-foreground/10 bg-foreground/[0.02] flex flex-col gap-4 rounded-2xl border p-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3.5">
          <div className="bg-accent/10 text-accent flex h-12 w-12 shrink-0 items-center justify-center rounded-xl">
            <BookOpen size={24} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-foreground text-xl font-bold tracking-tight">
                {docs.product_name} Documentation
              </h1>
              <Badge
                tone={docs.access_status === "active" ? "success" : "neutral"}
              >
                {docs.access_status}
              </Badge>
            </div>
            <p className="text-muted-foreground mt-0.5 text-xs">
              In-app user guide, setup instructions, architecture & machine API
              documentation
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {formattedDate && (
            <span className="text-muted-foreground text-xs font-medium">
              Updated {formattedDate}
            </span>
          )}
          <button
            type="button"
            onClick={handleCopyLink}
            className="border-foreground/15 text-foreground hover:border-accent/50 hover:text-accent inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors"
          >
            {copiedLink ? (
              <>
                <Check size={14} className="text-emerald-500" />
                <span>Link Copied</span>
              </>
            ) : (
              <>
                <Copy size={14} />
                <span>Share Guide</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main Documentation Grid with TOC */}
      <div className="grid grid-cols-1 gap-10 lg:grid-cols-[1fr_260px]">
        {/* Document Content */}
        <article className="min-w-0">
          {docs.documentation && docs.documentation.trim().length > 0 ? (
            <div className="prose-custom max-w-none">{contentBlocks}</div>
          ) : (
            <div className="border-foreground/10 rounded-xl border border-dashed p-12 text-center">
              <FileText
                className="text-muted-foreground mx-auto mb-3"
                size={32}
              />
              <h3 className="text-foreground text-base font-medium">
                No documentation published yet
              </h3>
              <p className="text-muted-foreground mt-1 text-sm">
                Documentation for this product has not been seeded or configured
                by the administrator.
              </p>
            </div>
          )}
        </article>

        {/* Right Sticky Table of Contents */}
        {toc.length > 0 && (
          <aside className="hidden lg:block">
            <div className="border-foreground/10 bg-foreground/[0.01] sticky top-8 rounded-xl border p-4">
              <div className="text-foreground mb-3 flex items-center gap-2 text-xs font-semibold tracking-wider uppercase">
                <List size={14} className="text-accent" />
                <span>On this page</span>
              </div>
              <nav className="flex flex-col space-y-1.5 text-xs">
                {toc.map((item) => (
                  <a
                    key={item.id}
                    href={`#${item.id}`}
                    className={cn(
                      "text-muted-foreground hover:text-foreground line-clamp-1 py-1 transition-colors",
                      item.level === 1 && "text-foreground font-medium",
                      item.level === 2 && "pl-2",
                      item.level === 3 && "text-muted-foreground/80 pl-4",
                    )}
                  >
                    {item.title}
                  </a>
                ))}
              </nav>
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}
