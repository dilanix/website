import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Statically typed `<Link href>` and `useRouter` ? invalid routes fail at compile time.
  typedRoutes: true,

  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "cdn.dilanix.org",
        pathname: "/blog/covers/**",
      },
      {
        protocol: "https",
        hostname: "dilanix-demo.s3.amazonaws.com",
        pathname: "/blog/covers/**",
      },
    ],
  },

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
