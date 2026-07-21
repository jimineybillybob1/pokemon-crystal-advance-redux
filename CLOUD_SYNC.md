# Cloud save and sync

The guide encrypts saves in the browser with AES-GCM before sending them to a Cloudflare Worker. The Worker stores only the encrypted envelope in Workers KV. The private sync code is never uploaded.

## Components

- Frontend protocol: `app.js`
- Published endpoint setting: `sync-config.js`
- Worker: `sync-worker/src/index.js`
- Cloudflare configuration: `sync-worker/wrangler.jsonc`
- Worker contract tests: `sync-worker/test/worker.test.mjs`

The Worker accepts requests only from `https://jimineybillybob1.github.io`, validates save IDs and encrypted envelopes, limits request bodies to 64 KiB, rejects stale revisions and retains up to eight recovery versions for 400 days.

## Deploy

1. Use Node.js 22 or newer, run `npx wrangler@4.112.0 login`, and approve the Cloudflare authorization page.
2. Run `npm run sync:deploy` from the repository root. Wrangler automatically provisions or reuses the `SAVES` KV namespace declared without an ID.
3. Confirm the resulting `https://…workers.dev` URL matches the value in `sync-config.js` without a trailing slash.
4. Run `npm run sync:test`, then test `/health` with the production GitHub Pages origin.
5. Rebuild, validate, audit assets, review the Save & Sync screen locally, then commit and deploy the guide.

Official references:

- https://developers.cloudflare.com/workers/wrangler/configuration/
- https://developers.cloudflare.com/kv/get-started/

## Operational notes

- Treat the private sync code like a password: anyone with it can derive the storage key and decrypt the save.
- CORS limits browser access but is not authentication. Privacy comes from the unguessable code and client-side encryption.
- Workers KV is eventually consistent. The revision check prevents ordinary stale overwrites, but closely timed concurrent writes may briefly observe different replicas.
- Saves expire after 400 days without an upload. Uploading again refreshes the active save expiry.

## Production deployment

- Worker: `crystal-advance-redux-field-guide-sync`
- Endpoint: https://crystal-advance-redux-field-guide-sync.james-stewart1992.workers.dev
- KV namespace: `crystal-advance-redux-field-guide-sync-saves`
- Initial Worker version: `29efcd30-66a6-4f45-840a-4f98eb2d3679`
- First deployed: 2026-07-21
- Live contract test: passed health, write/read, stale-write rejection, recovery history and blocked-origin checks on 2026-07-21; disposable KV records were removed after testing.
