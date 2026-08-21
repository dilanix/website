<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Interaction and Decision Guidelines

- **Clarify Underspecified Requirements**: If a user request or task is unclear, ambiguous, or lacks crucial specifications, ask a maximum of 5 targeted, concise questions to clarify intent before proceeding with implementation.
- **Consult on Alternative Solutions**: If there are multiple viable technical approaches, architectural choices, or trade-offs, ALWAYS present the options clearly with pros/cons and ask the user to choose/confirm before implementing.
