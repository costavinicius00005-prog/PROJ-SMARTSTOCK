/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  async redirects() {
    return [
      {
        source: '/aplicativo',
        destination: '/aplicativo/index.html',
        permanent: false,
      },
      {
        source: '/aplicativo/',
        destination: '/aplicativo/index.html',
        permanent: false,
      },
    ]
  },
}

export default nextConfig
