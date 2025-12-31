import { app } from 'electron';
import { APP_GET_VERSION, Windows } from '@craft-studio/shared/events';
import type { MainIpcEvents } from '@craft-studio/electron-events/main';

/**
 * 注册应用相关的事件处理器
 * 包括：版本信息、应用配置、系统信息等
 */
export function registerAppHandlers(events: MainIpcEvents) {
  // 获取应用版本
  events.handle(Windows.MAIN, APP_GET_VERSION, async () => {
    return { version: app.getVersion() };
  });

}

