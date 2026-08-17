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
  // Central service: auth, users, orgs. Every product trusts the session
  // token this issues, but none of them live behind it.
  NEXT_PUBLIC_API_URL: z.url().default("https://api.dilanix.org"),
  // Each product ships as its own separate microservice with its own API —
  // there is no shared product backend. Add one `NEXT_PUBLIC_<PRODUCT>_API_URL`
  // per product as its service goes live; optional so the app still runs
  // before that product has a backend (its dashboard just stays on mock data).
  NEXT_PUBLIC_COSTOPS_API_URL: z.url().optional(),
});

// Next.js inlines `NEXT_PUBLIC_*` vars at build time, so each one must be
// referenced explicitly via `process.env.NEXT_PUBLIC_*` — a dynamic lookup
// would not be replaced by the bundler. This is also why per-product API
// URLs can't be assembled from a slug at runtime and must be listed here
// one by one as real products get real backends.
const clientEnv = clientSchema.parse({
  NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
  NEXT_PUBLIC_COSTOPS_API_URL: process.env.NEXT_PUBLIC_COSTOPS_API_URL,
});

const serverEnv = serverSchema.parse(process.env);

export const env = { ...serverEnv, ...clientEnv };
