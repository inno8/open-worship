import { app, BrowserWindow, screen, ipcMain, protocol, net, dialog, nativeImage } from 'electron'
import path from 'path'
import fs from 'fs'
import { randomUUID } from 'crypto'
import { pathToFileURL } from 'url'
import * as db from './database'
import { getNdiOutput } from './ndi/NdiOutput'
import { autoUpdater } from 'electron-updater'

// Background dimensions
const BG_WIDTH_FULL = 1920
const BG_HEIGHT_FULL = 1080
const BG_HEIGHT_LOWER_THIRD = 360

// Configure auto-updater
autoUpdater.autoDownload = false // Don't download automatically, let user decide
autoUpdater.autoInstallOnAppQuit = true

// Backgrounds directory in user data
const backgroundsDir = path.join(app.getPath('userData'), 'backgrounds')

// Register custom protocol for serving background images (must be before app.whenReady)
protocol.registerSchemesAsPrivileged([{
  scheme: 'app-bg',
  privileges: { standard: true, secure: true, supportFetchAPI: true, corsEnabled: true }
}])

// Keep a global reference of windows
let mainWindow: BrowserWindow | null = null
let presentationWindow: BrowserWindow | null = null

const isDev = !app.isPackaged

function createMainWindow() {
  // Get icon path based on platform
  const iconPath = isDev 
    ? path.join(__dirname, '../public/assets/icons/icon.png')
    : path.join(__dirname, '../dist/assets/icons/icon.png')
  
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1000,
    minHeight: 700,
    title: 'Open Worship',
    icon: iconPath,
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

// ============ DISPLAY IPC HANDLERS ============

ipcMain.handle('get-displays', () => {
  const displays = screen.getAllDisplays()
  const primary = screen.getPrimaryDisplay()
  
  return displays.map(display => ({
    id: display.id,
    label: display.label || `Display ${display.id}`,
    size: { width: display.bounds.width, height: display.bounds.height },
    isPrimary: display.id === primary.id,
  }))
})

ipcMain.handle('open-presentation', (_event, displayId?: number) => {
  if (presentationWindow) {
    presentationWindow.focus()
    return { success: true, alreadyOpen: true }
  }
  
  createPresentationWindow(displayId)
  return { success: true, alreadyOpen: false }
})

ipcMain.handle('close-presentation', () => {
  if (presentationWindow) {
    presentationWindow.close()
    return { success: true }
  }
  return { success: false, reason: 'No presentation window open' }
})

ipcMain.handle('update-presentation', (_event, slideData: unknown) => {
  if (presentationWindow) {
    presentationWindow.webContents.send('slide-update', slideData)
    return { success: true }
  }
  return { success: false, reason: 'No presentation window open' }
})

ipcMain.handle('is-presentation-open', () => {
  return presentationWindow !== null
})

// ============ SONG IPC HANDLERS ============

ipcMain.handle('songs:getAll', () => {
  const songs = db.getAllSongs()
  // Parse tags JSON for each song
  return songs.map(song => ({
    ...song,
    tags: JSON.parse(song.tags || '[]'),
  }))
})

ipcMain.handle('songs:getById', (_event, id: string) => {
  const song = db.getSongById(id)
  if (song) {
    return { ...song, tags: JSON.parse(song.tags || '[]') }
  }
  return null
})

ipcMain.handle('songs:create', (_event, song: { id: string; title: string; author: string; lyrics: string; tags: string[]; defaultBackground?: string; createdAt: string; updatedAt: string }) => {
  const dbSong = { 
    ...song, 
    tags: JSON.stringify(song.tags),
    defaultBackground: song.defaultBackground || null,
  }
  const created = db.createSong(dbSong as db.Song)
  return { ...created, tags: song.tags }
})

ipcMain.handle('songs:update', (_event, id: string, updates: { title?: string; author?: string; lyrics?: string; tags?: string[] }) => {
  const dbUpdates: Record<string, unknown> = { ...updates }
  if (updates.tags) {
    dbUpdates.tags = JSON.stringify(updates.tags)
  }
  const updated = db.updateSong(id, dbUpdates as Partial<db.Song>)
  if (updated) {
    return { ...updated, tags: JSON.parse(updated.tags || '[]') }
  }
  return null
})

ipcMain.handle('songs:delete', (_event, id: string) => {
  return db.deleteSong(id)
})

// ============ SCHEDULE IPC HANDLERS ============

ipcMain.handle('schedules:getAll', () => {
  const schedules = db.getAllSchedules()
  return schedules.map(schedule => ({
    ...schedule,
    items: db.getScheduleItems(schedule.id).map(item => {
      if (item.songId) {
        const song = db.getSongById(item.songId)
        return {
          ...item,
          song: song ? { ...song, tags: JSON.parse(song.tags || '[]') } : null,
        }
      }
      return item
    }),
  }))
})

ipcMain.handle('schedules:getById', (_event, id: string) => {
  const schedule = db.getScheduleById(id)
  if (schedule) {
    const items = db.getScheduleItems(id).map(item => {
      if (item.songId) {
        const song = db.getSongById(item.songId)
        return {
          ...item,
          song: song ? { ...song, tags: JSON.parse(song.tags || '[]') } : null,
        }
      }
      return item
    })
    return { ...schedule, items }
  }
  return null
})

ipcMain.handle('schedules:create', (_event, schedule: { id: string; name: string; date: string; notes: string; createdAt: string; updatedAt: string }) => {
  return db.createSchedule(schedule)
})

ipcMain.handle('schedules:update', (_event, id: string, updates: Partial<db.Schedule>) => {
  return db.updateSchedule(id, updates)
})

ipcMain.handle('schedules:delete', (_event, id: string) => {
  return db.deleteSchedule(id)
})

// ============ SCHEDULE ITEMS IPC HANDLERS ============

ipcMain.handle('scheduleItems:add', (_event, item: db.ScheduleItem) => {
  return db.addScheduleItem(item)
})

ipcMain.handle('scheduleItems:update', (_event, id: string, updates: Partial<db.ScheduleItem>) => {
  return db.updateScheduleItem(id, updates)
})

ipcMain.handle('scheduleItems:delete', (_event, id: string) => {
  return db.deleteScheduleItem(id)
})

ipcMain.handle('scheduleItems:reorder', (_event, scheduleId: string, itemIds: string[]) => {
  db.reorderScheduleItems(scheduleId, itemIds)
  return true
})

// ============ BACKGROUND IPC HANDLERS ============

function ensureBackgroundsDir() {
  if (!fs.existsSync(backgroundsDir)) {
    fs.mkdirSync(backgroundsDir, { recursive: true })
  }
}

// ============ ANNOUNCEMENTS ============
ipcMain.handle('announcements:getAll', () => {
  return db.getAllAnnouncements()
})

ipcMain.handle('announcements:getByType', (_event, type: string) => {
  return db.getAnnouncementsByType(type)
})

ipcMain.handle('announcements:create', (_event, announcement: db.Announcement) => {
  return db.createAnnouncement(announcement)
})

ipcMain.handle('announcements:update', (_event, id: string, updates: Partial<db.Announcement>) => {
  return db.updateAnnouncement(id, updates)
})

ipcMain.handle('announcements:delete', (_event, id: string) => {
  return db.deleteAnnouncement(id)
})

ipcMain.handle('backgrounds:list', () => {
  ensureBackgroundsDir()
  return fs.readdirSync(backgroundsDir).filter(f => /\.(jpg|jpeg|png|webp)$/i.test(f))
})

ipcMain.handle('backgrounds:import', async () => {
  const result = await dialog.showOpenDialog({
    properties: ['openFile', 'multiSelections'],
    filters: [{ name: 'Images', extensions: ['jpg', 'jpeg', 'png', 'webp'] }]
  })
  if (result.canceled || result.filePaths.length === 0) return []

  ensureBackgroundsDir()
  console.log('[backgrounds:import] destination dir:', backgroundsDir)
  const imported: string[] = []
  
  for (const filePath of result.filePaths) {
    const uuid = randomUUID()
    const filename = `${uuid}.png` // Use PNG to preserve quality
    const filenameLower = `${uuid}_lower.png`
    const destPath = path.join(backgroundsDir, filename)
    const destPathLower = path.join(backgroundsDir, filenameLower)
    
    try {
      // Load image using nativeImage
      const img = nativeImage.createFromPath(filePath)
      if (img.isEmpty()) {
        console.error('[backgrounds:import] failed to load:', filePath)
        continue
      }
      
      const srcSize = img.getSize()
      const aspectRatio = srcSize.width / srcSize.height
      console.log('[backgrounds:import] source:', path.basename(filePath), `${srcSize.width}x${srcSize.height}`, `aspect: ${aspectRatio.toFixed(2)}`)
      
      // Detect if this is a lower-third sized image (wide banner, height < 500px or aspect ratio > 4:1)
      const isLowerThirdSized = srcSize.height < 500 || aspectRatio > 4
      
      if (isLowerThirdSized) {
        // This is already a lower-third/banner image - resize directly to both sizes
        console.log('[backgrounds:import] detected lower-third sized image')
        
        // For full size: scale to fit width, center vertically on black background
        // Create a 1920x1080 canvas with the banner centered at bottom
        const scaledBanner = img.resize({ 
          width: BG_WIDTH_FULL, 
          height: BG_HEIGHT_LOWER_THIRD,
          quality: 'best'
        })
        
        // For full-size version, we'll just use the scaled banner (user sees it in settings)
        // The NDI full mode isn't commonly used with lower-third banners anyway
        fs.writeFileSync(destPath, scaledBanner.toPNG())
        
        // For lower-third: resize to exactly 1920x360
        const lowerImg = img.resize({ 
          width: BG_WIDTH_FULL, 
          height: BG_HEIGHT_LOWER_THIRD,
          quality: 'best'
        })
        fs.writeFileSync(destPathLower, lowerImg.toPNG())
        
      } else {
        // This is a full-size image - use crop logic
        
        // Resize to full size (1920x1080)
        const fullImg = img.resize({ 
          width: BG_WIDTH_FULL, 
          height: BG_HEIGHT_FULL,
          quality: 'best'
        })
        fs.writeFileSync(destPath, fullImg.toPNG())
        
        // For lower-third: crop from the bottom of the full-size image
        const lowerImg = fullImg.crop({
          x: 0,
          y: BG_HEIGHT_FULL - BG_HEIGHT_LOWER_THIRD, // Start 720px from top (bottom 360px)
          width: BG_WIDTH_FULL,
          height: BG_HEIGHT_LOWER_THIRD
        })
        fs.writeFileSync(destPathLower, lowerImg.toPNG())
      }
      
      if (fs.existsSync(destPath) && fs.existsSync(destPathLower)) {
        imported.push(filename)
        console.log('[backgrounds:import] created:', filename, 'and', filenameLower)
      } else {
        console.error('[backgrounds:import] processing succeeded but file(s) missing')
      }
    } catch (err) {
      console.error('[backgrounds:import] processing failed:', filePath, err)
    }
  }
  return imported
})

ipcMain.handle('backgrounds:remove', (_event, filename: string) => {
  const safeName = path.basename(filename)
  const filePath = path.join(backgroundsDir, safeName)
  
  // Also remove the lower-third version if it exists
  const baseName = safeName.replace(/\.(jpg|jpeg|png|webp)$/i, '')
  const lowerPathPng = path.join(backgroundsDir, `${baseName}_lower.png`)
  const lowerPathJpg = path.join(backgroundsDir, `${baseName}_lower.jpg`)
  
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath)
  }
  if (fs.existsSync(lowerPathPng)) {
    fs.unlinkSync(lowerPathPng)
  }
  if (fs.existsSync(lowerPathJpg)) {
    fs.unlinkSync(lowerPathJpg)
  }
  return true
})

