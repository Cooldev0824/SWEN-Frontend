/** @type {import('next').NextConfig} */
const nextConfig = {
  trailingSlash: true,
  reactStrictMode: true,
  swcMinify: true,
  serverRuntimeConfig: {
    secret: 'hewkjfcbqwg4rcbit27bc8t2744rgb23879cgbf3ecgy4ryuifgcqbweygufcwbeuyir'
  },
  publicRuntimeConfig: {
      apiUrl: process.env.NODE_ENV === 'development'
          ? 'https://devapp.swenewsapp.com/api' // development api
          : 'https://devapp.swenewsapp.com/api' // production api
  },
  async redirects() {
    return [
      {
        source: '/',
        destination: '/map',
        permanent: true,
      },
    ]
  },
  typescript: {
    ignoreBuildErrors: true,
  }
}

module.exports = nextConfig
