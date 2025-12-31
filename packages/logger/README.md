# @craft-studio/logger

统一的 Electron 应用日志服务，支持主进程和渲染进程。

## 特性

- ✅ **统一API**：主进程和渲染进程使用相同的类名和方法名
- ✅ **类型安全**：完整的 TypeScript 类型支持
- ✅ **基于 electron-events**：使用统一的事件通信系统
- ✅ **日志级别**：error, warn, info, debug, verbose, silly
- ✅ **环境变量**：支持开发环境的日志过滤
- ✅ **上下文支持**：可以为不同模块创建独立的 logger
- ✅ **文件轮转**：自动按日期轮转日志文件
- ✅ **跨进程日志**：渲染进程日志可发送到主进程文件

## 安装

```bash
pnpm add @craft-studio/logger
```

## 快速开始

### 主进程

```typescript
// apps/desktop/src/main/index.ts
import { app } from "electron";
import { useEvents } from "@craft-studio/electron-events/main";
import { loggerService, LoggerService } from "@craft-studio/logger/main";

// 初始化事件系统
const events = useEvents();

// 初始化日志服务并注册 IPC 处理器
loggerService.setupEvents(events);

// 可选：打印日志目录
console.log("Logs directory:", loggerService.getLogsDir());
//上面的初始化在main中的index.ts已经初始化过了
// 创建带上下文的 logger
const logger = LoggerService.getInstance(events).withContext("MainProcess", {
  process: "main",
});

// 使用 logger
logger.info("应用启动");
logger.error("发生错误", new Error("something went wrong"));
```

### 渲染进程

```typescript
// apps/desktop/src/renderer/src/pages/home/Home.tsx
import { useEvents } from '@craft-studio/electron-events/renderer';
import { LoggerService } from '@craft-studio/logger/renderer';

export function HomePage() {
  const events = useEvents();

  // 初始化 logger
  const logger = LoggerService.getInstance(events)
    .initWindowSource('main-window')
    .withContext('HomePage', { page: 'home' });

  // 使用 logger
  const handleClick = () => {
    logger.info('按钮被点击', { action: 'click' });
    logger.error('操作失败', error);
  };

  return <button onClick={handleClick}>点击</button>;
}
```

**完全统一的调用方式！** 🎉

## API 说明

### 日志方法

| 方法                        | 说明       |
| --------------------------- | ---------- |
| `error(message, ...data)`   | 错误日志   |
| `warn(message, ...data)`    | 警告日志   |
| `info(message, ...data)`    | 信息日志   |
| `debug(message, ...data)`   | 调试日志   |
| `verbose(message, ...data)` | 详细日志   |
| `silly(message, ...data)`   | 最详细日志 |

### 配置方法

| 方法                           | 说明                  |
| ------------------------------ | --------------------- |
| `withContext(module, context)` | 创建带上下文的 logger |
| `setLevel(level)`              | 设置日志级别          |
| `getLevel()`                   | 获取当前日志级别      |
| `resetLevel()`                 | 重置为默认级别        |

### 渲染进程特有方法

| 方法                       | 说明                                  |
| -------------------------- | ------------------------------------- |
| `initWindowSource(window)` | 设置窗口名称（可选，默认 'renderer'） |
| `setLogToMainLevel(level)` | 设置发送到主进程的最低级别            |
| `getLogToMainLevel()`      | 获取发送到主进程的日志级别            |
| `resetLogToMainLevel()`    | 重置为默认级别（warn）                |

## 日志输出位置

### 日志文件目录

日志存储在 `app.getPath("userData")/logs` 目录：

