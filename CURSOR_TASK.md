# Task: Fix NDI Output and Background Issues

## Issues to Fix

### 1. NDI Text Resize Issue
When the NDI output is scaled in OBS, the text doesn't resize properly.

**Root cause:** We're probably sending text as rendered pixels at a fixed resolution. When OBS scales the source, it stretches the pixels.

**Fix:** Render at a higher base resolution (1920x1080) and ensure the text is rendered at proper scale within that frame.

### 2. Background Not Sent to NDI
The NDI output only shows lyrics text, not the background image.

**Fix:** The frame capture (NdiFrameRenderer.ts or useNdiOutput.ts) needs to:
1. First draw the background image on the canvas
2. Then draw the lyrics text on top
3. Send the combined frame to NDI

Currently it's probably only capturing text on transparent background.

### 3. Background Import Shows "Imported" But Image Not Visible
User imports a background in Settings, gets success message, but image doesn't appear in the grid.

**Possible causes:**
- File copy fails silently
- Thumbnail generation fails
- State not updating after import
- Path resolution issue

**Fix:** Debug the addBackgrounds flow in presentationStore and the IPC handler.

## Files to Check/Modify

### For NDI issues (1 & 2):
- `desktop/src/ndi/NdiFrameRenderer.ts` — frame capture logic
- `desktop/src/ndi/useNdiOutput.ts` — hook that coordinates capture
- `desktop/src/views/Presenter.tsx` — where live presentation happens

### For background import (3):
- `desktop/src/views/Settings.tsx` — import UI
- `desktop/src/stores/presentationStore.ts` — addBackgrounds action
- `desktop/electron/main.ts` — IPC handler for backgrounds:import

## Expected Behavior

1. **NDI in OBS:** Full 1920x1080 frame with background + lyrics, scales cleanly
2. **Background in NDI:** Same background visible in app should appear in NDI feed
3. **Background import:** After clicking "Add Background" and selecting image, it should appear in the grid immediately

## Acceptance Criteria
- [ ] NDI output includes background image (not just text)
- [ ] Text remains crisp when OBS scales the NDI source
- [ ] Imported backgrounds appear in Settings grid immediately
- [ ] Backgrounds persist after app restart
