import typescript from "@craft-studio/eslint-config/typescript";

/** @type {import('eslint').Linter.Config[]} */
export default [
  {
    ignores: ["dist/**", "node_modules/**"],
  },
  {
    files: ["src/**/*.{js,ts}"],
    ...typescript[0],
  },
];

