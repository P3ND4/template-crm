import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// PWA: installable (manifest + icons) and works offline after the first visit (Workbox precache).
// Updates are never forced: the app shows "New version available → Reload" (registerType: 'prompt').
const pwa = VitePWA({
  registerType: 'prompt',
  injectRegister: false, // registered from React (src/app/pwa.js) so the UI can show update / offline states
  includeAssets: ['favicon.svg', 'icons/apple-touch-icon.png', 'icons/favicon-32.png'],
  manifest: {
    id: '/',
    name: 'Template CRM',
    short_name: 'Template',
    description: 'Template CRM — clients, communications, projects, estimates and invoices.',
    lang: 'en',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    display_override: ['window-controls-overlay', 'standalone'],
    orientation: 'any',
    background_color: '#F3F3F3',
    theme_color: '#1F1F1F',
    categories: ['business', 'productivity'],
    icons: [
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/icons/maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
    shortcuts: [
      { name: 'New lead', url: '/crm/leads/new', icons: [{ src: '/icons/icon-192.png', sizes: '192x192' }] },
      { name: 'WhatsApp inbox', url: '/crm/communications/whatsapp', icons: [{ src: '/icons/icon-192.png', sizes: '192x192' }] },
      { name: 'Agenda', url: '/crm/agenda', icons: [{ src: '/icons/icon-192.png', sizes: '192x192' }] },
      { name: 'New estimate', url: '/finance/estimates/new', icons: [{ src: '/icons/icon-192.png', sizes: '192x192' }] },
    ],
    screenshots: [
      { src: '/screenshots/wide-dashboard.png', sizes: '1280x800', type: 'image/png', form_factor: 'wide', label: 'Dashboard' },
      { src: '/screenshots/narrow-whatsapp.png', sizes: '390x844', type: 'image/png', form_factor: 'narrow', label: 'WhatsApp inbox' },
    ],
  },
  workbox: {
    // App shell + every route chunk + Latin fonts. Other font subsets are cached the first time they're used.
    globPatterns: ['**/*.{js,css,html,svg,png,webmanifest}', 'assets/*-latin-*.woff2'],
    globIgnores: ['screenshots/**', 'splash/**'], // iOS reads launch screens itself; no need to precache them
    navigateFallback: '/index.html',
    navigateFallbackDenylist: [/^\/health$/, /^\/api\//],
    cleanupOutdatedCaches: true,
    maximumFileSizeToCacheInBytes: 3 * 1024 * 1024,
    runtimeCaching: [
      {
        urlPattern: ({ url, sameOrigin }) => sameOrigin && /\.(woff2?|png|jpg|webp)$/.test(url.pathname),
        handler: 'CacheFirst',
        options: { cacheName: 'static-extra', expiration: { maxEntries: 80, maxAgeSeconds: 60 * 60 * 24 * 365 } },
      },
    ],
  },
  devOptions: { enabled: false },
});

// Local dev: same /api/ai/* contract as the Caddyfile in production. Put GROQ_API_KEY in .env.local
// (no VITE_ prefix → it never reaches the browser bundle). Without it the AI features use the demo answers.
function aiDevProxy() {
  let key = '';
  const json = (res, status, body) => { res.statusCode = status; res.setHeader('Content-Type', 'application/json'); res.end(JSON.stringify(body)); };
  const middleware = async (req, res, next) => {
    if (!req.url.startsWith('/api/ai/')) return next();
    if (req.url.startsWith('/api/ai/status')) return json(res, 200, { live: Boolean(key) });
    if (!req.url.startsWith('/api/ai/chat') || req.method !== 'POST' || !key) return json(res, key ? 404 : 503, { error: 'ai_not_configured' });
    const chunks = [];
    for await (const c of req) chunks.push(c);
    try {
      const upstream = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` }, body: Buffer.concat(chunks),
      });
      res.statusCode = upstream.status;
      res.setHeader('Content-Type', upstream.headers.get('content-type') || 'application/json');
      res.end(Buffer.from(await upstream.arrayBuffer()));
    } catch (e) {
      json(res, 502, { error: String(e.message || e) });
    }
  };
  return {
    name: 'ai-dev-proxy',
    configResolved(config) { key = loadEnv(config.mode, config.root, '').GROQ_API_KEY || ''; },
    configureServer(server) { server.middlewares.use(middleware); },
    configurePreviewServer(server) { server.middlewares.use(middleware); },
  };
}

export default defineConfig({
  plugins: [react(), pwa, aiDevProxy()],
  server: { port: 5173 },
  preview: { port: 4173 },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          react: ['react', 'react-dom', 'react-router-dom'],
          charts: ['recharts'],
        },
      },
    },
  },
});
