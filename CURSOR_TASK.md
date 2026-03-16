# Task: NDI Output for OBS Integration (#8)

## Context
Open Worship is a church presentation app (Electron + React + TypeScript). The desktop app at `desktop/` projects lyrics to a secondary display. Now we need NDI output so OBS can capture lyrics as an overlay for livestreams.

## What is NDI?
NDI (Network Device Interface) is a protocol for video-over-IP. OBS can receive NDI sources and layer them over camera feeds. We'll output lyrics with transparent background so they float over the video.

## Your Task
Implement NDI output for lyrics with alpha channel transparency.

## Requirements

### 1. Install NDI Bindings
```bash
cd desktop
npm install @grandio/ndi
```

If `@grandio/ndi` doesn't exist or has issues, check for alternatives:
- `grandiose` (popular NDI bindings)
- `ndi-electron` 
- Or search npm for current NDI packages

### 2. NDI Output Manager
Create `desktop/src/ndi/NdiOutput.ts`:
- Initialize NDI sender with configurable source name
- Send frames with RGBA (alpha for transparency)
- Match output resolution to presentation window or configurable size
- Start/stop methods

### 3. Capture Presentation Content
When presentation is live:
- Capture the lyrics render as image data (canvas or offscreen render)
- Convert to RGBA buffer with transparent background
- Send frame to NDI at ~30fps

### 4. Settings Integration
Add to Settings view (in the "Output" section):
- Toggle: "Enable NDI Output"
- Text input: "NDI Source Name" (default: "Open Worship")
- Status indicator: Connected/Disconnected

### 5. Store Updates
Add to `presentationStore.ts`:
```typescript
ndiEnabled: boolean
ndiSourceName: string
setNdiEnabled: (enabled: boolean) => void
setNdiSourceName: (name: string) => void
```

Persist these in the store's localStorage.

## Technical Notes

### NDI Frame Format
NDI expects frames in specific formats. Typical setup:
```typescript
// Pseudocode
const sender = new NDI.Sender({ name: 'Open Worship' });

// Send frame (RGBA buffer, width, height)
sender.send({
  data: rgbaBuffer,
  width: 1920,
  height: 1080,
  fourCC: 'RGBA', // or 'BGRA' depending on library
  frameRate: [30, 1]
});
```

### Transparent Background
- Render lyrics on transparent canvas (not black)
- Alpha channel = 0 for transparent areas
- Alpha channel = 255 for text/visible elements
- OBS will key out the transparency automatically

### Frame Capture Approach
Option A: Offscreen canvas in renderer
- Create hidden canvas same size as output
- Render lyrics text + styling to canvas
- Get ImageData, extract RGBA buffer

Option B: Use Electron's `webContents.capturePage()`
- Capture the presentation window content
- Convert to raw RGBA

Option A is cleaner for our use case.

### Electron Main Process
NDI native bindings may need to run in main process. If so:
- Create IPC handlers for NDI start/stop/send
- Renderer sends frame data via IPC
- Main process handles NDI transmission

## Files to Create/Modify
- `desktop/src/ndi/NdiOutput.ts` — NDI manager class
- `desktop/electron/main.ts` — IPC handlers if needed
- `desktop/electron/preload.ts` — Expose NDI API
- `desktop/src/stores/presentationStore.ts` — NDI settings
- `desktop/src/views/Settings.tsx` — NDI toggle and config
- `desktop/src/views/Presenter.tsx` — Start NDI when live

## Acceptance Criteria
- [ ] NDI package installed and working
- [ ] Can enable/disable NDI in Settings
- [ ] Can configure NDI source name
- [ ] When GO LIVE, NDI starts sending frames
- [ ] Lyrics render with transparent background
- [ ] OBS can receive the NDI source
- [ ] Frame rate is smooth (~30fps)
- [ ] NDI stops when presentation stops

## Testing
1. Install OBS + NDI plugin (obs-ndi)
2. Start Open Worship, enable NDI in Settings
3. GO LIVE with a song
4. In OBS: Add Source → NDI Source → Select "Open Worship"
5. Should see lyrics floating with transparency

## Do NOT
- Don't add video background support via NDI (out of scope)
- Don't worry about multi-NDI outputs
- Don't block the UI while sending frames

## Commit Strategy
1. First commit: NDI package + basic sender setup
2. Second commit: Settings UI + store integration  
3. Third commit: Frame capture + live output
4. Fourth commit: Polish + error handling
