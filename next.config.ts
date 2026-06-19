import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["6a21-190-31-24-138.ngrok-free.app"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
    ],
  },
};

export default nextConfig;
