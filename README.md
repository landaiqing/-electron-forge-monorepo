# Craft Studio Template

基于 Electron Forge + React 的 Monorepo 项目架构

## 📁 项目结构

```
craft-studio-template/
├── apps/                           # 应用层
│   └── desktop/                    # Electron 桌面应用
│       ├── src/
│       │   ├── main/               # Electron 主进程
│       │   ├── preload/            # 预加载脚本
│       │   └── renderer/           # React 渲染进程
│       ├── resources/              # 打包资源
│       └── package.json
│
├── packages/                       # 共享包（可复用代码）
│   ├── shared/                     # 共享类型和常量
│   ├── utils/                      # 工具函数库
│   └── ui/                         # UI 组件库
│
├── tooling/                        # 工具链配置
│   ├── eslint-config/              # ESLint 配置
│   ├── typescript-config/          # TypeScript 配置
│   └── prettier-config/            # Prettier 配置
│
├── pnpm-workspace.yaml             # pnpm workspace 配置
├── turbo.json                      # Turborepo 配置
└── package.json                    # 根配置
```

## 🚀 技术栈

- **Electron Forge** v7.10.2 - Electron 应用构建工具
- **Vite** v5.4.21 - 现代化构建工具
- **React** 19.x - 前端框架
- **TypeScript** - 类型安全
- **pnpm** - 包管理器
- **Turborepo** - Monorepo 构建工具

## 📦 Monorepo 管理

本项目使用 **pnpm workspace** + **Turborepo** 管理 Monorepo：

- **pnpm workspace**: 依赖管理和包链接
- **Turborepo**: 任务编排、增量构建、缓存优化

## 🛠️ 开发命令

```bash
# 安装依赖
pnpm install

# 启动开发服务器
pnpm dev

# 构建所有包
pnpm build

# 代码检查
pnpm lint

# 类型检查
pnpm type-check

# 清理构建产物
pnpm clean
```

## 📖 包说明

### apps/desktop
Electron 桌面应用，包含主进程、渲染进程和预加载脚本。

### packages/shared
共享的类型定义和常量，供主进程和渲染进程使用。

### packages/utils
通用工具函数库，包含日期、格式化、验证等工具。

### packages/ui
可复用的 UI 组件库。

### tooling/*
共享的工具链配置包，确保整个 Monorepo 使用统一的代码规范。

## 🏗️ 架构原则

1. **单一应用**: Electron 作为一个完整应用，不拆分主进程和渲染进程
2. **代码复用**: 通过 packages 实现跨模块的代码共享
3. **类型安全**: 使用 TypeScript 确保类型安全
4. **统一配置**: 通过 tooling 统一工具链配置
5. **增量构建**: 使用 Turborepo 优化构建性能

## 📝 注意事项

- 所有共享类型定义放在 `packages/shared/types`
- IPC 通信类型定义也在 `packages/shared/types`
- 业务逻辑代码放在 `apps/desktop`
- 仅可复用的通用代码放在 `packages`

## 📚 参考文档

- [Electron Forge 官方文档](https://www.electronforge.io/)
- [Turborepo 官方文档](https://turbo.build/repo/docs)
- [pnpm Workspace](https://pnpm.io/workspaces)

