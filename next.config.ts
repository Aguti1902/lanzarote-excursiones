import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
  },
  async redirects() {
    return [
      {
        source: "/traslados",
        destination: "/traslados-aeropuerto-lanzarote",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
