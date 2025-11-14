import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Configuration des images
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'storage.googleapis.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'firebasestorage.googleapis.com',
        port: '',
        pathname: '/**',
      },
    ],
    // Optimisation des images pour la production
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 60,
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },

  // Configuration de production
  reactStrictMode: true,
  poweredByHeader: false, // Masquer le header X-Powered-By pour la sécurité

  // Optimisations de production
  compress: true, // Compression gzip

  // Headers de sécurité pour la production
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()'
          }
        ],
      },
    ];
  },

  // Variables d'environnement exposées (vérification)
  env: {
    NEXT_PUBLIC_APP_NAME: 'Nythy',
    NEXT_PUBLIC_APP_VERSION: '1.0.0',
  },

  // Configuration pour Firebase Hosting
  output: process.env.BUILD_TARGET === 'firebase' ? 'export' : undefined,
  trailingSlash: process.env.BUILD_TARGET === 'firebase' ? true : false,
  
  // Désactiver le telemetry Next.js (optionnel)
  // telemetry: false,
};

export default nextConfig;
