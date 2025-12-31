import type { PreloadDependencies } from '@craft-studio/electron-events/preload';

declare global {
  interface Window {
    electronAPI: {
      events: PreloadDependencies;
    };
  }
}

export {};
