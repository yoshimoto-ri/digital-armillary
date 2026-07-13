import { defineConfig } from 'vite';

export default defineConfig({
  // 相對路徑：dist/ 可直接上傳任何靜態主機（含 Hostinger 子網域）
  base: './',
  build: {
    target: 'es2020',
  },
});
