import type { NextConfig } from 'next';
const config: NextConfig = { output: 'export', distDir: process.env.STAMPED_DEV_DIR || '.next', allowedDevOrigins: ['127.0.0.1'], images: { unoptimized: true }, turbopack: { root: process.cwd() } };
export default config;
