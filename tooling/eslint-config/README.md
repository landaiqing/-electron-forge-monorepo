# @craft-studio/eslint-config

ESLint 9.x 共享配置（Flat Config 格式），支持 TypeScript、React 和 Node.js 环境。

## ✅ 功能特性

- ✅ **ESLint 9.x Flat Config** - 使用最新的扁平化配置格式
- ✅ **TypeScript 支持** - 完整的 TypeScript 类型检查和规则
- ✅ **React 支持** - React 17+ (无需导入 React) 和 Hooks 规则
- ✅ **Prettier 集成** - 零冲突，自动格式化
- ✅ **分号强制** - 强制使用分号结尾
- ✅ **下划线变量忽略** - 自动忽略 `_var` 格式的未使用变量
- ✅ **模块化配置** - 针对不同环境的独立配置

## 📦 包含的配置

- `base.mts` - 基础 ESLint 配置
- `typescript.mts` - TypeScript 专用配置
- `react.mts` - React + TypeScript 配置
- `node.mts` - Node.js + TypeScript 配置

## 🚀 使用方式

### 1. 安装依赖

```json
{
  "devDependencies": {
    "@craft-studio/eslint-config": "workspace:*",
    "@craft-studio/prettier-config": "workspace:*",
    "eslint": "^9.39.2",
    "prettier": "^3.4.2"
  }
}
```

### 2. 创建 eslint.config.mts

#### Node.js 项目

```typescript
import { node } from "@craft-studio/eslint-config/node";

export default [
  {
    ignores: ["dist/**", "node_modules/**"],
  },
  {
    files: ["**/*.{js,ts}"],
    ...node,
  },
];
```

#### React 项目

```typescript
import { react } from "@craft-studio/eslint-config/react";

export default [
  {
    ignores: ["dist/**", "node_modules/**"],
  },
  {
    files: ["src/**/*.{js,jsx,ts,tsx}"],
    ...react,
  },
];
```

#### Electron 项目（混合）

```typescript
import { node } from "@craft-studio/eslint-config/node";
import { react } from "@craft-studio/eslint-config/react";

export default [
  {
    ignores: ["dist/**", ".vite/**", "node_modules/**"],
  },
  // 主进程 Node.js 配置
  {
    files: ["src/main/**/*.{js,ts}", "src/preload/**/*.{js,ts}"],
    ...node,
  },
  // 渲染进程 React 配置
  {
    files: ["src/renderer/**/*.{js,jsx,ts,tsx}"],
    ...react,
  },
];
```

### 3. 创建 .prettierrc.cjs

```javascript
module.exports = require('@craft-studio/prettier-config');
```

### 4. 添加脚本

```json
{
  "scripts": {
    "lint": "eslint .",
    "lint:fix": "eslint . --fix",
    "format": "prettier --write \"src/**/*.{js,jsx,ts,tsx,json,css,md}\""
  }
}
```

## 📋 规则说明

### 核心规则

| 规则 | 配置 | 说明 |
|------|------|------|
| `prettier/prettier` | `error` | Prettier 格式错误作为 ESLint 错误 |
| `semi` | `["error", "always"]` | 强制使用分号 |
| `@typescript-eslint/no-unused-vars` | `error` with `^_` pattern | 忽略 `_` 开头的变量 |
| `no-console` | Node: `off`, 其他: `warn` | 根据环境调整 |

### TypeScript 规则

- ✅ 推荐规则全部启用
- ✅ `@typescript-eslint/no-explicit-any` - 警告
- ✅ `@typescript-eslint/explicit-function-return-type` - 关闭（类型推导）

### React 规则

- ✅ `react/react-in-jsx-scope` - 关闭（React 17+）
- ✅ `react/prop-types` - 关闭（使用 TypeScript）
- ✅ React Hooks 规则全部启用

## 🎯 下划线变量忽略示例

```typescript
// ✅ 这些不会触发 unused-vars 错误
const _unusedVar = 'ignored';
function example(_unusedParam: string) {
  return 'ok';
}
try {
  // ...
} catch (_error) {
  // 忽略错误对象
}

// ❌ 这些会触发错误
const unusedVar = 'error';
function example(unusedParam: string) {
  return 'error';
}
```

## 📚 依赖版本

- ESLint: `^9.39.2`
- TypeScript ESLint: `^8.50.1`
- Prettier: `^3.4.2`
- React Plugin: `^7.37.5`

## 🔧 故障排除

### 问题：ESLint 无法识别配置

**解决方案**：确保使用 `.mts` 扩展名和 `type: "module"` 在 package.json 中。

### 问题：Prettier 和 ESLint 冲突

**解决方案**：已通过 `eslint-config-prettier` 自动处理，无需手动配置。

### 问题：导入路径错误

**解决方案**：使用完整路径导入：
```typescript
import { node } from "@craft-studio/eslint-config/node";
// 而不是
import node from "@craft-studio/eslint-config/node";
```

## ✅ 验证配置

运行以下命令测试配置：

```bash
# Lint 检查
pnpm lint

# 自动修复
pnpm lint:fix

# 格式化
pnpm format
```

---

**版本**: 1.0.0  
**作者**: @craft-studio  
**许可**: MIT
