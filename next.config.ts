import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Statically typed `<Link href>` and `useRouter` — invalid routes fail at compile time.
  typedRoutes: true,
};

export default nextConfig;
