import { BrowserWindow } from 'electron';
import {
  Windows,
  WINDOW_MINIMIZE,
  WINDOW_MAXIMIZE,
  WINDOW_CLOSE,
  WINDOW_IS_MAXIMIZED,
} from '@craft-studio/shared/events';
import type { MainIpcEvents } from '@craft-studio/electron-events/main';

/**
 * 注册窗口控制相关的事件处理器
 * 包括：最小化、最大化、关闭、窗口状态查询等
 */
export function registerWindowHandlers(events: MainIpcEvents) {
  // 窗口最小化
  events.handle(Windows.MAIN, WINDOW_MINIMIZE, async () => {
    const win = BrowserWindow.getFocusedWindow();
    if (win) {
      win.minimize();
    }
    return { success: true };
  });

  // 窗口最大化/还原
  events.handle(Windows.MAIN, WINDOW_MAXIMIZE, async () => {
    const win = BrowserWindow.getFocusedWindow();
    if (win) {
      if (win.isMaximized()) {
        win.unmaximize();
      } else {
        win.maximize();
      }
    }
    return { success: true, isMaximized: win?.isMaximized() };
  });

  // 窗口关闭
  events.handle(Windows.MAIN, WINDOW_CLOSE, async () => {
    const win = BrowserWindow.getFocusedWindow();
    if (win) {
      win.close();
    }
    return { success: true };
  });

  // 查询窗口是否最大化
  events.handle(Windows.MAIN, WINDOW_IS_MAXIMIZED, async () => {
    const win = BrowserWindow.getFocusedWindow();
    return { isMaximized: win?.isMaximized() || false };
  });

}

