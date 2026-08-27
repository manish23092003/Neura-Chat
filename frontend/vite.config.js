import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [react()],

  // ── Development server ──────────────────────────────────────────────────
  server: {
    headers: {
      // NOTE: 'Cross-Origin-Opener-Policy: same-origin' has been intentionally
      // removed. Setting COOP to same-origin severs window.opener between the
      // main page and the Google Identity Services popup, which silently
      // prevents the OAuth token callback from ever firing.
      //
      // 'Cross-Origin-Embedder-Policy: require-corp' is also removed here
      // because COEP + COOP together are required for SharedArrayBuffer, but
      // COOP must be same-origin for that pair — which breaks Google Sign-In.
      // WebContainer routes that need SharedArrayBuffer should handle their
      // own headers at the application level if required.
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
          // Monaco Editor chunk
          if (id.includes('node_modules/@monaco-editor/') ||
              id.includes('node_modules/monaco-editor/')) {
            return 'vendor-monaco'
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
