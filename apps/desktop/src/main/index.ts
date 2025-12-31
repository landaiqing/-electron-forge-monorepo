import { electronApp, optimizer } from '@electron-toolkit/utils';
import { app, BrowserWindow } from 'electron';
import { useEvents } from '@craft-studio/electron-events/main';
import { Windows } from '@craft-studio/shared/events';
import { LoggerService, loggerService } from '@craft-studio/logger/main';

import { windowService } from './services/WindowService';
import { setupEventHandlers } from './events';

// 初始化事件系统
const events = useEvents();

// 初始化日志服务并注册 IPC 处理器（接收渲染进程日志）
loggerService.setupEvents(events);

// 创建带上下文的logger用于主进程日志
const logger = LoggerService.getInstance(events).withContext('MainProcess', { process: 'main' });

// 注册所有事件处理器
setupEventHandlers(events);

app.whenReady().then(() => {
  electronApp.setAppUserModelId('com.electron');

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window);
  });

  // 创建主窗口
  const mainWindow = windowService.createMainWindow();

  // 将窗口注册到事件系统
  events.addWindow(Windows.MAIN, mainWindow);

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) {
      windowService.createMainWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
