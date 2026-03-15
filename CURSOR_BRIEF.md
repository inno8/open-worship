# Open Worship — Cursor Development Brief

## What We're Building

A **free, open-source church presentation software** — a better alternative to EasyWorship.

**Desktop app** (Electron + React + TypeScript) that displays worship song lyrics on screens/projectors with OBS/NDI integration.

## Current State

### ✅ Done
- **Backend** (Django + DRF + Channels): `backend/`
  - Songs API: CRUD, search, .txt import
  - Schedules API: CRUD, items, reorder
  - WebSocket hub at `/ws/sync/`
  - Run with: `cd backend && .\venv\Scripts\activate && daphne config.asgi:application`

- **Desktop scaffolding**: `desktop/`
  - Electron + React + Vite + TypeScript
  - Basic structure, stores (Zustand)
  - Run with: `cd desktop && npm run dev`

### 🔨 To Build (in order)

#### 1. Complete Electron Setup (Issue #2)
- Fix TypeScript compilation for Electron main/preload
- Test window creation works
- Verify hot reload in dev mode

#### 2. Song Library UI (Issue #3)
- Song list with search (left panel)
- Song detail/editor (right panel)
- Add/edit/delete songs
- Import from .txt files

#### 3. Schedule Builder UI (Issue #4)
- Create schedules
- Add songs from library
- Drag & drop reordering
- Save/load

#### 4. Live Presenter (Issue #5)
- Full-screen presentation window
- Control panel (preview, navigation)
- Keyboard shortcuts: Space (next), ← → (navigate), B (blank)
- Section jumping

#### 5. Multi-Display Output (Issue #6)
- Detect connected displays
- Project to selected display
- Separate control window from output

#### 6. OBS/NDI Integration (Issue #8)
- NDI output with alpha channel
- Configure NDI source name

## Tech Stack

| Layer | Tech |
|-------|------|
| Framework | Electron 36 |
| UI | React 19 + TypeScript |
| Styling | TailwindCSS 4 |
| State | Zustand |
| Build | Vite |
| Backend | Django 6 + DRF + Channels |

## Design Guidelines

**Theme:** Dark mode, church-friendly
- Primary BG: `#1a1a2e`
- Secondary BG: `#16213e`  
- Tertiary BG: `#0f3460`
- Accent: `#e94560`
- Text: White / `#a0aec0`

**UX Principles:**
1. **Dead simple** — Volunteers use it in minutes
2. **Big controls** — Works in dim lighting
3. **Keyboard-first** — Space, arrows, shortcuts
4. **Forgiving** — Undo everywhere

## File Structure

```
desktop/
├── electron/
│   ├── main.ts          # Main process
│   └── preload.ts       # Preload script
├── src/
│   ├── components/      # Reusable components
│   ├── views/           # Page views
│   ├── stores/          # Zustand stores
│   ├── App.tsx          # Main app
│   └── main.tsx         # Entry point
├── index.html
└── package.json
```

## API Endpoints (Backend)

```
GET    /api/songs/           # List songs
POST   /api/songs/           # Create song
GET    /api/songs/{id}/      # Get song
PUT    /api/songs/{id}/      # Update song
DELETE /api/songs/{id}/      # Delete song
GET    /api/songs/search/?q= # Search songs
POST   /api/songs/import_txt/ # Import from .txt

GET    /api/schedules/       # List schedules
POST   /api/schedules/       # Create schedule
GET    /api/schedules/{id}/  # Get schedule with items
POST   /api/schedules/{id}/add_item/    # Add item
POST   /api/schedules/{id}/reorder/     # Reorder items
DELETE /api/schedules/{id}/items/{item_id}/ # Remove item

WS     /ws/sync/             # Real-time sync
```

## Lyrics Format

```
[Verse 1]
Amazing grace how sweet the sound
That saved a wretch like me

[Chorus]
I once was lost but now I'm found
Was blind but now I see
```

## Commands

```bash
# Backend
cd backend
.\venv\Scripts\activate
daphne config.asgi:application  # Runs on :8000

# Desktop
cd desktop
npm run dev                      # Dev mode with hot reload
npm run build                    # Production build
```

## GitHub

- Repo: https://github.com/inno8/open-worship
- Issues: Track progress with `/pm github progress`

---

**Start with Issue #2 (Electron setup), then #3 (Library UI).**