// ============ NDI IPC HANDLERS ============

ipcMain.handle('ndi:getStatus', () => {
  return getNdiOutput().getStatus()
})

ipcMain.handle('ndi:start', async (_event, sourceName?: string) => {
  const ndi = getNdiOutput()
  if (sourceName) ndi.setSourceName(sourceName)
  const success = await ndi.start()
  const status = ndi.getStatus()
  return { success, status }
})

ipcMain.handle('ndi:stop', () => {
  getNdiOutput().stop()
  return { success: true }
})

ipcMain.handle('ndi:sendFrame', (_event, frameData: { data: Uint8Array; width: number; height: number }) => {
  const ndi = getNdiOutput()
  if (!ndi.isRunning) return { success: false, reason: 'NDI not running' }

  ndi.sendFrame({
    data: Buffer.from(frameData.data.buffer, frameData.data.byteOffset, frameData.data.byteLength),
    width: frameData.width,
    height: frameData.height,
  })
  return { success: true }
})

ipcMain.handle('ndi:setSourceName', (_event, name: string) => {
  getNdiOutput().setSourceName(name)
  return { success: true }
})

// ============ API PROXY (CORS bypass) ============

ipcMain.handle('api:fetch', async (_event, options: { url: string; method?: string; headers?: Record<string, string>; body?: string }) => {
  try {
    const { url, method = 'GET', headers = {}, body } = options
    
    const response = await net.fetch(url, {
      method,
      headers,
      body: body || undefined,
    })

    const responseText = await response.text()
    
    // Try to parse as JSON
    let data: unknown
    try {
      data = JSON.parse(responseText)
    } catch {
      data = responseText
    }

    return {
      ok: response.ok,
      status: response.status,
      statusText: response.statusText,
      data,
    }
  } catch (error) {
    return {
      ok: false,
      status: 0,
      statusText: error instanceof Error ? error.message : 'Unknown error',
      data: null,
    }
  }
})

