import type { NextConfig } from "next";
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";

const R2_PUBLIC_BASE_URL = process.env.R2_PUBLIC_BASE_URL ?? "https://images.titunge.com";

function r2Hostname(): string {
  try {
    return new URL(R2_PUBLIC_BASE_URL).hostname;
  } catch {
    return "images.titunge.com";
  }
}

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        // Supabase Storage — business logos and profile avatars only
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
      {
        // Cloudflare R2 — product images
        protocol: "https",
        hostname: r2Hostname(),
        pathname: "/**",
      },
    ],
  },
};

// Makes R2 and other bindings available to `next dev` via wrangler's platform proxy.
initOpenNextCloudflareForDev();

export default nextConfig;
