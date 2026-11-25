# Deploy to Railway (Railpack)

The repo is ready for Railway's default builder, **Railpack**. No Dockerfile is needed.

| File | Purpose |
|---|---|
| `railpack.json` | Pins Node 22 and sets runtime variables (`TZ=America/New_York`, `LANG`). |
| `Caddyfile` | Custom Caddy config that Railpack uses instead of its default SPA template. It adds SPA fallback, `/health`, gzip/zstd, long-term caching for `/assets/*`, `no-cache` for HTML, security headers (CSP, HSTS, X-Frame-Options…) and `noindex` (private demo). |
| `.dockerignore` | Keeps the build context small (no `node_modules`, `dist`, screenshots, archives). |
| `package.json → engines` | Node range for local and CI use. |

What Railpack does (checked with `railpack info` v0.43):

```
↳ Detected Node · npm · Deploying as vite static site · Output directory: dist
↳ Using custom Caddyfile: Caddyfile
install  $ npm install
build    $ npm run build
deploy   $ caddy run --config /Caddyfile --adapter caddyfile
```

The app is served as static files by Caddy on `$PORT`. There is no Node process at runtime.

## Option A: from GitHub (recommended)

1. Push the repo to a **private** GitHub repository.
2. In Railway: **New Project → Deploy from GitHub repo** and pick the repo. Railway detects Railpack automatically.
3. In the service, open **Settings → Deploy → Healthcheck Path** and set it to `/health`.
4. In **Settings → Networking**, click **Generate Domain** (or add a custom domain).
5. Every push to the default branch redeploys.

### Deploying a branch other than `main`

Railway deploys one branch per service. To publish a work branch (for example `estilo-windows`):

1. Push the branch to GitHub (GitHub Desktop: switch to the branch → **Publish branch** / **Push origin**).
2. In the Railway service: **Settings → Source → Branch** and pick the branch. Railway rebuilds right away and on every push to that branch.
3. To keep `main` online at the same time, create a second service from the same repo (or a second **Environment**) and point it to the other branch.

## Option B: from your computer, without GitHub

```bash
npm i -g @railway/cli
railway login
railway init        # create a project (or: railway link)
railway up          # uploads this folder AS IT IS NOW (the checked-out branch) and builds it with Railpack
railway domain      # generate a public URL
```

Then set the Healthcheck Path to `/health`, as in step 3 of Option A.

## Environment variables

None are required in phase 1 (mock data only). `PORT` is injected by Railway.

| Variable | Required | What it does |
|---|---|---|
| `GROQ_API_KEY` | No | Turns on the **live AI** (assistant + "Suggest a reply" in WhatsApp/SMS/Email). Without it the AI uses the demo answers. |

### Live AI (free) — Groq

1. Create a free account at console.groq.com (no card needed) → **API Keys** → **Create API key**.
2. Railway → service → **Variables** → **New variable** `GROQ_API_KEY` = the key → **Deploy**. No rebuild needed: Caddy reads it at runtime.
3. Check: `https://<your-domain>/api/ai/status` returns `{"live":true,...}`, and the assistant shows the green "Live AI" badge.

How it works: the browser only ever calls `/api/ai/*` on its own domain. Caddy (`Caddyfile`) answers `/api/ai/status` and forwards `POST /api/ai/chat` to Groq's OpenAI-compatible API, adding the key. The key never reaches the browser, and the CSP stays `connect-src 'self'`. Requests without the app's `X-Requested-With` header are refused, so other sites can't use the proxy from a browser, but the URL is public: if the free quota runs out (Groq free tier: about 1,000 requests or 200K tokens a day), the AI shows the demo answers until it resets. No charge is possible on a free account with no card.

The model is `openai/gpt-oss-120b`; when it hits its free rate limit the app retries once with `openai/gpt-oss-20b` (separate quota). To change them, set `VITE_AI_MODEL` / `VITE_AI_FALLBACK_MODEL` (build time) to other Groq model ids. Any OpenAI-compatible provider works the same way: change the `reverse_proxy` target and path in `Caddyfile`.

Locally: put `GROQ_API_KEY=...` in `.env.local` (git-ignored, no `VITE_` prefix so it stays out of the bundle) and run `npm run dev`; `vite.config.js` serves the same `/api/ai/*` routes.

When the backend is connected later, add the `VITE_*` variables in Railway. Vite reads them **at build time**, so redeploy after changing them.
Also add the API/Supabase origins to `connect-src` (and to `img-src` for storage) in the `Content-Security-Policy` line of `Caddyfile`.

## PWA

The build outputs `sw.js`, `workbox-*.js` and `manifest.webmanifest` in `dist/`. The `Caddyfile` already serves them correctly (`no-cache`, manifest MIME type, CSP `worker-src`/`manifest-src`). After each deploy, open tabs and installed apps show "New version available → Reload". Installing requires HTTPS, which the Railway domain provides.

## Notes

- `railway.json` / `railway.toml` (Config as Code) is deprecated on Railway and new services can't opt into it, so this repo doesn't include one. The healthcheck is set in the dashboard. If you want file-based infra later, use Railway's Infrastructure as Code (`railway config init`).
- To test the production server locally: `npm run build`, then `PORT=8080 caddy run --config Caddyfile --adapter caddyfile` after replacing `{{.DIST_DIR}}` with `dist`. Or simply use `npm run preview`.