// ============ WINDOW FOCUS ============

ipcMain.handle('window:focus', () => {
  if (mainWindow) {
    if (mainWindow.isMinimized()) mainWindow.restore()
    mainWindow.focus()
    return true
  }
  return false
})

// ============ APP LIFECYCLE ============

app.whenReady().then(() => {
  // Register protocol handler for background images
  // URL format in renderer: url(app-bg:///filename) → request.url can be app-bg:///filename or app-bg://host/path
  protocol.handle('app-bg', (request) => {
    const url = new URL(request.url)
    console.log('[app-bg] request.url:', request.url, '| pathname:', url.pathname, '| hostname:', url.hostname)
    const pathnamePart = decodeURIComponent(url.pathname || '').replace(/^\/+/, '').replace(/\/+$/, '').trim()
    const hostPart = decodeURIComponent(url.hostname || '').trim()
    const filenameRaw = pathnamePart || hostPart || ''
    const safeName = path.basename(filenameRaw) || path.basename(pathnamePart) || path.basename(hostPart)
    const filePath = path.join(backgroundsDir, safeName)
    console.log('[app-bg] resolved filename:', safeName, '→', filePath)
    return net.fetch(pathToFileURL(filePath).toString())
  })

  // Initialize database
  db.initDatabase()
  ensureBackgroundsDir()

  createMainWindow()

  // Check for updates (only in production)
  if (!isDev) {
    autoUpdater.checkForUpdates().catch(err => {
      console.log('Auto-update check failed:', err.message)
    })
  }
})

