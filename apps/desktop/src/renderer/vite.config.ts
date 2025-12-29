import {defineConfig} from 'vite';
import path from 'path';

// https://vitejs.dev/config
export default defineConfig({
    root: __dirname,
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'),
            '@craft-studio/ui': path.resolve(__dirname, '../../../../packages/ui/src'),
        },
    },
});

