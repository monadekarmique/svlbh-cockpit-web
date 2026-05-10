import type { NextConfig } from "next";
import { execSync } from "node:child_process";

function gitShortHash(): string {
  // Render expose RENDER_GIT_COMMIT en env var au build — fallback git CLI local
  if (process.env.RENDER_GIT_COMMIT) {
    return process.env.RENDER_GIT_COMMIT.slice(0, 7);
  }
  try {
    return execSync("git rev-parse --short HEAD").toString().trim();
  } catch {
    return "no-git";
  }
}

const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_BUILD_ID: gitShortHash(),
    NEXT_PUBLIC_BUILD_TIME: new Date()
      .toISOString()
      .replace("T", " ")
      .slice(0, 16),
  },
  // Désactive le cache HTML browser sur les pages dynamiques.
  // Sans ça, Cloudflare + Safari servent l'ancien HTML après un nouveau
  // déploiement et les utilisateurs ne voient pas les changements.
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "Cache-Control", value: "no-cache, must-revalidate" },
        ],
      },
    ];
  },
};

export default nextConfig;
