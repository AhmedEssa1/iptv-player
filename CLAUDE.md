# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # Start dev server (Next.js, http://localhost:3000)
npm run build    # Production build
npm run start    # Start production server
```

No test runner is configured.

## Architecture

This is a **Next.js 15 / React 19** IPTV player app. The UI is RTL (Arabic). All app state lives in React hooks — no external state library.

### Data flow

```
useStore  ──┐
useChannels ├── page.tsx (orchestrator) ── components
usePlayer  ─┤
useStatusCheck ─┘
```

- **`useStore`** (`src/hooks/useStore.ts`): Manages persistence via `localStorage` (key `iptv-v3`). Owns `StoredData`: favorites, hidden channels, hidden sources, custom sources, credentials, and URL overrides for default sources. Default sources are defined in `src/lib/constants.ts`.

- **`useChannels`** (`src/hooks/useChannels.ts`): Loads channel lists from a selected source. Supports two modes:
  - **Standard M3U**: fetches via `/api/proxy`, parses with `parseM3U()`.
  - **Xtream Codes API**: detected when the source URL contains `/get.php?username={username}`. First loads categories, then streams per category via the Xtream player API.
  - Credentials template variables `{username}` / `{password}` in source URLs are replaced at fetch time.

- **`usePlayer`** (`src/hooks/usePlayer.ts`): Plays a channel. Uses `hls.js` for HLS streams (`.m3u8`, `.ts`), falls back to native `<video>` for other formats.

- **`useStatusCheck`** (`src/hooks/useStatusCheck.ts`): HEAD-checks channel URLs via `/api/check` to determine live/dead status.

### API routes

- **`/api/proxy`** — server-side fetch proxy to bypass CORS. Takes `?url=` param.
- **`/api/check`** — HEAD-checks a channel URL with a 6 s timeout. Returns `{ status: 'ok' | 'dead' | 'timeout' }`.

### Key files

| File | Purpose |
|---|---|
| `src/types/iptv.ts` | Core types: `Channel`, `M3USource`, `StoredData`, `ChStatus` |
| `src/lib/constants.ts` | `DEFAULT_SOURCES` list, `PAGE_SIZE` (80), `STORAGE_KEY` |
| `src/lib/parser.ts` | M3U playlist parser → `Channel[]` |
| `src/lib/player.ts` | HLS detection + `createHls()` helper |
| `src/lib/storage.ts` | `loadStored()` / `saveStored()` thin wrappers |

### Source management rules

- **Default sources** cannot be truly deleted — they are hidden by adding their `id` to `stored.hiddenSources`. `restoreDefaultSources` clears that list.
- **Custom sources** are stored in `stored.customSources` and are fully deletable.
- URL overrides for any source (default or custom) live in `stored.sourceUrlOverrides[id]`.
- Credentials are stored separately in `stored.credentials[id]`.

### Channel ID generation

Channel IDs are derived from `btoa(encodeURIComponent(url)).substring(0, 12)` with a suffix counter for collisions. IDs are stable only within a single playlist load.
