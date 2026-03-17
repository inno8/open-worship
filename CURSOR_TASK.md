# Task: Settings - API Token & Endpoint Configuration

## GitHub Issues
- #20 - Settings: API endpoint configuration
- #22 - Settings: API token configuration with warning

## Overview
Add a new "API Integration" section in Settings.tsx for external sync configuration.

## Requirements

### 1. API Token Field (#22)
- Add a password/text field to paste and save an API token
- Add a "Show/Hide" toggle for the token (password field behavior)
- When user tries to **edit or clear** an existing token, show a warning dialog:
  > "This token connects Open Worship with an external app where songs and schedules are synced. Are you sure you want to change/remove it?"
- Token should be stored in the syncStore (persisted via zustand persist)

### 2. API Endpoint Fields (#20)
Add the following fields:
- **API Base URL** - Text input for the root URL (e.g., `https://api.example.com`)
- **Song Retrieval Endpoint** - Text input for endpoint path (e.g., `/api/songs`)
- **Schedule Retrieval Endpoint** - Text input for endpoint path (e.g., `/api/schedules`)
- **Heartbeat Endpoint** - Text input for endpoint path (e.g., `/api/heartbeat`)
- **Heartbeat Interval** - Number input in minutes with default of 60 (1 hour)

### 3. Store Updates
Update `syncStore.ts` to add:
```typescript
// New fields
apiToken: string
apiBaseUrl: string
songEndpoint: string
scheduleEndpoint: string
heartbeatEndpoint: string
heartbeatIntervalMinutes: number // default: 60

// New setters
setApiToken: (token: string) => void
setApiBaseUrl: (url: string) => void
setSongEndpoint: (endpoint: string) => void
setScheduleEndpoint: (endpoint: string) => void
setHeartbeatEndpoint: (endpoint: string) => void
setHeartbeatIntervalMinutes: (minutes: number) => void
```

### 4. UI Placement
Add a new section in Settings.tsx called "API Integration" — place it **after** "Backend Sync" section and **before** "Display" section.

Use the same styling patterns already in Settings.tsx:
- Section card with `backgroundColor: '#16213e'`
- `sectionTitleStyle` for headers
- `inputStyle` for inputs
- `labelStyle` for labels
- Group related fields together

### 5. Warning Dialog
Create a confirmation modal (similar to the existing "Clear All Data?" modal) that:
- Shows when user tries to modify an existing token
- Has "Cancel" and "Continue" buttons
- Only shows if a token was previously saved (not on first save)

## Files to Modify
1. `desktop/src/stores/syncStore.ts` - Add new state fields
2. `desktop/src/views/Settings.tsx` - Add new UI section

## Acceptance Criteria
- [ ] All fields present in settings under "API Integration" section
- [ ] Token field with show/hide toggle
- [ ] Warning dialog when editing/clearing existing token
- [ ] Default heartbeat interval of 60 minutes
- [ ] All settings persist across app restarts (zustand persist)
- [ ] Clear labels explaining each field's purpose
- [ ] Consistent styling with existing settings UI
