import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  server: {
    https: false, // Disable HTTPS for local development
    proxy: {
      // Add proxy configuration if needed
      '/api': {
        target: 'http://localhost:54321',
        changeOrigin: true,
      }
    }
  }
});