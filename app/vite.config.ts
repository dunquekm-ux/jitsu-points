import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import { APP_VERSION } from './src/version'

// Build number injected from env (CI sets VITE_BUILD_NUMBER; fallback for local dev)
const buildNumber = process.env.VITE_BUILD_NUMBER ?? 'dev'

// Stamp the build version into index.html as a machine-readable meta tag, so smoke
// tests (and the CI deploy step) can confirm the live site is serving this build.
function appVersionMeta() {
  return {
    name: 'inject-app-version-meta',
    transformIndexHtml(html: string) {
      return html.replace(
        '</head>',
        `  <meta name="app-version" content="${APP_VERSION}" />\n  </head>`,
      )
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  define: {
    __BUILD_NUMBER__: JSON.stringify(buildNumber),
  },
  plugins: [
    react(),
    appVersionMeta(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'apple-touch-icon.png'],
      manifest: {
        name: 'Jitsu Points',
        short_name: 'Jitsu',
        description: 'Gamified chores and rewards for kids',
        theme_color: '#FF4F8B',
        background_color: '#FFF6E8',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        icons: [
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com/,
            handler: 'CacheFirst',
            options: { cacheName: 'google-fonts', expiration: { maxAgeSeconds: 60 * 60 * 24 * 365 } },
          },
        ],
      },
    }),
  ],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test-setup.ts'],
    exclude: ['**/node_modules/**', '**/dist/**', '**/e2e/**'],
    coverage: {
      reporter: ['text', 'lcov'],
      include: ['src/domain/**'],
      thresholds: { lines: 85, functions: 85, branches: 80 },
    },
  },
})
