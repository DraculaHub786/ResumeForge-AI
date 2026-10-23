import createNextIntlPlugin from 'next-intl/plugin';

/**
 * Wires `next-intl` into the build. The request configuration lives in
 * `src/i18n/request.ts` and resolves the active locale from a cookie.
 */
const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Emits a self-contained server bundle in `.next/standalone`, which is what
  // the production Docker image runs. See `docker/Dockerfile.web`.
  output: 'standalone',
  transpilePackages: [
    '@resume-builder/ui',
    '@resume-builder/types',
    '@resume-builder/ai',
    '@resume-builder/pdf',
  ],
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'avatars.githubusercontent.com' },
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
    ],
  },
  // The shared packages are authored as ESM with NodeNext-style explicit
  // `.js` specifiers (required for the server runtime). The app's tsconfig
  // paths point at their TypeScript sources so the bundler can transpile
  // them, but webpack does not rewrite `./foo.js` to `./foo.ts` on its own.
  // This alias makes those specifiers resolve to the source files.
  webpack: (config) => {
    config.resolve = config.resolve ?? {};
    config.resolve.extensionAlias = {
      ...(config.resolve.extensionAlias ?? {}),
      '.js': ['.ts', '.tsx', '.js'],
      '.mjs': ['.mts', '.mjs'],
    };
    return config;
  },
};

export default withNextIntl(nextConfig);
