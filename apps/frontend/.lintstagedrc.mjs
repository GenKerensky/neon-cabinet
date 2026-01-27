export default {
  // TypeScript/JavaScript files - run eslint and prettier
  "*.{ts,tsx,js,jsx}": ["eslint --fix", "prettier --write"],
  // Other files for prettier
  "*.{html,css,json,md}": "prettier --write",
  // Shader files - validate all shaders if any are staged
  "*.{frag,vert,glsl}": () => {
    return ["nx run @neon-cabinet/shaders:lint"];
  },
};