- **Windows**: `C:\Users\<用户名>\AppData\Roaming\YourApp\logs\`
- **macOS**: `~/Library/Application Support/YourApp/logs/`
- **Linux**: `~/.config/YourApp/logs/`

### 日志文件

| 文件名                     | 说明                 | 保留时间 | 大小限制 |
| -------------------------- | -------------------- | -------- | -------- |
| `app.YYYY-MM-DD.log`       | 所有级别的日志       | 30天     | 10MB     |
| `app-error.YYYY-MM-DD.log` | 只包含 WARN 和 ERROR | 60天     | 10MB     |

### 主进程日志

| 位置            | 说明                             |
| --------------- | -------------------------------- |
| **终端/控制台** | 开发模式下带颜色的日志输出       |
| **日志文件**    | 所有日志都会写入文件（JSON格式） |

### 渲染进程日志

| 级别    | 浏览器控制台 | 主进程日志文件      |
| ------- | ------------ | ------------------- |
| ERROR   | ✅ 显示      | ✅ 写入（默认）     |
| WARN    | ✅ 显示      | ✅ 写入（默认）     |
| INFO    | ✅ 显示      | ❌ 不写入（可配置） |
| DEBUG   | ✅ 显示      | ❌ 不写入（可配置） |
| VERBOSE | ✅ 显示      | ❌ 不写入（可配置） |
| SILLY   | ✅ 显示      | ❌ 不写入（可配置） |

**说明**：渲染进程默认只将 WARN 和 ERROR 发送到主进程写入文件，其他级别只在控制台显示。可以通过 `setLogToMainLevel()` 修改。

## 完整示例

### 主进程完整示例

```typescript
// apps/desktop/src/main/index.ts
import { app } from "electron";
import { useEvents } from "@craft-studio/electron-events/main";
import { loggerService, LoggerService, LEVEL } from "@craft-studio/logger/main";

// 初始化
const events = useEvents();
loggerService.setupEvents(events);

// 获取日志目录
console.log("Logs directory:", loggerService.getLogsDir());

// 创建不同模块的 logger
const mainLogger = LoggerService.getInstance(events).withContext(
  "MainProcess",
  {
    process: "main",
  }
);
const dbLogger = LoggerService.getInstance(events).withContext("Database");
const winLogger =
  LoggerService.getInstance(events).withContext("WindowService");

// 使用 logger
mainLogger.info("应用启动", { version: app.getVersion() });
dbLogger.error("连接失败", new Error("Connection timeout"));
dbLogger.warn("慢查询", { duration: 1000, sql: "SELECT * FROM users" });
dbLogger.info("连接成功", { host: "localhost", port: 5432 });

// 设置日志级别（可选）
dbLogger.setLevel(LEVEL.DEBUG);

app.whenReady().then(() => {
  mainLogger.info("App is ready");
  // ...
});
```

### 渲染进程完整示例

```typescript
// apps/desktop/src/renderer/src/pages/home/Home.tsx
import { useState } from 'react';
import { useEvents } from '@craft-studio/electron-events/renderer';
import { LoggerService, LEVEL } from '@craft-studio/logger/renderer';

export function HomePage() {
  const [status, setStatus] = useState('');
  const events = useEvents();

  // 初始化 logger
  const logger = LoggerService.getInstance(events)
    .initWindowSource('main-window')
    .withContext('HomePage', { page: 'home' });

  const handleClick = async () => {
    logger.info('用户点击按钮', { action: 'click' });

    try {
      setStatus('loading');
      logger.debug('开始请求', { url: '/api/data' });

      // 模拟 API 调用
      await fetch('/api/data');

      logger.info('请求成功');
      setStatus('success');
    } catch (error) {
      logger.error('请求失败', error);
      setStatus('error');
    }
  };

  const forceLogToMain = () => {
    // 强制将 INFO 日志发送到主进程文件
    logger.info('重要信息需要记录到文件', { logToMain: true });
  };

  return (
    <div>
      <button onClick={handleClick}>点击测试</button>
      <button onClick={forceLogToMain}>发送到文件</button>
      <p>Status: {status}</p>
    </div>
  );
}
```

## 日志流向

```
渲染进程 LoggerService
        ↓ (只有 WARN 和 ERROR 默认发送)
   electron-events
        ↓
主进程 LoggerService
        ↓
    Winston 写入文件
```

## 高级用法

### 1. 携带上下文数据

```typescript
// 创建带上下文的 logger，所有日志都会自动包含这些数据
const logger = loggerService.withContext("PaymentService", {
  userId: "123",
  sessionId: "abc",
});

logger.info("支付成功", { amount: 100 });
// 日志会自动包含 userId 和 sessionId
```

### 2. 强制发送到主进程

```typescript
// 即使是 INFO 级别（低于默认的 WARN），也要写入日志文件
logger.info("重要信息需要记录", { data: "value" }, { logToMain: true });
```

### 3. 动态调整日志级别

```typescript
// 在运行时修改日志级别
logger.setLevel(LEVEL.DEBUG); // 显示更多调试信息
logger.resetLevel(); // 重置为默认级别
```

### 4. 环境变量过滤（仅开发模式）

**主进程**：

```bash
# 设置日志级别
CSLOGGER_MAIN_LEVEL=debug npm start

