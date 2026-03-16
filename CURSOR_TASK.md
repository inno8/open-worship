# Task: Fix Remaining Issues

## Issue 1: NDI Text Not Readable When Scaled in OBS

The text in NDI output doesn't scale well. This is because we render at fixed 1920x1080 but the font size might be too small.

**Fix:** 
- Increase the base font size for NDI rendering (e.g., 96px instead of 64px)
- The NDI frame is fixed resolution - when OBS scales it, the pixels scale. We need larger text to begin with.

**File:** `desktop/src/ndi/NdiFrameRenderer.ts`
- In `parseFontSize()`, increase the default and minimum font sizes
- Consider scaling the font size up for NDI output (e.g., multiply by 1.5)

## Issue 2: Background Import Error

Error: `GET app-bg://e2103843-dffc-4384-91cc-321e6ad7df74.jpg/ net::ERR_UNEXPECTED`

Note the trailing slash `/` - that's wrong. The protocol handler isn't handling URLs properly.

**Fix in `desktop/electron/main.ts`:**
- In the `app-bg` protocol handler, strip trailing slashes from the path
- Handle edge cases in URL parsing

Look for `protocol.handle('app-bg'` and fix the path extraction.

## Issue 3: Default App Flow on Startup

When the app opens, it should:
1. **Auto-enable NDI** - Turn on NDI broadcasting automatically
2. **Default to Presenter view** - Not Library
3. **Auto-load active schedule** - If there's a schedule for today, load it

**Files to modify:**

### `desktop/src/App.tsx`
- Change default view from 'library' to 'presenter'
- On mount, call ndi:start if not already running

### `desktop/src/stores/presentationStore.ts`
- Set `ndiEnabled: true` as default (or auto-enable on first load)

### `desktop/src/views/Presenter.tsx` or `App.tsx`
- On mount, check for today's schedule and auto-load it
- Use the schedule store's `loadSchedules()` and find one matching today's date

## Acceptance Criteria
- [ ] NDI text is larger and readable when OBS scales the source
- [ ] Background import works without trailing slash error
- [ ] App starts with NDI enabled
- [ ] App opens to Presenter view by default
- [ ] Today's schedule (if any) is auto-loaded on startup
