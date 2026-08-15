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
  // Example: NEXT_PUBLIC_SITE_URL: z.url(),
});

// Next.js inlines `NEXT_PUBLIC_*` vars at build time, so each one must be
// referenced explicitly via `process.env.NEXT_PUBLIC_*` — a dynamic lookup
// would not be replaced by the bundler.
const clientEnv = clientSchema.parse({});

const serverEnv = serverSchema.parse(process.env);

export const env = { ...serverEnv, ...clientEnv };
