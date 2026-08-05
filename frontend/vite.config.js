import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [react()],

  // ── Development server ──────────────────────────────────────────────────
  server: {
    headers: {
      'Cross-Origin-Embedder-Policy': 'require-corp',
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Service-Worker-Allowed': '/',
    },
    proxy: {
      '/cdn': {
        target: 'https://unpkg.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/cdn/, ''),
      },
    },
  },

  // ── Production build optimizations ──────────────────────────────────────
  build: {
    // Use esbuild for fastest minification
    minify: 'esbuild',
    // Disable source maps in production for smaller output
    sourcemap: false,
    // Warn if any single chunk exceeds 800 KB
    chunkSizeWarningLimit: 800,

    rollupOptions: {
      output: {
        // Manual chunk splitting: isolate heavy vendor libraries so they can
        // be cached independently by the browser across deploys.
        manualChunks(id) {
          // React core + router — smallest, changes rarely
          if (id.includes('node_modules/react/') ||
              id.includes('node_modules/react-dom/') ||
              id.includes('node_modules/react-router-dom/') ||
              id.includes('node_modules/scheduler/')) {
            return 'vendor-react'
          }
          // Framer Motion — heavy animation library
          if (id.includes('node_modules/framer-motion/')) {
            return 'vendor-motion'
          }
          // Socket.io client
          if (id.includes('node_modules/socket.io-client/') ||
              id.includes('node_modules/engine.io-client/')) {
            return 'vendor-socket'
          }
          // Syntax highlighting — split into separate chunk so it can be
          // lazy-loaded only when the code editor is opened.
          if (id.includes('node_modules/highlight.js/')) {
            return 'vendor-hljs'
          }
          // Utility libs (axios, jszip, markdown, lucide)
          if (id.includes('node_modules/axios/') ||
              id.includes('node_modules/jszip/') ||
              id.includes('node_modules/markdown-to-jsx/') ||
              id.includes('node_modules/lucide-react/')) {
            return 'vendor-utils'
          }
          // Lifo sandbox runtime — very heavy
          if (id.includes('node_modules/@lifo-sh/') ||
              id.includes('node_modules/@webcontainer/')) {
            return 'vendor-runtime'
          }
        },
      },
    },
  },

  // ── esbuild options ──────────────────────────────────────────────────────
  esbuild: {
    // Remove console.* and debugger statements from production builds
    drop: mode === 'production' ? ['console', 'debugger'] : [],
  },
}))
