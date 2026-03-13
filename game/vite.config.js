import { defineConfig } from 'vite';

// itch.io's CDN (*.itch.zone) does not return CORS headers for static assets,
// so Vite's default crossorigin="anonymous" on module scripts causes them to
// fail to load. This plugin strips crossorigin from the built HTML.
const removeCrossorigin = {
  name: 'remove-crossorigin',
  transformIndexHtml(html) {
    return html.replace(/ crossorigin/g, '');
  },
};

export default defineConfig({
  base: './',
  plugins: [removeCrossorigin],
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    rollupOptions: {
      output: {
        manualChunks: {
          phaser: ['phaser'],
        },
      },
    },
  },
  server: {
    host: true,
    port: 8080,
  },
});
