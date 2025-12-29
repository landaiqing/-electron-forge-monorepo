import tseslint from "typescript-eslint";
import prettier from "eslint-config-prettier";
import prettierPlugin from "eslint-plugin-prettier";

/** TypeScript ESLint 配置 */
export default tseslint.config(
  ...tseslint.configs.recommended,
  prettier,
  {
    plugins: {
      prettier: prettierPlugin,
    },
    rules: {
      // Prettier 规则
      "prettier/prettier": "error",
      
      // 分号规则（强制使用分号）
      "semi": ["error", "always"],
      
      // TypeScript 规则
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",      // 忽略以 _ 开头的参数
          varsIgnorePattern: "^_",      // 忽略以 _ 开头的变量
          caughtErrorsIgnorePattern: "^_", // 忽略以 _ 开头的 catch 错误
        },
      ],
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/explicit-function-return-type": "off",
      "@typescript-eslint/explicit-module-boundary-types": "off",
      "@typescript-eslint/no-non-null-assertion": "warn",
      "@typescript-eslint/ban-ts-comment": "warn",
    },
  }
);