# 只显示特定模块的日志
CSLOGGER_MAIN_SHOW_MODULES=Database,WindowService npm start

# 组合使用
CSLOGGER_MAIN_LEVEL=silly CSLOGGER_MAIN_SHOW_MODULES=HomePage npm start
```

**渲染进程**：

```bash
# 在 package.json 中配置
{
  "scripts": {
    "dev": "CSLOGGER_RENDERER_LEVEL=debug CSLOGGER_RENDERER_SHOW_MODULES=HomePage vite"
  }
}
```

## 常见问题

### 1. Windows 终端中文乱码

**症状**：

```
12:53:11.193 <ERROR> 杩欐槸涓€涓敊璇棄蹇?
```

**原因**：Windows 终端（CMD/PowerShell）默认使用 GBK 编码

**解决方案**：

**方法1：VS Code 集成终端**
在 `settings.json` 中添加：

```json
{
  "terminal.integrated.shellArgs.windows": [
    "-NoLogo",
    "-NoExit",
    "-Command",
    "[Console]::OutputEncoding = [System.Text.Encoding]::UTF8"
  ]
}
```

**方法2：PowerShell 手动设置**

```powershell
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
chcp 65001
pnpm dev
```

**方法3：使用 Windows Terminal + PowerShell 7**
从 Microsoft Store 安装 Windows Terminal 和 PowerShell 7，它们默认使用 UTF-8。

**注意**：日志文件始终是 UTF-8 编码，不会有乱码问题。

### 2. 渲染进程日志没有写入文件

检查日志级别：

```typescript
// 查看当前设置
console.log(logger.getLogToMainLevel()); // 默认是 'warn'

// 修改为 INFO 级别也写入文件
logger.setLogToMainLevel(LEVEL.INFO);
```

### 3. 如何查看日志文件？

在应用中打印日志目录：

```typescript
console.log("Logs directory:", loggerService.getLogsDir());
```

或在文件资源管理器中打开：

- Windows: `%APPDATA%\YourApp\logs`
- macOS: `~/Library/Application Support/YourApp/logs`
- Linux: `~/.config/YourApp/logs`

## 项目结构

```
packages/logger/src/
├── main/
│   ├── LoggerService.ts      # 主进程实现
│   └── index.ts
├── renderer/
│   ├── LoggerService.ts      # 渲染进程实现
│   └── index.ts
└── index.ts
```

## 迁移指南

### 从 console.log 迁移到 logger

**之前**：

```typescript
console.log("用户登录", { username });
console.error("登录失败", error);
```

**之后**：

```typescript
logger.info("用户登录", { username });
logger.error("登录失败", error);
```

### 从其他日志库迁移

`@craft-studio/logger` 提供了统一的 API，替换其他日志库很简单：

**winston**：

```typescript
// 之前
const logger = winston.createLogger({ ... });
logger.info('message', { data });

// 之后
const logger = LoggerService.getInstance(events).withContext('ModuleName');
logger.info('message', { data });
```

**electron-log**：

```typescript
// 之前
log.info("message");
log.error("error", error);

// 之后
logger.info("message");
logger.error("error", error);
```

## 技术细节

### 主进程 LoggerService

- 使用 Winston 作为底层日志库
- 支持日志文件自动轮转（按日期）
- 自动创建带上下文的日志实例
- 支持环境变量控制日志级别

### 渲染进程 LoggerService

- 与主进程完全相同的 API
- 通过 electron-events 将日志发送到主进程
- 控制台输出带颜色和格式化
- 可配置哪些日志发送到主进程

### 日志格式

日志文件使用 JSON 格式，便于解析和分析：

```json
{
  "level": "info",
  "message": "用户登录",
  "timestamp": "2025-12-31 13:00:00",
  "meta": {
    "username": "user123",
    "source": {
      "process": "renderer",
      "window": "main-window",
      "module": "LoginPage",
      "context": { "page": "login" }
    }
  }
}
```

## License

MIT
