import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone", // servidor enxuto para a imagem Docker
  cacheComponents: true,
  partialPrefetching: true,
};

export default nextConfig;
