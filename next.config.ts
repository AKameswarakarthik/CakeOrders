import type { NextConfig } from "next";

/**
 * Static export so the site can be hosted on GitHub Pages (or any static host).
 * NEXT_PUBLIC_BASE_PATH is the sub-path the site lives under, e.g. "/cakeverse"
 * for https://<user>.github.io/cakeverse/. Leave it empty for a root domain.
 */
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";

const nextConfig: NextConfig = {
  output: "export",
  basePath,
  assetPrefix: basePath || undefined,
  trailingSlash: true,
  images: { unoptimized: true },
};

export default nextConfig;
