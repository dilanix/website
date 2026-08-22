/**
 * Runtime-validated, typed environment variables.
 *
 * Import `env` instead of reading `process.env` directly so that a missing
 * or malformed variable fails fast with a clear error at startup, rather
 * than surfacing as an obscure bug later.
 *
 * - Add server-only secrets to `server`.
 * - Add anything read in the browser to `client`, prefixed `NEXT_PUBLIC_`.
 * - Mirror every key here in `.env.example`.
 */
import { z } from "zod";

const serverSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  // Example: DATABASE_URL: z.url(),
});

const clientSchema = z.object({
  // Central service: auth, users, orgs.
  NEXT_PUBLIC_API_URL: z.url().default("https://api.dilanix.org"),
});

// Next.js inlines `NEXT_PUBLIC_*` vars at build time, so each one must be
// referenced explicitly via `process.env.NEXT_PUBLIC_*`.
const clientEnv = clientSchema.parse({
  NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
});

const serverEnv = serverSchema.parse(process.env);

export const env = { ...serverEnv, ...clientEnv };
