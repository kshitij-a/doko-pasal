import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: false,
  },
  images: {
    remotePatterns: [{ protocol: 'https', hostname: '*.supabase.co' }],
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline'",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com",
              "img-src 'self' https: data: blob:",
              "connect-src 'self' https://*.supabase.co https://a.khalti.com https://rc.esewa.com.np https://rc-epay.esewa.com.np https://epay.esewa.com.np https://esewa.com.np https://api.resend.com",
              "frame-src 'self' https://a.khalti.com https://rc-epay.esewa.com.np https://epay.esewa.com.np https://esewa.com.np",
            ].join('; '),
          },
        ],
      },
    ]
  },
}

export default nextConfig