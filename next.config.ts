import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  allowedDevOrigins:
    process.env.NODE_ENV === 'development' ? ['**.revolte.io', '**.*'] : ['**.revolte.io'],
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          {
            key: 'Content-Security-Policy',
            value: "frame-ancestors 'self' https://revolte.ai https://*.revolte.ai",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
