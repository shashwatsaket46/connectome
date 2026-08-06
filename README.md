# Welcome to your Lovable project

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Open your project in the [Lovable editor](https://lovable.dev) and keep building.

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: connect the project to GitHub and every change made in Lovable is committed straight to your repository.
- **Full ownership**: this code is yours. Push to your repository and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```

## Built with

- TanStack Start
- TypeScript
- React
- Tailwind CSS

## Deploying to Vercel

1. Push the code to GitHub and import the repo in Vercel.
2. Build settings:
   - Install command: `npm install` (or `bun install`)
   - Build command: `npm run build`
   - Output: leave as detected (Nitro handles it)
3. Environment variables (Project → Settings → Environment Variables):
   - `NITRO_PRESET=vercel` — required. The default build target is Cloudflare;
     without this the Vercel deploy has no working server handler and every
     `/api/public/experiment/*` request fails, which is what shows up as
     "failed to load" on experiment pages.
   - `ASSET_BASE_URL=https://project--3b47e950-dbff-4681-a4b3-0e3c66cfc349.lovable.app`
     (optional) — the experiment HTML bundles (16–39 MB each) live on Lovable's
     asset CDN under `/__l5e/...`. That path does not exist on Vercel, so the
     proxy in `src/routes/api/public/experiment.$id.ts` falls back to this
     absolute base. A default is already baked in; set the variable only to
     point at a different host.
4. Redeploy. Experiment pages load through `/api/public/experiment/<id>`, which
   re-serves each bundle as interactive HTML.

If you'd rather host the bundles yourself, upload the four HTML files to any
static host (or Vercel Blob / S3) and paste the full `https://…` URLs into the
**Manage** page — custom URLs bypass the proxy entirely.
