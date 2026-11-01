import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: { ignoreDuringBuilds: true },
  transpilePackages: ["@moonwitness/ui"],
  rewrites: () =>
    Promise.resolve([
      {
        source: "/api/:path*",
        destination: `${process.env.API_URL ?? "http://localhost:3000"}/:path*`,
      },
    ]),
};

export default nextConfig;
