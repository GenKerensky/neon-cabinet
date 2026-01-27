/** @type {import('next').NextConfig} */
const nextConfig = {
  distDir: ".next",
  transpilePackages: ["battle-tanks", "space-defender", "mars-lander"],
  turbopack: {
    rules: {
      "*.{frag,vert,glsl}": {
        loaders: ["raw-loader"],
        as: "*.js",
      },
    },
  },
};

export default nextConfig;
