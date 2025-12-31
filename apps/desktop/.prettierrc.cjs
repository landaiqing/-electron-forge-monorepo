const baseConfig = require('@craft-studio/prettier-config');

module.exports = {
  ...baseConfig,
  // Tailwind CSS v4 需要使用 tailwindStylesheet 指定 CSS 入口文件（注意是 stylesheet 不是 stylesheet）
  tailwindStylesheet: './src/renderer/src/styles/index.css',
};
