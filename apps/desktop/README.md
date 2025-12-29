# Craft Studio Desktop

Electron 桌面应用程序

## 目录结构

```
desktop/
├── src/
│   ├── main/           # Electron 主进程
│   ├── preload/        # 预加载脚本
│   └── renderer/       # React 渲染进程
├── resources/          # 打包资源
└── package.json
```

## 开发

```bash
pnpm dev
```

## 构建

```bash
pnpm build
```

