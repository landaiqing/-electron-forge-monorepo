import type { MainIpcEvents } from '@craft-studio/electron-events/main';
import { registerAppHandlers } from './app.handler';
import { registerWindowHandlers } from './window.handler';

/**
 * 统一注册所有事件处理器
 *
 * 模块化设计说明：
 * - app.handler.ts: 应用相关事件（版本、配置等）
 * - window.handler.ts: 窗口控制事件（最小化、最大化等）
 *
 * 未来可扩展模块：
 * - file.handler.ts: 文件操作事件
 * - menu.handler.ts: 菜单相关事件
 * - dialog.handler.ts: 对话框事件
 * - notification.handler.ts: 通知事件
 *
 * @param events - 主进程事件实例
 */
export function setupEventHandlers(events: MainIpcEvents) {
  // 注册应用相关事件
  registerAppHandlers(events);

  // 注册窗口控制事件
  registerWindowHandlers(events);
}
