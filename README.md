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
2. Leave the framework preset as **Other** and the root directory as the repo root.
   `vercel.json` already pins `framework: null` plus the install/build commands, so
   Vercel will not try to serve a static `dist/` folder.
3. Vercel runs `npm run build:vercel` (`NITRO_PRESET=vercel vite build`), which makes
   Nitro emit `.vercel/output` (Build Output API): `static/` for the client assets and
   `functions/__server.func` for the SSR handler, with a catch-all route to it. If the
   build instead prints `dist/server/...`, the preset did not apply and every URL 404s.
   Override `NITRO_PRESET` if you deploy elsewhere.
4. Optional env var:
   - `ASSET_BASE_URL=https://project--3b47e950-dbff-4681-a4b3-0e3c66cfc349.lovable.app`
     — the experiment HTML bundles (16-39 MB each) live on Lovable's asset CDN under
     `/__l5e/...`. That path does not exist on Vercel, so the proxy in
     `src/routes/api/public/experiment.$id.ts` falls back to this absolute base.
     A default is already baked in; set the variable only to point at a different host.

If you'd rather host the bundles yourself, upload the HTML files to any static host
and paste the full `https://…` URLs into the **Manage** page — custom URLs bypass the
proxy entirely.
