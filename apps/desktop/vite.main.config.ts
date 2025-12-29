import { defineConfig } from 'vite';

// https://vitejs.dev/config
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        format: 'cjs',
        // main 进程输出为 index.cjs（与 package.json 中的 main 字段一致）
        entryFileNames: '[name].cjs',
      },
    },
  },
});

