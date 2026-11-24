import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: { host: true, allowedHosts: true, strictPort: false, proxy: { '/api': 'http://localhost:7071' } },
  build: { rollupOptions: { output: { manualChunks(id) {
    if (id.includes('/node_modules/@fluentui/')) return 'fluent-ui';
    if (id.includes('/node_modules/react-dom/') || id.includes('/node_modules/react/')) return 'react-vendor';
    if (id.includes('/node_modules/motion/')) return 'motion-vendor';
  } } } },
});