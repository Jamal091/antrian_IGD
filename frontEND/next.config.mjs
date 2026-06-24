/** @type {import('next').NextConfig} */
const configuredBasePath = process.env.NEXT_PUBLIC_BASE_PATH || '';
const basePath = configuredBasePath && configuredBasePath !== '/'
    ? configuredBasePath.replace(/\/$/, '')
    : '';

const nextConfig = {
    output: 'export',
    distDir: "out",
    trailingSlash: true,
    ...(basePath ? { basePath, assetPrefix: basePath } : {}),
    images: {
        unoptimized: true,
    },
};

export default nextConfig;
