import node from "@craft-studio/eslint-config/node";
import react from "@craft-studio/eslint-config/react";

/** @type {import('eslint').Linter.Config[]} */
export default [
  // 忽略目录
  {
    ignores: [
      "dist/**",
      ".vite/**",
      "out/**",
      "node_modules/**",
      "*.config.js",
      "*.config.ts",
    ],
  },
  
  // 主进程使用 Node.js 配置
  {
    files: ["src/main/**/*.{js,ts}", "src/preload/**/*.{js,ts}"],
    ...node[0],
  },
  
  // 渲染进程使用 React 配置
  {
    files: ["src/renderer/**/*.{js,jsx,ts,tsx}"],
    ...react[0],
  },
];

