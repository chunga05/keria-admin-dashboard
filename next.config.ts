import type { NextConfig } from "next";

const supabaseHostname = process.env.NEXT_PUBLIC_SUPABASE_HOSTNAME?.trim() || '*.supabase.co';
const r2PublicUrl = process.env.NEXT_PUBLIC_R2_PUBLIC_URL || process.env.R2_PUBLIC_URL;

const nextConfig: NextConfig = {
  output: 'standalone',
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
        hostname: supabaseHostname,
      },
      {
        protocol: 'https',
        hostname: '**.r2.dev',
      },
      ...(r2PublicUrl
        ? [
            {
              protocol: 'https' as const,
              hostname: (() => {
                try {
                  return new URL(r2PublicUrl).hostname;
                } catch {
                  return r2PublicUrl;
                }
              })(),
            },
          ]
        : []),
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
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