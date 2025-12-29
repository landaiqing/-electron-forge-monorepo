# @craft-studio/typescript-config

TypeScript 共享配置

## 说明

包含多个 TypeScript 配置文件：
- `base.json` - 基础配置
- `node.json` - Node.js 环境配置
- `react.json` - React 环境配置

## 使用

在各个包的 `tsconfig.json` 中：

```json
{
  "extends": "@craft-studio/typescript-config/react.json"
}
```

