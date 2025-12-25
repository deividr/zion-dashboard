import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    /* config options here */
    output: "standalone", // to reduce build size
    images: {
        domains: ["img.cybercook.com.br"],
    },
};

export default nextConfig;
