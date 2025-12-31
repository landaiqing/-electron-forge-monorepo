import type { EventKey } from '@craft-studio/electron-events';


export const MAIN_PROCESS = 'main';

// 应用相关事件
export const APP_GET_VERSION: EventKey = 'app:get-version';

// 窗口控制事件
export const WINDOW_MINIMIZE: EventKey = 'window:minimize';
export const WINDOW_MAXIMIZE: EventKey = 'window:maximize';
export const WINDOW_CLOSE: EventKey = 'window:close';
export const WINDOW_IS_MAXIMIZED: EventKey = 'window:is-maximized';

// LOGGER 日志相关事件
export const LOGGER_TO_MAIN: EventKey ='logger:send-to-main'