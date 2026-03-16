# Task: Splash Screen with Pre-checks (#15)

## Overview
Create a splash screen that shows when the app opens, runs pre-checks, then transitions to Presenter.

## Splash Screen Design
- Centered layout
- App logo (use a placeholder text logo for now: "Open Worship" in stylized text)
- App name below logo
- Loading spinner/progress indicator
- Status text showing current pre-check step
- Dark theme (#1a1a2e background)

## Pre-checks to Run
1. Initialize database (already done)
2. Enable NDI output
3. Load today's schedule (if exists)
4. Connect WebSocket to backend (if URL configured)
5. Any other startup tasks

## Implementation

### Create SplashScreen.tsx
```typescript
// desktop/src/views/SplashScreen.tsx
- Show logo + name + spinner
- Display status messages as checks run
- When complete, call onComplete callback
```

### Update App.tsx
```typescript
- Add 'splash' to view state
- Start with view = 'splash'
- SplashScreen runs pre-checks
- On complete, transition to 'presenter'
- Move startup logic from useEffect to SplashScreen
```

### Smooth Transition
- Fade out splash
- Fade in main app
- Use CSS transitions or simple opacity change

## Files to Create/Modify
- `desktop/src/views/SplashScreen.tsx` - New splash screen component
- `desktop/src/App.tsx` - Add splash view and startup flow

## Acceptance Criteria
- [ ] Splash screen shows on app launch
- [ ] Logo and app name displayed
- [ ] Loading indicator visible
- [ ] Status text updates during pre-checks
- [ ] NDI auto-enabled during splash
- [ ] Today's schedule auto-loaded
- [ ] Smooth transition to Presenter when done
- [ ] No flash of other views during startup
