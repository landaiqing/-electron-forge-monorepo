import { useEvents as useRendererEvents } from '@craft-studio/electron-events/renderer';

/**
 * 渲染进程事件 Hook
 * 封装 electron-events 的使用
 */
export const useEvents = () => {
  return useRendererEvents(window.electronAPI.events);
};
