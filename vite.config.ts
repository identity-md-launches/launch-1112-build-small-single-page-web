import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ command }) => ({
  base: './',
  plugins: [react(), {
    name: 'production-content-policy',
    transformIndexHtml: {
      order: 'post',
      handler(html) {
        if (command !== 'build') return html;
        return {
          // Classic, self-contained scripts also work in opaque-origin sandboxed iframes.
          html: html.replace('type="module" crossorigin', 'defer').replace('rel="stylesheet" crossorigin', 'rel="stylesheet"'),
          tags: [{ tag: 'meta', attrs: {
            'http-equiv': 'Content-Security-Policy',
            content: "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; font-src 'self'; connect-src 'none'; object-src 'none'; base-uri 'self'; form-action 'none'",
          }, injectTo: 'head-prepend' as const }],
        };
      },
    },
  }],
  build: { sourcemap: false, cssCodeSplit: false, modulePreload: false, rollupOptions: { output: { format: 'iife', inlineDynamicImports: true } } },
}));
