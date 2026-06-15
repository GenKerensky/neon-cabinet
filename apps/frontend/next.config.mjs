/** @type {import('next').NextConfig} */
const nextConfig = {
  distDir: ".next",
  transpilePackages: [
    "battle-tanks",
    "space-defender",
    "mars-lander",
    "maze-runner",
    "starfighter-assault",
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
