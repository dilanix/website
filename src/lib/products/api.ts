/**
 * Each product is its own separate backend microservice — there is no
 * shared "products API". This wraps calling a product's own service with
 * the session token issued by the central auth service (`@/lib/auth/api`);
 * every product's microservice is expected to trust that same token rather
 * than run its own login.
 *
 * Product-specific data modules (e.g. `src/lib/data/dashboard.ts`) should
 * go through this once a product has a real backend, and fall back to mock
 * data while `product.apiBaseUrl` is still unset.
 */
import type { Product } from "@/types";

export class ProductNotConnectedError extends Error {
  constructor(product: Product) {
    super(
      `${product.name} has no API URL configured yet (NEXT_PUBLIC_${product.slug.toUpperCase()}_API_URL) — its dashboard should fall back to mock data instead of calling this.`,
    );
  }
}

export async function fetchProductApi(
  product: Product,
  path: string,
  accessToken: string,
  init?: RequestInit,
): Promise<Response> {
  if (!product.apiBaseUrl) {
    throw new ProductNotConnectedError(product);
  }

  return fetch(`${product.apiBaseUrl}${path}`, {
    ...init,
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${accessToken}`,
      ...init?.headers,
    },
    cache: "no-store",
  });
}
