import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const contentSecurityPolicy = [
  "default-src 'none'",
  "script-src 'self'",
  "style-src 'self'",
  "connect-src 'self'",
  "img-src 'self' data: blob:",
  "base-uri 'none'",
  "form-action 'none'",
].join('; ')

export default defineConfig({
  base: './',
  server: { host: 'localhost' },
  preview: { host: 'localhost' },
  plugins: [
    react(),
    {
      name: 'production-content-security-policy',
      apply: 'build',
      transformIndexHtml: () => [{
        tag: 'meta',
        attrs: { 'http-equiv': 'Content-Security-Policy', content: contentSecurityPolicy },
        injectTo: 'head-prepend',
      }],
    },
  ],
})
