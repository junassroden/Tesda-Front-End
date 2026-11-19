import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import babel from '@rolldown/plugin-babel'
import { fileURLToPath } from 'node:url'
import { defineConfig, loadEnv } from 'vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, fileURLToPath(new URL('.', import.meta.url)), '')
  // Where the LavaLust backend is served. Requests to /api are forwarded there,
  // so the browser sees one origin and the session cookie just works.
  const backend = new URL(env.VITE_BACKEND_URL || 'http://localhost/TesdaNexus/Back-End/public')
  const basePath = backend.pathname.replace(/\/$/, '')
  const proxy = {
    '/api': {
      target: backend.origin,
      changeOrigin: true,
      rewrite: (path) => basePath + path,
    },
  }

  return {
    plugins: [react(), babel({ presets: [reactCompilerPreset()] })],
    server: { proxy },
    preview: { proxy },
  }
})
