# @craft-studio/electron-events

Electron 跨进程事件通信系统

## 简介

这是一个简化 Electron 主进程和渲染进程之间通信的库，提供统一的 API 接口。

## 安装

```bash
pnpm add @craft-studio/electron-events
```

## 使用教程

### 1. 主进程（Main Process）

在 `src/main/index.ts` 中初始化事件系统并注册窗口：

```typescript
import { app, BrowserWindow } from 'electron';
import { useEvents } from '@craft-studio/electron-events/main';

// 初始化事件系统
const events = useEvents();

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  // 将窗口添加到事件系统（必须）
  events.addWindow('main-window', mainWindow);

  // 监听来自渲染进程的事件
  events.on('main-window', 'hello', (message) => {
    console.log('收到渲染进程消息:', message);
  });

  // 向渲染进程发送事件
  events.emitTo('main-window', 'app-ready', { version: '1.0.0' });

  mainWindow.loadURL('...');
}

app.whenReady().then(createWindow);
```

### 2. 预加载脚本（Preload Script）

在 `src/preload/index.ts` 中暴露事件依赖：

```typescript
import { contextBridge } from 'electron';
import { PRELOAD_DEPENDENCIES } from '@craft-studio/electron-events/preload';

contextBridge.exposeInMainWorld('electronAPI', {
  events: PRELOAD_DEPENDENCIES,
});
```

### 3. 渲染进程（Renderer Process）

在 `src/renderer/` 中使用事件系统：

```typescript
import { useEvents } from '@craft-studio/electron-events/renderer';

// 初始化（注入预加载依赖）
const events = useEvents(window.electronAPI.events);

// 监听主进程事件
events.on('main', 'app-ready', (data) => {
  console.log('应用已就绪:', data);
});

// 向主进程发送事件
events.emitTo('main', 'hello', 'Hello from renderer!');

// 响应式调用（等待返回结果）
async function getData() {
  const result = await events.invokeTo('main', 'get-data', { id: 1 });
  console.log('获取到数据:', result);
}
```

### 4. 类型声明（可选）

创建 `src/preload/preload.d.ts` 添加类型支持：

```typescript
import type { PreloadDependencies } from '@craft-studio/electron-events/preload';

declare global {
  interface Window {
    electronAPI: {
      events: PreloadDependencies;
    };
  }
}

export {};
```

## API 速查

### 广播模式（单向通信）

```typescript
// 监听事件
events.on('window-name', 'event-name', (data) => { ... });

// 发送事件
events.emitTo('window-name', 'event-name', data);

// 移除监听
events.off('window-name', 'event-name');
```

### 响应模式（双向通信）

```typescript
// 注册处理器
events.handle('event-name', async (data) => {
  return { result: 'success' };
});

// 调用并等待响应
const result = await events.invokeTo('window-name', 'event-name', data);

// 移除处理器
events.removeHandler('event-name');
```

## 特殊窗口名称

- `'main'` - 主进程的固定名称
- `'*'` - 通配符，向所有窗口广播

## 许可证

MIT
