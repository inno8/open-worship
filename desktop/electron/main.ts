import { app, BrowserWindow, screen, ipcMain } from 'electron'
import path from 'path'

// Keep a global reference of windows
let mainWindow: BrowserWindow | null = null
let presentationWindow: BrowserWindow | null = null

const isDev = process.env.NODE_ENV === 'development'

function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1000,
    minHeight: 700,
    title: 'Open Worship',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
    },
  })

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173')
    mainWindow.webContents.openDevTools()
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'))
  }

  mainWindow.on('closed', () => {
    mainWindow = null
    // Close presentation window when main window closes
    if (presentationWindow) {
      presentationWindow.close()
    }
  })
}

function createPresentationWindow(displayId?: number) {
  const displays = screen.getAllDisplays()
  
  // Find the target display
  let targetDisplay = displays.find(d => d.id === displayId)
  
  // If no specific display, try to find an external display
  if (!targetDisplay) {
    const primaryDisplay = screen.getPrimaryDisplay()
    targetDisplay = displays.find(d => d.id !== primaryDisplay.id) || primaryDisplay
  }

  const { x, y, width, height } = targetDisplay.bounds

  presentationWindow = new BrowserWindow({
    x,
    y,
    width,
    height,
    frame: false,
    fullscreen: true,
    alwaysOnTop: true,
    skipTaskbar: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
    },
  })

  if (isDev) {
    presentationWindow.loadURL('http://localhost:5173/#/presentation')
  } else {
    presentationWindow.loadFile(path.join(__dirname, '../dist/index.html'), {
      hash: '/presentation',
    })
  }

  presentationWindow.on('closed', () => {
    presentationWindow = null
  })

  return presentationWindow
}

// IPC Handlers

// Get available displays
ipcMain.handle('get-displays', () => {
  const displays = screen.getAllDisplays()
  const primary = screen.getPrimaryDisplay()
  
  return displays.map(display => ({
    id: display.id,
    label: display.label || `Display ${display.id}`,
    width: display.bounds.width,
    height: display.bounds.height,
    isPrimary: display.id === primary.id,
  }))
})

// Open presentation on specific display
ipcMain.handle('open-presentation', (_event, displayId?: number) => {
  if (presentationWindow) {
    presentationWindow.focus()
    return { success: true, alreadyOpen: true }
  }
  
  createPresentationWindow(displayId)
  return { success: true, alreadyOpen: false }
})

// Close presentation window
ipcMain.handle('close-presentation', () => {
  if (presentationWindow) {
    presentationWindow.close()
    return { success: true }
  }
  return { success: false, reason: 'No presentation window open' }
})

// Send slide data to presentation window
ipcMain.handle('update-presentation', (_event, slideData: any) => {
  if (presentationWindow) {
    presentationWindow.webContents.send('slide-update', slideData)
    return { success: true }
  }
  return { success: false, reason: 'No presentation window open' }
})

// Check if presentation is open
ipcMain.handle('is-presentation-open', () => {
  return presentationWindow !== null
})

// App lifecycle
app.whenReady().then(createMainWindow)

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  if (mainWindow === null) {
    createMainWindow()
  }
})