// ============ AUTO-UPDATER ============

autoUpdater.on('checking-for-update', () => {
  console.log('Checking for update...')
})

autoUpdater.on('update-available', (info) => {
  console.log('Update available:', info.version)
  if (mainWindow) {
    mainWindow.webContents.send('update-available', {
      version: info.version,
      releaseNotes: info.releaseNotes,
      releaseDate: info.releaseDate,
    })
  }
})

autoUpdater.on('update-not-available', () => {
  console.log('Update not available - running latest version')
})

autoUpdater.on('download-progress', (progress) => {
  if (mainWindow) {
    mainWindow.webContents.send('update-download-progress', {
      percent: progress.percent,
      transferred: progress.transferred,
      total: progress.total,
    })
  }
})

autoUpdater.on('update-downloaded', (info) => {
  console.log('Update downloaded:', info.version)
  if (mainWindow) {
    mainWindow.webContents.send('update-downloaded', {
      version: info.version,
    })
  }
})

autoUpdater.on('error', (err) => {
  console.error('Auto-updater error:', err.message)
})

ipcMain.handle('check-for-updates', async () => {
  console.log('IPC: check-for-updates called')
  console.log('app.isPackaged:', app.isPackaged)
  
  if (!app.isPackaged) {
    return { success: false, error: 'Auto-update not available in development mode. Install the app to use updates.' }
  }
  
  try {
    const result = await autoUpdater.checkForUpdates()
    console.log('Update check result:', JSON.stringify(result?.updateInfo))
    return { success: true, updateInfo: result?.updateInfo }
  } catch (err) {
    console.error('Update check error:', err)
    const errorMsg = err instanceof Error ? err.message : 'Unknown error'
    return { success: false, error: errorMsg }
  }
})

ipcMain.handle('download-update', async () => {
  try {
    await autoUpdater.downloadUpdate()
    return { success: true }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' }
  }
})

ipcMain.handle('install-update', () => {
  autoUpdater.quitAndInstall(false, true)
})

app.on('window-all-closed', () => {
  getNdiOutput().stop()
  db.closeDatabase()
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  if (mainWindow === null) {
    createMainWindow()
  }
})
