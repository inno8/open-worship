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
})

// Type definitions are in src/types/electron.d.ts
