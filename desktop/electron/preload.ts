import { contextBridge, ipcRenderer } from 'electron'

// Types for songs and schedules
interface Song {
  id: string
  title: string
  author: string
  lyrics: string
  tags: string[]
  createdAt: string
  updatedAt: string
}

interface ScheduleItem {
  id: string
  scheduleId: string
  order: number
  type: 'song' | 'blank' | 'custom'
  songId: string | null
  customTitle: string | null
  customText: string | null
  song?: Song | null
}

interface Schedule {
  id: string
  name: string
  date: string
  notes: string
  items: ScheduleItem[]
  createdAt: string
  updatedAt: string
}

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // Display management
  getDisplays: () => ipcRenderer.invoke('get-displays'),
  
  // Presentation window
  openPresentation: (displayId?: number) => ipcRenderer.invoke('open-presentation', displayId),
  closePresentation: () => ipcRenderer.invoke('close-presentation'),
  updatePresentation: (slideData: unknown) => ipcRenderer.invoke('update-presentation', slideData),
  isPresentationOpen: () => ipcRenderer.invoke('is-presentation-open'),
  
  // Listen for slide updates (in presentation window)
  onSlideUpdate: (callback: (data: unknown) => void) => {
    ipcRenderer.on('slide-update', (_event, data) => callback(data))
  },
  
  // Remove listener
  removeSlideUpdateListener: () => {
    ipcRenderer.removeAllListeners('slide-update')
  },

  // ============ SONGS ============
  songs: {
    getAll: () => ipcRenderer.invoke('songs:getAll'),
    getById: (id: string) => ipcRenderer.invoke('songs:getById', id),
    create: (song: Song) => ipcRenderer.invoke('songs:create', song),
    update: (id: string, updates: Partial<Song>) => ipcRenderer.invoke('songs:update', id, updates),
    delete: (id: string) => ipcRenderer.invoke('songs:delete', id),
  },

  // ============ SCHEDULES ============
  schedules: {
    getAll: () => ipcRenderer.invoke('schedules:getAll'),
    getById: (id: string) => ipcRenderer.invoke('schedules:getById', id),
    create: (schedule: Omit<Schedule, 'items'>) => ipcRenderer.invoke('schedules:create', schedule),
    update: (id: string, updates: Partial<Omit<Schedule, 'items'>>) => ipcRenderer.invoke('schedules:update', id, updates),
    delete: (id: string) => ipcRenderer.invoke('schedules:delete', id),
  },

  // ============ SCHEDULE ITEMS ============
  scheduleItems: {
    add: (item: Omit<ScheduleItem, 'song'>) => ipcRenderer.invoke('scheduleItems:add', item),
    update: (id: string, updates: Partial<Omit<ScheduleItem, 'song'>>) => ipcRenderer.invoke('scheduleItems:update', id, updates),
    delete: (id: string) => ipcRenderer.invoke('scheduleItems:delete', id),
    reorder: (scheduleId: string, itemIds: string[]) => ipcRenderer.invoke('scheduleItems:reorder', scheduleId, itemIds),
  },

  // ============ BACKGROUNDS ============
  backgrounds: {
    list: () => ipcRenderer.invoke('backgrounds:list') as Promise<string[]>,
    import: () => ipcRenderer.invoke('backgrounds:import') as Promise<string[]>,
    remove: (filename: string) => ipcRenderer.invoke('backgrounds:remove', filename) as Promise<boolean>,
  },

  // ============ NDI ============
  ndi: {
    getStatus: () => ipcRenderer.invoke('ndi:getStatus'),
    start: (sourceName?: string) => ipcRenderer.invoke('ndi:start', sourceName),
    stop: () => ipcRenderer.invoke('ndi:stop'),
    sendFrame: (frameData: { data: Uint8Array; width: number; height: number }) =>
      ipcRenderer.invoke('ndi:sendFrame', frameData),
    setSourceName: (name: string) => ipcRenderer.invoke('ndi:setSourceName', name),
  },

  // ============ API PROXY (CORS bypass) ============
  apiFetch: (options: { url: string; method?: string; headers?: Record<string, string>; body?: string }) =>
    ipcRenderer.invoke('api:fetch', options) as Promise<{ ok: boolean; status: number; statusText: string; data: unknown }>,

  // ============ WINDOW ============
  focusWindow: () => ipcRenderer.invoke('window:focus'),

  // ============ AUTO-UPDATER ============
  updates: {
    checkForUpdates: () => ipcRenderer.invoke('check-for-updates'),
    downloadUpdate: () => ipcRenderer.invoke('download-update'),
    installUpdate: () => ipcRenderer.invoke('install-update'),
    onUpdateAvailable: (callback: (info: { version: string; releaseNotes?: string; releaseDate?: string }) => void) => {
      ipcRenderer.on('update-available', (_event, info) => callback(info))
    },
    onDownloadProgress: (callback: (progress: { percent: number; transferred: number; total: number }) => void) => {
      ipcRenderer.on('update-download-progress', (_event, progress) => callback(progress))
    },
    onUpdateDownloaded: (callback: (info: { version: string }) => void) => {
      ipcRenderer.on('update-downloaded', (_event, info) => callback(info))
    },
    removeListeners: () => {
      ipcRenderer.removeAllListeners('update-available')
      ipcRenderer.removeAllListeners('update-download-progress')
      ipcRenderer.removeAllListeners('update-downloaded')
    },
  },
})

// Type definitions are in src/types/electron.d.ts
