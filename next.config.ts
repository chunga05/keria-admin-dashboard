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
      {
        protocol: 'https',
        hostname: '**.r2.dev',
      },
      // BỔ SUNG CẤU HÌNH HOSTNAME YOUTUBE VÀO ĐÂY
      {
        protocol: 'https',
        hostname: 'www.youtube.com',
      },
      {
        protocol: 'https',
        hostname: 'img.youtube.com',
      },
      {
        protocol: 'https',
        hostname: 'i.ytimg.com',
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