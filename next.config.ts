import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    /* config options here */
    output: "standalone", // to reduce build size
    images: {
        domains: ["zion-assets.t3.storage.dev"],
    },
};

export default nextConfig;
