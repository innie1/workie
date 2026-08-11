import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg'],
      manifest: {
        name: 'Workie',
        short_name: 'Workie',
        description: 'A simple, powerful all-in-one creative workspace.',
        theme_color: '#7C3CFF',
        background_color: '#FFFFFF',
        display: 'standalone',
        orientation: 'any',
        icons: [
          { src: '/favicon.svg', sizes: '64x64', type: 'image/svg+xml', purpose: 'any' },
          { src: '/favicon.svg', sizes: '64x64', type: 'image/svg+xml', purpose: 'maskable' }
        ]
      },
      workbox: {
        navigateFallback: '/index.html',
        globPatterns: ['**/*.{js,css,html,svg,ico}']
      }
    })
  ]
})
