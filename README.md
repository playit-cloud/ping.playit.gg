# ping.playit.gg

Code behind ping.playit.gg. This webpage tests latency against the playit.gg Anycast tunneling network.

## Local SPA development

To run the frontend by itself during normal UI work:

```bash
git clone git@github.com:playit-cloud/ping.playit.gg.git
cd ping.playit.gg
npm i
npm run dev
```

## Cloudflare Worker sharing

This project now follows Cloudflare's recommended SPA pattern:

- Vite builds the frontend into `dist/`
- one Cloudflare Worker serves the SPA assets and the share API
- React Router handles the SPA routes for `/` and `/shared/:shareId`
- shared latency snapshots are stored in an R2 bucket

## Frontend structure

Frontend source now uses a flat top-level layout under `src/`:

- `api/` for browser-side API clients and ping helpers
- `components/` for reusable UI building blocks
- `pages/` for route-level page components
- `shared/` for shared hooks, route config, types, and data

Vite and TypeScript are configured with the `@/` alias so frontend imports can reference `src/` with absolute paths.

### Important files

- `wrangler.toml`
- `worker/index.ts`
- `.dev.vars.example`

### Placeholder Cloudflare values

Before deploying, replace the placeholder R2 settings in `wrangler.toml`:

- `binding = "SHARE_RESULTS_BUCKET"`
- `bucket_name = "ping-playit-gg-results-placeholder"`

The example Worker env file documents the same placeholder values:

```env
SHARE_URL_BASE=http://127.0.0.1:8787
R2_BUCKET_BINDING=SHARE_RESULTS_BUCKET
R2_BUCKET_NAME=ping-playit-gg-results-placeholder
```

`SHARE_URL_BASE` is optional. Leave it unset in production if share links should use the incoming request origin automatically.

### Run the Worker locally

1. Install dependencies:

```bash
npm i
```

2. Build the SPA assets:

```bash
npm run build
```

3. Create local config files from the examples and fill in your real values:

- `.dev.vars`

4. Start the Worker dev server:

```bash
npm run cf:dev
```

The Worker serves the built SPA from `dist/`, including direct navigation to `/shared/:shareId`, and exposes:

- `POST /api/share`
- `GET /api/share/:shareId`

### Deploy

After updating the placeholder bucket names and creating the matching R2 bucket in Cloudflare:

```bash
npm run cf:deploy
```
