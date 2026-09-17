# PvZ: Garden Warfare 2D — split layout

This repo now has three sibling folders instead of one client project with a
`server/` folder nested inside it:

```
pvzgw-2d/
├── client/    Vite + React app  → deploy to Vercel
├── server/    Node + socket.io  → deploy to Oracle (or anywhere else)
└── shared/    Game logic + types used by BOTH — deployed with neither on its own
```

## Why a `shared/` folder, not two copies

`engine.ts` (Player/TargetDummy classes) and `simulation.ts` (the tick-by-tick
projectile/chili-bean/collision stepping) are DOM-free on purpose — the
comments in your own code already call this out (`Runs identically on the
server tick loop; never touches canvas/Audio/Image`). That's what makes
client-side prediction and the server's authoritative simulation stay in
sync: they're *the same code*, not two hand-kept-in-sync copies. If you
duplicated these files into `client/` and `server/` separately, every future
gameplay tweak would need to be made twice and would eventually drift and
cause client/server mispredictions. So `shared/` holds:

- `shared/src/types/game.ts` — `Team`, `ClassConfig`, `ChiliBean`, etc.
- `shared/src/types/network.ts` — the socket message shapes (`ServerSnapshotMessage`, etc.)
- `shared/src/engine.ts` — `Player`, `TargetDummy`, collision helpers
- `shared/src/simulation.ts` — the room tick logic

Both `client/` and `server/` reach into it with a relative/aliased import —
`shared/` is never deployed by itself, it just needs to be present on disk
next to whichever half you're building.

## How the two ends actually stay independent

- **`client/`** has its own `package.json`/lockfile (react, vite, socket.io-client)
  and its own `tsconfig.json`. Its `vite.config.ts` aliases `@shared` to
  `../shared/src`, so an import like `import { Player } from '@shared/engine'`
  resolves at both dev-server and build time without `shared/` needing to be
  an installed npm package.
- **`server/`** has its own `package.json`/lockfile (socket.io, tsx, typescript)
  and imports the same files with a plain relative path
  (`../../shared/src/engine`) — no bundler involved server-side, so a bundler
  alias would need extra runtime wiring `tsx` doesn't need.

Neither folder imports anything from the other's `package.json` or `src/`.
`shared/` has no `package.json` of its own — it's just TypeScript source both
sides compile fresh.

## Deploying

**Client → Vercel**
- Import the repo, set **Root Directory** to `client`.
- Vercel still checks out the whole repository even with a Root Directory set,
  so the sibling `../shared` folder the alias points to is present at build
  time — you don't need npm workspaces for this to work.
- Set the environment variable `VITE_SERVER_URL` to your Oracle server's
  public URL (e.g. `https://your-oracle-ip:3001`) in the Vercel project
  settings — `client/src/utils/network.ts` already reads it.

**Server → Oracle Free Tier**
- `git clone` the whole repo onto the VM (again, so `shared/` is present),
  `cd server`, `npm install`, then `npm start` (runs `tsx src/index.ts`
  directly — no separate build step needed). Use `pm2` or a systemd unit to
  keep it running/restarting.
- Set `CLIENT_ORIGIN` to your Vercel URL and `PORT` if you don't want the
  default 3001, e.g. `CLIENT_ORIGIN=https://your-app.vercel.app PORT=3001 npm start`.
- If you'd rather ship compiled JS, `npm run build` still works, but note it
  emits to `dist/server/src/index.js` (not `dist/index.js`) because `rootDir`
  has to cover both `server/src` and `../shared/src` — see the comment in
  `server/tsconfig.json`.

## What else changed in the move (small cleanups, not behavior changes)

- `shared/src/types/network.ts`: `NetworkedDummy` used to be defined in the
  client's socket wrapper (`src/utils/network.ts`) and imported *back* into
  the shared type file — backwards, and awkward once the server needed it
  too. It's now defined directly in `shared/src/types/network.ts`.
- `NetworkedPlayerState` was missing an `isDead` field that `server/src/room.ts`
  was already sending in every snapshot. Added it — this was a latent type
  error your server's `tsc` would have flagged the first time anyone ran it
  instead of just executing through `tsx`.
- `client/src/utils/network.ts` no longer declares `NetworkedDummy`/
  `ClientSwitchClassMessage` — they weren't referenced anywhere in the client
  and duplicated what's now in `shared/`.
- The old root `tsconfig.json`'s `"include": ["src", "server/src/room.ts"]`
  is gone — each project now type-checks only its own files.

Everything else — game balance, sprites, sounds, network protocol, the actual
simulation — is byte-for-byte what you already had.

## One thing you still need to do

The actual binary assets (`src/assets/` — sprites, `.wav` files, fonts)
weren't part of what you sent me, so `client/src/assets/` currently only has
a placeholder note. Copy your real `assets/` folder in there before running
`npm run dev` / `npm run build` in `client/`.
# pvzgw-2d
