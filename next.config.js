/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["react-brackets"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "r2.thesportsdb.com",
        pathname: "/**",
      },
    ],
  },
}

module.exports = nextConfig
