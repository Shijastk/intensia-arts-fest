import type { NextConfig } from 'next'

const isProd = false;

const basePath = isProd ? '/paidin' : ''

const nextConfig: NextConfig = {
    basePath,
    output: 'export',
    images: {
        unoptimized: true,
    },
    typescript: {
        ignoreBuildErrors: false,
    },
    env: {
        NEXT_PUBLIC_BASE_PATH: basePath
    }
}

export default nextConfig
