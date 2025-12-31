# @craft-studio/electron-events 使用指南

完整的 Electron 跨进程通信使用教程

## 📚 目录

- [核心概念](#核心概念)
- [完整通信流程](#完整通信流程)
- [通信场景](#通信场景)
- [完整示例](#完整示例)
- [常见问题](#常见问题)

---

## 📊 通信流向速查表

### 完整通信矩阵

| 通信场景 | 发送方法 | 第一个参数（目标） | 参数含义 | 处理器注册 | 注册位置参数 | 为什么？ |
|---------|---------|------------------|---------|-----------|------------|---------|
| **渲染 → 主进程** (单向) | `emitTo('main', event)` | `'main'` | 路由关键字：表示"发给主进程" | `on(Windows.MAIN, event, handler)` | 窗口名称 | 主进程用**发送者窗口名**查找处理器 |
| **渲染 → 主进程** (双向) | `invokeTo('main', event)` | `'main'` | 路由关键字：表示"调用主进程" | `handle(Windows.MAIN, event, handler)` | 窗口名称 | 主进程用**发送者窗口名**查找处理器 |
| **主进程 → 渲染窗口** (单向) | `emitTo(Windows.MAIN, event)` | `'main-window'` | 目标窗口名称 | `on('main', event, handler)` | `'main'` 或省略 | 渲染进程接收来自主进程的消息 |
| **主进程 → 渲染窗口** (双向) | `invokeTo(Windows.MAIN, event)` | `'main-window'` | 目标窗口名称 | `handle(event, handler)` | 省略或 `'main'` | 渲染进程响应主进程的调用 |
| **渲染 A → 渲染 B** (单向) | `emitTo(Windows.SETTINGS, event)` | `'settings-window'` | 目标窗口名称 | `on(Windows.MAIN, event, handler)` | 发送者窗口名 | 跨窗口通信，经由主进程转发 |
| **渲染 A → 渲染 B** (双向) | `invokeTo(Windows.SETTINGS, event)` | `'settings-window'` | 目标窗口名称 | `handle(event, handler)` | 省略 | 跨窗口通信，经由主进程转发 |
| **主进程 → 所有窗口** (广播) | `emitTo('*', event)` | `'*'` | 广播符号 | `on('main', event, handler)` | `'main'` 或省略 | 所有渲染进程都会收到 |

### 关键理解：为什么不能在渲染进程用 `Windows.MAIN`？

```typescript
// ❌ 错误理解
events.invokeTo(Windows.MAIN, APP_GET_VERSION);  // Windows.MAIN = 'main-window'
// 这会尝试向名为 'main-window' 的渲染窗口发送消息，而不是主进程！

// ✅ 正确理解
events.invokeTo('main', APP_GET_VERSION);  // 'main' 是特殊路由关键字
// 这会发送给主进程，主进程会用 发送者窗口名 查找处理器
```

### 内部处理机制

#### 渲染进程调用主进程时的完整流程：

```typescript
// 1️⃣ 渲染进程调用
events.invokeTo('main', APP_GET_VERSION);
//                ↓
//        toName = 'main' (路由关键字)

// 2️⃣ 主进程接收 (main.ts)
ipcMain.handle('__ELECTRON_EVENTS_CENTER__', (event, params) => {
  const { toName } = params;  // toName = 'main'
  
  // 识别发送者窗口
  const window = BrowserWindow.fromWebContents(event.sender);
  const fromName = windowPool.getName(window.id);  // fromName = 'main-window'
  
  // 判断目标是主进程
  if (MAIN_EVENT_NAME === toName) {  // 'main' === 'main'
    
    // 🔑 关键：使用发送者窗口名生成查找键
    const resEventName = this._getEventName(fromName, eventName);
    //    resEventName = 'main-window_app:get-version'
    
    // 查找处理器
    const handler = this.responsiveEventMap.get(resEventName);
    //    ↑ 所以注册时必须用 Windows.MAIN ('main-window')
    
    return handler(...payload);
  }
});

// 3️⃣ 处理器注册（必须用窗口名称）
events.handle(Windows.MAIN, APP_GET_VERSION, handler);
//             ↑
//    存储为：'main-window_app:get-version' → handler
```

### 参数对照表

| 位置 | 渲染进程调用 | 主进程注册 | 内部匹配逻辑 |
|-----|------------|----------|-------------|
| **第一个参数** | `'main'` (路由关键字) | `Windows.MAIN` (窗口名 `'main-window'`) | 主进程用 `fromName` (发送者窗口名) 替换 `'main'` 来查找 |
| **第二个参数** | `APP_GET_VERSION` | `APP_GET_VERSION` | 完全相同 |
| **生成的查找键** | - | - | `'main-window_app:get-version'` |

### 特殊关键字说明

| 关键字 | 值 | 用途 | 使用位置 |
|-------|---|------|---------|
| `MAIN_EVENT_NAME` | `'main'` | 表示"主进程" | 渲染进程的 `emitTo`/`invokeTo` 第一个参数 |
| `ANY_WINDOW_SYMBOL` | `'*'` | 表示"所有窗口" | 主进程的 `emitTo` 第一个参数（广播） |
| `SELF_NAME` | `'__ELECTRON_EVENTS_SELF__'` | 表示"当前进程/窗口" | 内部处理时的标识 |
| 窗口名称 | 如 `'main-window'` | 实际的窗口实例名称 | 窗口注册、跨窗口通信 |

### 完整代码对比示例

#### ✅ 正确写法：渲染 → 主进程

```typescript
// 📁 packages/shared/events/events.ts
export const APP_GET_VERSION: EventKey = 'app:get-version';

// 📁 packages/shared/events/windows.ts
export const Windows = {
  MAIN: 'main-window',
} as const;

// 📁 apps/desktop/src/main/events/handlers.ts (主进程)
import { Windows, APP_GET_VERSION } from '@craft-studio/shared/events';

export function setupEventHandlers(events: MainIpcEvents) {
  // ✅ 使用窗口名称注册
  events.handle(Windows.MAIN, APP_GET_VERSION, async () => {
    //             ↑ 'main-window'
    // 存储为：'main-window_app:get-version' → handler
    return { version: app.getVersion() };
  });
}

// 📁 apps/desktop/src/renderer/src/pages/home/Home.tsx (渲染进程)
import { APP_GET_VERSION } from '@craft-studio/shared/events';

const result = await events.invokeTo('main', APP_GET_VERSION);
//                                     ↑ 路由关键字，不是窗口名
// 内部：主进程会用 'main-window' (发送者窗口名) 查找处理器
```

#### ❌ 错误写法对比

```typescript
// ❌ 错误 1：主进程用 'main' 注册
events.handle('main', APP_GET_VERSION, handler);
//             ↑ 错误！会存储为：'main_app:get-version'
// 查找时：'main-window_app:get-version' ≠ 'main_app:get-version'
// 结果：No handler registered for 'app:get-version'

// ❌ 错误 2：渲染进程用窗口名调用
events.invokeTo(Windows.MAIN, APP_GET_VERSION);
//               ↑ 'main-window'
// 错误！这会尝试向名为 'main-window' 的渲染窗口发送消息
// 而不是主进程！
```

#### ✅ 正确写法：主进程 → 渲染窗口

```typescript
// 📁 apps/desktop/src/main/index.ts (主进程)
import { Windows } from '@craft-studio/shared/events';

// 向指定窗口发送消息
events.emitTo(Windows.MAIN, 'theme:changed', { theme: 'dark' });
//             ↑ 'main-window' - 目标窗口名称

// 📁 apps/desktop/src/renderer/src/pages/home/Home.tsx (渲染进程)
useEffect(() => {
  // 监听来自主进程的消息
  events.on('main', 'theme:changed', (data) => {
    //         ↑ 'main' 或省略 - 表示来自主进程
    console.log('主题已变更:', data.theme);
  });
}, []);
```

#### ✅ 正确写法：窗口 A → 窗口 B

```typescript
// 📁 packages/shared/events/windows.ts
export const Windows = {
  MAIN: 'main-window',
  SETTINGS: 'settings-window',
} as const;

// 📁 apps/desktop/src/renderer/src/pages/home/Home.tsx (主窗口)
// 发送消息给设置窗口
events.emitTo(Windows.SETTINGS, 'settings:update', { lang: 'zh-CN' });
//             ↑ 'settings-window' - 目标窗口名称

// 📁 apps/desktop/src/renderer/src/pages/settings/Settings.tsx (设置窗口)
useEffect(() => {
  // 监听来自主窗口的消息
  events.on(Windows.MAIN, 'settings:update', (data) => {
    //         ↑ 'main-window' - 发送者窗口名称
    console.log('设置更新:', data.lang);
  });
}, []);
```

### 通信流程图

```
┌─────────────────────────────────────────────────────────────────┐
│                   渲染进程 → 主进程 (双向)                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  渲染进程 (main-window)                                           │
│  ┌──────────────────────────────────────┐                      │
│  │ events.invokeTo('main', eventName)   │                      │
│  │              ↓                        │                      │
│  │  toName = 'main' (路由关键字)         │                      │
│  └──────────────────────────────────────┘                      │
│                   │                                              │
│                   │ IPC 通道                                     │
│                   ↓                                              │
│  主进程                                                           │
│  ┌──────────────────────────────────────┐                      │
│  │ 1. 识别发送者：fromName = 'main-window' │                    │
│  │ 2. 判断目标：toName = 'main'          │                      │
│  │ 3. 生成查找键：                        │                      │
│  │    'main-window_eventName'           │                      │
│  │ 4. 查找处理器：                        │                      │
│  │    responsiveEventMap.get(key)       │                      │
│  │ 5. 执行并返回结果                      │                      │
│  └──────────────────────────────────────┘                      │
│                   ↑                                              │
│  处理器注册 (启动时)                                              │
│  ┌──────────────────────────────────────┐                      │
│  │ events.handle(Windows.MAIN, eventName, handler)             │
│  │               ↓                       │                      │
│  │  存储：'main-window_eventName' → handler                     │
│  └──────────────────────────────────────┘                      │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                   主进程 → 渲染窗口 (单向)                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  主进程                                                           │
│  ┌──────────────────────────────────────┐                      │
│  │ events.emitTo(Windows.MAIN, eventName, data)                │
│  │               ↓                       │                      │
│  │  toName = 'main-window' (目标窗口)    │                      │
│  │  查找窗口实例并发送                    │                      │
│  └──────────────────────────────────────┘                      │
│                   │                                              │
│                   │ IPC 通道                                     │
│                   ↓                                              │
│  渲染进程 (main-window)                                           │
│  ┌──────────────────────────────────────┐                      │
│  │ events.on('main', eventName, handler) │                      │
│  │            ↓                          │                      │
│  │  fromName = 'main' (来自主进程)        │                      │
│  │  触发监听器                            │                      │
│  └──────────────────────────────────────┘                      │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                   窗口 A → 窗口 B (经由主进程)                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  渲染进程 A (main-window)                                         │
│  ┌──────────────────────────────────────┐                      │
│  │ events.emitTo(Windows.SETTINGS, eventName, data)            │
│  │               ↓                       │                      │
│  │  toName = 'settings-window'          │                      │
│  └──────────────────────────────────────┘                      │
│                   │                                              │
│                   ↓ IPC → 主进程                                 │
│  ┌──────────────────────────────────────┐                      │
│  │ 主进程转发：                           │                      │
│  │ 1. fromName = 'main-window'          │                      │
│  │ 2. toName = 'settings-window'        │                      │
│  │ 3. 查找目标窗口并发送                  │                      │
│  └──────────────────────────────────────┘                      │
│                   │                                              │
│                   ↓ IPC → 渲染进程 B                             │
│  渲染进程 B (settings-window)                                     │
│  ┌──────────────────────────────────────┐                      │
│  │ events.on(Windows.MAIN, eventName, handler)                 │
│  │            ↓                          │                      │
│  │  fromName = 'main-window'            │                      │
│  │  触发监听器                            │                      │
│  └──────────────────────────────────────┘                      │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                   主进程 → 所有窗口 (广播)                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  主进程                                                           │
│  ┌──────────────────────────────────────┐                      │
│  │ events.emitTo('*', eventName, data)  │                      │
│  │               ↓                       │                      │
│  │  toName = '*' (广播符号)              │                      │
│  │  获取所有窗口名称并遍历发送             │                      │
│  └──────────────────────────────────────┘                      │
│                   │                                              │
│         ┌─────────┼─────────┐                                   │
│         │         │         │                                   │
│         ↓         ↓         ↓                                   │
│    窗口1       窗口2      窗口3                                   │
│  ┌──────┐   ┌──────┐   ┌──────┐                               │
│  │ on() │   │ on() │   │ on() │                               │
│  └──────┘   └──────┘   └──────┘                               │
│   所有监听 'main' 或 '*' 的渲染进程都会收到                       │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 🎯 核心要点总结

#### 1. 参数选择规则

| 场景 | 调用时第一个参数 | 注册时第一个参数 | 原因 |
|-----|----------------|----------------|------|
| 渲染 → 主进程 | `'main'` (关键字) | `Windows.MAIN` (窗口名) | 主进程用发送者窗口名查找 |
| 主进程 → 渲染 | `Windows.MAIN` (窗口名) | `'main'` 或省略 | 直接指定目标窗口 |
| 窗口 → 窗口 | `Windows.XXX` (目标窗口名) | `Windows.XXX` (发送者窗口名) | 经主进程转发 |
| 主进程 → 所有 | `'*'` (广播符号) | `'main'` 或省略 | 广播给所有窗口 |

#### 2. 最易出错的地方

```typescript
// ❌ 最常见的错误
// 错误 1：主进程注册时用 'main'
events.handle('main', EVENT_NAME, handler);  // ❌

// 错误 2：渲染进程调用时用窗口名
events.invokeTo(Windows.MAIN, EVENT_NAME);  // ❌

// ✅ 正确写法
// 主进程注册：用窗口名
events.handle(Windows.MAIN, EVENT_NAME, handler);  // ✅

// 渲染进程调用：用 'main'
events.invokeTo('main', EVENT_NAME);  // ✅
```

#### 3. 记忆口诀

> **"渲染喊 main，主进程用窗口名来找"**
> 
> - 渲染进程调用主进程：喊 `'main'`（路由关键字）
> - 主进程注册处理器：用 `Windows.MAIN`（窗口名）
> - 主进程会用**发送者的窗口名**来匹配处理器

#### 4. 完整的执行链

```typescript
// 链路：渲染 → 主进程（双向通信）

// 1. 定义常量（shared）
export const Windows = { MAIN: 'main-window' };
export const APP_GET_VERSION: EventKey = 'app:get-version';

// 2. 主进程注册（启动时）
events.handle(Windows.MAIN, APP_GET_VERSION, handler);
//    存储为：'main-window_app:get-version' → handler

// 3. 主进程注册窗口（创建窗口时）
events.addWindow(Windows.MAIN, mainWindow);
//    映射：'main-window' → BrowserWindow实例
//    映射：windowId → 'main-window'

// 4. 渲染进程调用（运行时）
const result = await events.invokeTo('main', APP_GET_VERSION);

// 5. 主进程处理（内部流程）
// - 从 event.sender 获取 windowId
// - 通过 windowId 查找窗口名：'main-window'
// - 拼接查找键：'main-window_app:get-version'
// - 找到并执行处理器
// - 返回结果给渲染进程
```

---

## 核心概念

### 什么是 electron-events？

这是一个专为 Electron 应用设计的跨进程事件通信系统，它：
- ✅ 统一的 API 接口（主进程和渲染进程使用相同方法）
- ✅ 支持单向广播和双向响应
- ✅ 窗口池管理（多窗口通信）
- ✅ 完整的 TypeScript 类型支持

### 关键概念

#### 1. 窗口名称 vs 'main' 关键字

```typescript
// ❌ 常见误解
events.handle('main', eventName, handler);  // 错误！

// ✅ 正确理解
events.handle(Windows.MAIN, eventName, handler);  // 使用窗口名称！
```

**为什么？**
- `'main'` 是**路由关键字**，表示"发送给主进程"
- 主进程会用**发送者的窗口名称**来查找处理器
- 所以必须用**窗口名称**注册处理器

#### 2. 事件名称生成规则

```typescript
// 内部实现
_getEventName(windowName, eventName) {
  return windowName ? `${windowName}_${eventName}` : eventName;
}

// 示例
_getEventName('main-window', 'app:get-version')  
// → 'main-window_app:get-version'

_getEventName('', 'app:get-version')             
// → 'app:get-version'
```

#### 3. 通信模式

| 模式 | 方法 | 等待响应 | 使用场景 |
|-----|------|---------|---------|
| **单向发送** | `emitTo()` | ❌ | 通知、广播 |
| **双向调用** | `invokeTo()` | ✅ | 数据请求、确认 |
| **监听事件** | `on()` | - | 接收单向消息 |
| **注册处理器** | `handle()` | - | 处理双向调用 |

---

## 完整通信流程

### 1️⃣ 主进程：初始化（启动时）

```typescript
// apps/desktop/src/main/index.ts
import { useEvents } from '@craft-studio/electron-events/main';
import { Windows } from '@craft-studio/shared/events';
import { setupEventHandlers } from './events';

// 步骤1: 初始化事件系统
const events = useEvents();

// 步骤2: 注册所有处理器（必须在创建窗口前！）
setupEventHandlers(events);
  // → 内部：events.handle(Windows.MAIN, eventName, handler)
  // → 存储为：'main-window_eventName' → handler

app.whenReady().then(() => {
  // 步骤3: 创建窗口
  const mainWindow = windowService.createMainWindow();
  
  // 步骤4: 注册窗口到事件系统（关键！）
  events.addWindow(Windows.MAIN, mainWindow);
    // → 建立映射：'main-window' → BrowserWindow实例
    // → 用于后续识别发送者
});
```

### 2️⃣ 渲染进程：调用（用户操作时）

```typescript
// apps/desktop/src/renderer/src/pages/home/Home.tsx
import { useEvents } from '../../hooks';
import { APP_GET_VERSION } from '@craft-studio/shared/events';

const events = useEvents();

const handleGetVersion = async () => {
  // 调用主进程
  const result = await events.invokeTo('main', APP_GET_VERSION);
  //                                    ↑         ↑
  //                             路由关键字   事件名
  
  console.log('版本:', result.version);
};

// 内部执行流程：
// 1. preloadDependencies.invoke({ toName: 'main', eventName: 'app:get-version' })
// 2. ipcRenderer.invoke('__ELECTRON_EVENTS_CENTER__', ...)
// 3. 发送到主进程
```

### 3️⃣ 主进程：接收和处理

```typescript
// packages/electron-events/src/events/main.ts (内部实现)

ipcMain.handle('__ELECTRON_EVENTS_CENTER__', (event, params) => {
  // 收到：{ toName: 'main', eventName: 'app:get-version', payload: [] }
  
  // 步骤1: 识别发送者窗口
  const window = BrowserWindow.fromWebContents(event.sender);
  const fromName = windowPool.getName(window.id);
  // → fromName = 'main-window'
  
  // 步骤2: 判断目标是 'main'（主进程）
  if (MAIN_EVENT_NAME === toName) {  // 'main' === 'main'
    
    // 步骤3: 生成查找的事件名
    const resEventName = this._getEventName(fromName, eventName);
    // → 'main-window_app:get-version'
    
    // 步骤4: 查找处理器
    const handler = this.responsiveEventMap.get(resEventName);
    // → 找到了！因为注册时用的 Windows.MAIN ('main-window')
    
    // 步骤5: 执行并返回结果
    return handler(...payload);  // → { version: '1.0.0' }
  }
});
```

### 4️⃣ 返回结果

```typescript
// 主进程执行完毕
// → 返回 { version: '1.0.0' }

// 渲染进程收到结果
const result = await events.invokeTo('main', APP_GET_VERSION);
// result = { version: '1.0.0' }
```

---

## 通信场景

### 场景 1: 渲染进程 → 主进程

#### 单向发送（不等待响应）

```typescript
// 渲染进程
events.emitTo('main', 'app:log', { message: 'Hello' });

// 主进程监听
events.on(Windows.MAIN, 'app:log', (data) => {
  console.log('收到日志:', data.message);
});
```

#### 双向调用（等待响应）

```typescript
// 主进程注册处理器
// apps/desktop/src/main/events/handlers.ts
events.handle(Windows.MAIN, APP_GET_VERSION, async () => {
  return { version: app.getVersion() };
});

// 渲染进程调用
const result = await events.invokeTo('main', APP_GET_VERSION);
console.log('版本:', result.version);
```

### 场景 2: 主进程 → 渲染进程

#### 单向发送

```typescript
// 主进程向指定窗口发送
events.emitTo(Windows.MAIN, 'app:notification', {
  title: '通知',
  message: '有新消息'
});

// 渲染进程监听
events.on('main', 'app:notification', (data) => {
  showNotification(data.title, data.message);
});
```

#### 双向调用

```typescript
// 渲染进程注册处理器
events.handle('window:get-data', async (params) => {
  return { data: localStorage.getItem('key') };
});

// 主进程调用
const result = await events.invokeTo(Windows.MAIN, 'window:get-data', {});
console.log('窗口数据:', result.data);
```

### 场景 3: 窗口 A → 窗口 B

#### 步骤 1: 定义窗口

```typescript
// packages/shared/events/windows.ts
export const Windows = {
  MAIN: 'main-window',
  SETTINGS: 'settings-window',
  EDITOR: 'editor-window',
} as const;
```

#### 步骤 2: 注册多个窗口

```typescript
// apps/desktop/src/main/index.ts
const mainWindow = createMainWindow();
const settingsWindow = createSettingsWindow();

events.addWindow(Windows.MAIN, mainWindow);
events.addWindow(Windows.SETTINGS, settingsWindow);
```

#### 步骤 3: 窗口 A 发送

```typescript
// 主窗口发送给设置窗口
events.emitTo(Windows.SETTINGS, 'settings:update', { theme: 'dark' });

// 或等待响应
const result = await events.invokeTo(
  Windows.SETTINGS, 
  'settings:get-theme'
);
```

#### 步骤 4: 窗口 B 接收

```typescript
// 设置窗口监听
events.on(Windows.MAIN, 'settings:update', (data) => {
  console.log('主题更新:', data.theme);
});

// 注册处理器
events.handle('settings:get-theme', async () => {
  return { theme: 'dark' };
});
```

### 场景 4: 广播到所有窗口

```typescript
// 主进程广播
events.emitTo('*', 'app:data-updated', {
  timestamp: Date.now()
});

// 所有窗口的渲染进程都会收到
events.on('main', 'app:data-updated', (data) => {
  console.log('数据已更新:', data.timestamp);
  refreshData();
});
```

---

## 完整示例

### 示例：获取应用版本号

#### 1. 定义事件常量

```typescript
// packages/shared/events/events.ts
import type { EventKey } from '@craft-studio/electron-events';

export const APP_GET_VERSION: EventKey = 'app:get-version';
```

#### 2. 定义窗口常量

```typescript
// packages/shared/events/windows.ts
export const Windows = {
  MAIN: 'main-window',
} as const;
```

#### 3. 主进程注册处理器

```typescript
// apps/desktop/src/main/events/handlers.ts
import { app } from 'electron';
import { APP_GET_VERSION, Windows } from '@craft-studio/shared/events';
import type { MainIpcEvents } from '@craft-studio/electron-events/main';

export function setupEventHandlers(events: MainIpcEvents) {
  // ✅ 使用窗口名称注册
  events.handle(Windows.MAIN, APP_GET_VERSION, async () => {
    console.log('📦 收到获取版本请求');
    return { version: app.getVersion() };
  });
}
```

#### 4. 主进程初始化

```typescript
// apps/desktop/src/main/index.ts
import { useEvents } from '@craft-studio/electron-events/main';
import { Windows } from '@craft-studio/shared/events';
import { setupEventHandlers } from './events';

const events = useEvents();

// 先注册处理器
setupEventHandlers(events);

app.whenReady().then(() => {
  const mainWindow = windowService.createMainWindow();
  
  // 注册窗口
  events.addWindow(Windows.MAIN, mainWindow);
});
```

#### 5. 预加载脚本

```typescript
// apps/desktop/src/preload/index.ts
import { contextBridge } from 'electron';
import { PRELOAD_DEPENDENCIES } from '@craft-studio/electron-events/preload';

contextBridge.exposeInMainWorld('electronAPI', {
  events: PRELOAD_DEPENDENCIES,
});
```

#### 6. 渲染进程 Hook

```typescript
// apps/desktop/src/renderer/src/hooks/useEvents.ts
import { useEvents as useRendererEvents } from '@craft-studio/electron-events/renderer';

export const useEvents = () => {
  return useRendererEvents(window.electronAPI.events);
};
```

#### 7. 渲染进程调用

```typescript
// apps/desktop/src/renderer/src/pages/home/Home.tsx
import { useState } from 'react';
import { Button } from '@craft-studio/ui/src/components/Button';
import { useEvents } from '../../hooks';
import { APP_GET_VERSION } from '@craft-studio/shared/events';

export function HomePage() {
  const [version, setVersion] = useState('');
  const events = useEvents();

  const handleGetVersion = async () => {
    try {
      const result = await events.invokeTo('main', APP_GET_VERSION);
      setVersion(result.version);
      console.log('✅ 获取版本成功:', result);
    } catch (error) {
      console.error('❌ 获取版本失败:', error);
    }
  };

  return (
    <div>
      <Button onClick={handleGetVersion}>获取应用版本</Button>
      {version && <p>版本: {version}</p>}
    </div>
  );
}
```

---

### 示例 2：窗口控制（最小化/最大化）

#### 1. 定义事件常量

```typescript
// packages/shared/events/events.ts
import type { EventKey } from '@craft-studio/electron-events';

export const WINDOW_MINIMIZE: EventKey = 'window:minimize';
export const WINDOW_MAXIMIZE: EventKey = 'window:maximize';
```

#### 2. 主进程注册监听器

```typescript
// apps/desktop/src/main/events/handlers.ts
import { Windows } from '@craft-studio/shared/events';
import { WINDOW_MINIMIZE, WINDOW_MAXIMIZE } from '@craft-studio/shared/events';
import type { MainIpcEvents } from '@craft-studio/electron-events/main';

export function setupEventHandlers(events: MainIpcEvents) {
  // 最小化窗口
  events.on(Windows.MAIN, WINDOW_MINIMIZE, () => {
    const win = BrowserWindow.fromId(events['windowPool']?.getId(Windows.MAIN));
    if (win) {
      win.minimize();
      console.log('✅ 窗口已最小化');
    }
  });

  // 最大化/还原窗口
  events.on(Windows.MAIN, WINDOW_MAXIMIZE, () => {
    const win = BrowserWindow.fromId(events['windowPool']?.getId(Windows.MAIN));
    if (win) {
      if (win.isMaximized()) {
        win.unmaximize();
        console.log('✅ 窗口已还原');
      } else {
        win.maximize();
        console.log('✅ 窗口已最大化');
      }
    }
  });
}
```

#### 3. 渲染进程调用

```typescript
// apps/desktop/src/renderer/src/pages/home/Home.tsx
import { Button } from '@craft-studio/ui/src/components/Button';
import { useEvents } from '../../hooks';
import { WINDOW_MINIMIZE, WINDOW_MAXIMIZE } from '@craft-studio/shared/events';

export function HomePage() {
  const events = useEvents();

  const handleMinimize = () => {
    events.emitTo('main', WINDOW_MINIMIZE);
  };

  const handleMaximize = () => {
    events.emitTo('main', WINDOW_MAXIMIZE);
  };

  return (
    <div className="window-controls">
      <Button onClick={handleMinimize}>最小化</Button>
      <Button onClick={handleMaximize}>最大化</Button>
    </div>
  );
}
```

---

### 示例 3：日志系统

#### 1. 定义事件常量

```typescript
// packages/shared/events/events.ts
import type { EventKey } from '@craft-studio/electron-events';

export const LOG_INFO: EventKey = 'log:info';
export const LOG_ERROR: EventKey = 'log:error';
```

#### 2. 主进程注册监听器

```typescript
// apps/desktop/src/main/events/handlers.ts
import { Windows, LOG_INFO, LOG_ERROR } from '@craft-studio/shared/events';
import type { MainIpcEvents } from '@craft-studio/electron-events/main';

export function setupEventHandlers(events: MainIpcEvents) {
  // 接收普通日志
  events.on(Windows.MAIN, LOG_INFO, (message: string, data?: any) => {
    console.log('ℹ️ [渲染进程]', message, data || '');
  });

  // 接收错误日志
  events.on(Windows.MAIN, LOG_ERROR, (message: string, error?: any) => {
    console.error('❌ [渲染进程]', message, error || '');
  });
}
```

#### 3. 渲染进程发送日志

```typescript
// apps/desktop/src/renderer/src/pages/home/Home.tsx
import { useEffect } from 'react';
import { useEvents } from '../../hooks';
import { LOG_INFO, LOG_ERROR } from '@craft-studio/shared/events';

export function HomePage() {
  const events = useEvents();

  useEffect(() => {
    // 发送普通日志
    events.emitTo('main', LOG_INFO, '页面已加载', { page: 'home' });
  }, []);

  const handleError = () => {
    try {
      // 模拟错误
      throw new Error('测试错误');
    } catch (error) {
      // 发送错误日志到主进程
      events.emitTo('main', LOG_ERROR, '操作失败', error.message);
    }
  };

  return (
    <div>
      <button onClick={handleError}>触发错误</button>
    </div>
  );
}
```

---

## 常见问题

### ❓ 为什么报错：No handler registered for 'xxx'?

**原因**：处理器注册方式不正确

```typescript
// ❌ 错误
events.handle('main', eventName, handler);  
// 生成: 'main_eventName'

// ✅ 正确
events.handle(Windows.MAIN, eventName, handler);  
// 生成: 'main-window_eventName'
```

**解决**：使用窗口名称注册，而不是 `'main'` 关键字

---

### ❓ 渲染进程为什么要用 `'main'`？

```typescript
// 渲染进程调用
events.invokeTo('main', eventName);
```

**解释**：
- `'main'` 是**特殊路由关键字**
- 表示"调用主进程的处理器"
- 不是窗口名称！

**内部处理**：
1. 主进程收到请求，识别发送者窗口：`'main-window'`
2. 用发送者窗口名称查找：`'main-window_eventName'`
3. 所以注册时必须用窗口名称

---

### ❓ 什么时候注册处理器？

```typescript
// ✅ 正确顺序
const events = useEvents();
setupEventHandlers(events);  // 1. 先注册处理器

app.whenReady().then(() => {
  const window = createWindow();
  events.addWindow(name, window);  // 2. 再注册窗口
});
```

**重要**：处理器必须在窗口创建前注册，避免竞态条件

---

### ❓ 主进程代码修改后不生效？

**原因**：主进程代码需要重启应用

- ✅ **渲染进程**：自动热重载（Vite HMR）
- ❌ **主进程**：需要手动重启
- ❌ **预加载脚本**：需要手动重启

**解决**：修改主进程代码后，完全重启应用

---

### ❓ 如何调试通信问题？

```typescript
// 1. 添加日志
events.handle(Windows.MAIN, eventName, async (data) => {
  console.log('📦 收到请求:', eventName, data);
  const result = await handler(data);
  console.log('📤 返回结果:', result);
  return result;
});

// 2. 检查窗口是否注册
console.log('已注册窗口:', windowPool.getAllNames());

// 3. 检查处理器
// 在主进程打印 responsiveEventMap 的 keys
```

---

### ❓ 如何清理事件监听器？

```typescript
// React 组件中
useEffect(() => {
  // 注册监听
  events.on(Windows.MAIN, eventName, handler);
  
  // 清理
  return () => {
    events.off(Windows.MAIN, eventName, handler);
  };
}, []);

// 处理器也要清理
useEffect(() => {
  events.handle(eventName, handler);
  
  return () => {
    events.removeHandler(eventName);
  };
}, []);
```

---

## 核心原理图

```
┌─────────────────────────────────────────────────────────────┐
│                        主进程启动                            │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  1. events.handle(Windows.MAIN, eventName, handler)        │
│     └─> 存储：'main-window_eventName' → handler            │
│                                                              │
│  2. events.addWindow(Windows.MAIN, mainWindow)             │
│     └─> 映射：'main-window' → BrowserWindow实例           │
│                                                              │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                      渲染进程调用                            │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  events.invokeTo('main', eventName)                         │
│     ↓                                                        │
│  IPC: { toName: 'main', eventName: 'xxx' }                 │
│                                                              │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                      主进程处理                              │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  1. 识别发送者：fromName = 'main-window'                    │
│  2. 判断目标：toName = 'main'                               │
│  3. 生成查找名：'main-window_eventName'                     │
│  4. 查找处理器：responsiveEventMap.get(...)                 │
│  5. 执行处理器：handler() → result                          │
│                                                              │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                      返回结果                                │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  渲染进程收到结果并处理                                       │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 最佳实践

### ✅ DO

1. **使用窗口名称注册处理器**
   ```typescript
   events.handle(Windows.MAIN, eventName, handler);
   ```

2. **集中管理事件常量**
   ```typescript
   // packages/shared/events/events.ts
   export const APP_GET_VERSION: EventKey = 'app:get-version';
   ```

3. **在窗口创建前注册处理器**
   ```typescript
   setupEventHandlers(events);  // 先
   createWindow();              // 后
   ```

4. **清理事件监听器**
   ```typescript
   useEffect(() => {
     events.on(...);
     return () => events.off(...);
   }, []);
   ```

### ❌ DON'T

1. **不要用 'main' 注册处理器**
   ```typescript
   // ❌ 错误
   events.handle('main', eventName, handler);
   ```

2. **不要在渲染进程导入 electron**
   ```typescript
   // ❌ 错误
   import { app } from 'electron';  // 渲染进程会报错
   ```

3. **不要忘记注册窗口**
   ```typescript
   // ❌ 忘记注册，无法通信
   const window = createWindow();
   // events.addWindow(name, window);  // 必须调用！
   ```

4. **不要在创建窗口后注册处理器**
   ```typescript
   // ❌ 错误顺序，可能竞态
   createWindow();
   setupEventHandlers(events);
   ```

---

## 参考资源

- [README.md](./README.md) - 快速开始
- [Electron IPC 文档](https://www.electronjs.org/docs/latest/tutorial/ipc)
- [项目 Demo](../../apps/desktop/src/demo/) - 完整示例

---

**版本**: 1.0.0  
**更新日期**: 2024-12

