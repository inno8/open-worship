import { useSyncStore } from '../stores/syncStore'
import { checkHeartbeat } from './apiSync'

let heartbeatInterval: NodeJS.Timeout | null = null
let lastIntervalMinutes: number | null = null

// Callback type for when new content is detected
type HeartbeatCallback = (hasNewSongs: boolean, hasNewSchedules: boolean) => void

let onNewContentCallback: HeartbeatCallback | null = null

// Set the callback for new content notifications
export function setHeartbeatCallback(callback: HeartbeatCallback | null) {
  onNewContentCallback = callback
}

// Check if heartbeat should run (API configured)
function shouldRunHeartbeat(): boolean {
  const state = useSyncStore.getState()
  return !!(state.apiToken && state.apiBaseUrl && state.heartbeatEndpoint)
}

// Perform a single heartbeat check
async function performHeartbeat() {
  if (!shouldRunHeartbeat()) {
    console.log('[Heartbeat] Skipping - API not configured')
    return
  }

  console.log('[Heartbeat] Checking for updates...')
  
  try {
    const result = await checkHeartbeat()
    
    if (result.success && result.data) {
      const { hasNewSongs, hasNewSchedules } = result.data
      
      if (hasNewSongs || hasNewSchedules) {
        console.log('[Heartbeat] New content detected:', { hasNewSongs, hasNewSchedules })
        
        // Trigger callback if set
        if (onNewContentCallback) {
          onNewContentCallback(hasNewSongs, hasNewSchedules)
        }
        
        // Show desktop notification
        showDesktopNotification(hasNewSongs, hasNewSchedules)
      } else {
        console.log('[Heartbeat] No new content')
      }
    } else {
      console.log('[Heartbeat] Check failed:', result.error)
    }
  } catch (error) {
    console.error('[Heartbeat] Error:', error)
  }
}

// Show desktop notification for new content
function showDesktopNotification(hasNewSongs: boolean, hasNewSchedules: boolean) {
  // Check if we're in Electron and have notification permission
  if (!('Notification' in window)) {
    console.log('[Heartbeat] Notifications not supported')
    return
  }

  // Request permission if needed
  if (Notification.permission === 'default') {
    Notification.requestPermission()
    return
  }

  if (Notification.permission !== 'granted') {
    console.log('[Heartbeat] Notification permission denied')
    return
  }

  // Build notification message
  let title = 'Open Worship'
  let body = ''
  
  if (hasNewSongs && hasNewSchedules) {
    body = 'New songs and schedules available'
  } else if (hasNewSongs) {
    body = 'New songs available - click Sync in Library to update'
  } else if (hasNewSchedules) {
    body = 'New schedule available - click Sync in Present to update'
  }

  if (!body) return

  // Create and show notification
  const notification = new Notification(title, {
    body,
    icon: undefined, // Could add app icon here when #19 is done
    silent: false,
  })

  // Focus app when notification is clicked
  notification.onclick = () => {
    if (window.electronAPI?.focusWindow) {
      window.electronAPI.focusWindow()
    } else {
      window.focus()
    }
    notification.close()
  }

  // Auto-close after 10 seconds
  setTimeout(() => notification.close(), 10000)
}

// Start the heartbeat service
export function startHeartbeat() {
  const state = useSyncStore.getState()
  const intervalMinutes = state.heartbeatIntervalMinutes || 60
  
  // Don't start if not configured
  if (!shouldRunHeartbeat()) {
    console.log('[Heartbeat] Not starting - API not configured')
    return
  }

  // If interval hasn't changed and already running, skip
  if (heartbeatInterval && lastIntervalMinutes === intervalMinutes) {
    console.log('[Heartbeat] Already running with same interval')
    return
  }

  // Stop existing interval if any
  stopHeartbeat()

  // Convert minutes to milliseconds
  const intervalMs = intervalMinutes * 60 * 1000

  console.log(`[Heartbeat] Starting with interval of ${intervalMinutes} minutes`)
  lastIntervalMinutes = intervalMinutes

  // Run immediately on start
  performHeartbeat()

  // Then run at interval
  heartbeatInterval = setInterval(performHeartbeat, intervalMs)
}

// Stop the heartbeat service
export function stopHeartbeat() {
  if (heartbeatInterval) {
    console.log('[Heartbeat] Stopping')
    clearInterval(heartbeatInterval)
    heartbeatInterval = null
    lastIntervalMinutes = null
  }
}

// Restart heartbeat (call when settings change)
export function restartHeartbeat() {
  console.log('[Heartbeat] Restarting...')
  stopHeartbeat()
  startHeartbeat()
}

// Check if heartbeat is currently running
export function isHeartbeatRunning(): boolean {
  return heartbeatInterval !== null
}

// Request notification permission (call on app start)
export function requestNotificationPermission() {
  if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission().then(permission => {
      console.log('[Heartbeat] Notification permission:', permission)
    })
  }
}
