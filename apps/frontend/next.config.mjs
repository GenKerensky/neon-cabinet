/** @type {import('next').NextConfig} */
const nextConfig = {
  distDir: ".next",
  transpilePackages: [
    "@neon-cabinet/battle-tanks",
    "@neon-cabinet/space-defender",
    "@neon-cabinet/mars-lander",
    "@neon-cabinet/games-shared",
  ],
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
