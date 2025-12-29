import js from "@eslint/js";
import tseslint from "typescript-eslint";
import prettier from "eslint-config-prettier";
import prettierPlugin from "eslint-plugin-prettier";

/** 基础 ESLint 配置 */
export default tseslint.config(
    js.configs.recommended,
    prettier,
    {
        plugins: {
            prettier: prettierPlugin,
        },
        rules: {
            // Prettier 规则
            "prettier/prettier": "error",

            // 基础规则
            "no-console": "warn",
            "no-debugger": "warn",
            "no-unused-vars": "off", // 由 TypeScript 处理

            // 分号规则（强制使用分号）
            "semi": ["error", "always"],
        },
    }
);

