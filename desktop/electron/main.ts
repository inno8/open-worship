import { app, BrowserWindow, screen, ipcMain, protocol, net, dialog } from 'electron'
import path from 'path'
import fs from 'fs'
import { randomUUID } from 'crypto'
import { pathToFileURL } from 'url'
import * as db from './database'
import { getNdiOutput } from './ndi/NdiOutput'

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

ipcMain.handle('songs:create', (_event, song: { id: string; title: string; author: string; lyrics: string; tags: string[]; createdAt: string; updatedAt: string }) => {
  const dbSong = { ...song, tags: JSON.stringify(song.tags) }
  const created = db.createSong(dbSong)
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
  const imported: string[] = []
  for (const filePath of result.filePaths) {
    const ext = path.extname(filePath)
    const filename = `${randomUUID()}${ext}`
    fs.copyFileSync(filePath, path.join(backgroundsDir, filename))
    imported.push(filename)
  }
  return imported
})

ipcMain.handle('backgrounds:remove', (_event, filename: string) => {
  const safeName = path.basename(filename)
  const filePath = path.join(backgroundsDir, safeName)
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath)
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

// ============ APP LIFECYCLE ============

app.whenReady().then(() => {
  // Register protocol handler for background images
  protocol.handle('app-bg', (request) => {
    const url = new URL(request.url)
    const filename = decodeURIComponent(url.pathname).replace(/^\/+/, '')
    const safeName = path.basename(filename)
    const filePath = path.join(backgroundsDir, safeName)
    return net.fetch(pathToFileURL(filePath).toString())
  })

  // Initialize database
  db.initDatabase()
  ensureBackgroundsDir()

  createMainWindow()
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
