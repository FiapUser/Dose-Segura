import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// O front e compilado direto para src/main/resources/static: assim o Spring Boot
// serve a SPA (index.html + assets) na mesma origem da API.
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: '../src/main/resources/static',
    emptyOutDir: true,
    assetsDir: 'assets',
  },
  server: {
    port: 5173,
    proxy: {
      '/dosegura': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
    },
  },
})
