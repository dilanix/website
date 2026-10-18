import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Statically typed `<Link href>` and `useRouter` — invalid routes fail at compile time.
  typedRoutes: true,
  async redirects() {
    return [
      // Resources moved into the Infrastructure product; keep old links
      // (bookmarks, emails) working. Query strings carry over.
      {
        source: "/dashboard/resources/:path*",
        destination: "/dashboard/products/infrastructure/resources/:path*",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
