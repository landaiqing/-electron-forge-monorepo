import { contextBridge } from 'electron';
import { PRELOAD_DEPENDENCIES } from '@craft-studio/electron-events/preload';

contextBridge.exposeInMainWorld('electronAPI', {
  events: PRELOAD_DEPENDENCIES,
});
