/**
 * 窗口名称常量定义
 */
export const Windows = {
  MAIN: 'main-window',
} as const;

export type WindowName = (typeof Windows)[keyof typeof Windows];

