import { defineConfig } from 'vite';

// https://vitejs.dev/config
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        format: 'cjs',
        // 为 preload 脚本使用特定的文件名，避免与 main 的 index.cjs 冲突
        entryFileNames: 'preload.cjs',
      },
    },
  },
});

