/** @type {import('next').NextConfig} */
const nextConfig = {
    output: 'export',
    images: {
        unoptimized: true,
    },
    webpack: (config, { isServer }) => {
      config.resolve.fallback = { 
        ...config.resolve.fallback,
        buffer: false
      };

      return config;
    }
};

export default nextConfig;