import path from "node:path";
import { fileURLToPath } from "node:url";

import type { NextConfig } from "next";

// Pinned so Turbopack does not walk up past the project when inferring the
// workspace root (this checkout can live under a home directory that contains
// other lockfiles).
const projectRoot = path.dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  reactStrictMode: true,
  turbopack: { root: projectRoot },
};

export default nextConfig;
