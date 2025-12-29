// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts

import { contextBridge, ipcRenderer } from 'electron';

// 暴露安全的 API 给渲染进程
contextBridge.exposeInMainWorld('electron', {
  // 示例：发送消息到主进程
  sendMessage: (channel: string, data: any) => {
    ipcRenderer.send(channel, data);
  },
  // 示例：接收来自主进程的消息
  onMessage: (channel: string, callback: (data: any) => void) => {
    ipcRenderer.on(channel, (event, data) => callback(data));
  },
});
