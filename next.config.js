const path = require('path')
const withMDX = require('@next/mdx')({
  extension: /\.mdx?$/,
})

/** @type {import('next').NextConfig} */
const nextConfig = withMDX({
  reactStrictMode: true,
  pageExtensions: ['js', 'jsx', 'ts', 'tsx', 'md', 'mdx'],
  experimental: {
    outputFileTracingIncludes: {
      './': [path.join(__dirname, 'content')],
    },
  },
})

module.exports = nextConfig
