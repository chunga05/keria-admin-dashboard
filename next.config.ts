import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* CẤU HÌNH CHO NEXT/IMAGE */
  images: {
    qualities: [75, 100],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'i.pravatar.cc',
      },
      {
        protocol: 'https',
        hostname: process.env.NEXT_PUBLIC_SUPABASE_HOSTNAME as string,
      },
    ],
  },
  
  /* CẤU HÌNH SVG CŨ CỦA BẠN (GIỮ NGUYÊN) */
  webpack(config) {
    config.module.rules.push({
      test: /\.svg$/,
      use: ["@svgr/webpack"],
    });
    return config;
  },
    
  turbopack: {
    rules: {
      '*.svg': {
        loaders: ['@svgr/webpack'],
        as: '*.js',
      },
    },
  },
};

export default nextConfig;