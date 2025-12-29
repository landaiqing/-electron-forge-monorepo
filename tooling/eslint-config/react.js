import tseslint from "typescript-eslint";
import pluginReact from "eslint-plugin-react";
import prettier from "eslint-config-prettier";
import prettierPlugin from "eslint-plugin-prettier";
import globals from "globals";

/** React + TypeScript ESLint 配置 */
export default tseslint.config(
  ...tseslint.configs.recommended,
  pluginReact.configs.flat.recommended,
  pluginReact.configs.flat["jsx-runtime"],
  prettier,
  {
    files: ["**/*.{ts,tsx,js,jsx}"],
    plugins: {
      prettier: prettierPlugin,
    },
    languageOptions: {
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
      globals: {
        ...globals.browser,
      },
    },
    settings: {
      react: {
        version: "detect",
      },
    },
    rules: {
      // Prettier 规则
      "prettier/prettier": "error",
      
      // 分号规则（强制使用分号）
      "semi": ["error", "always"],
      
      // React 规则
      "react/react-in-jsx-scope": "off", // React 17+ 不需要
      "react/prop-types": "off", // 使用 TypeScript
      
      // TypeScript 规则
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
        },
      ],
      "@typescript-eslint/no-explicit-any": "warn",
    },
  }
);

