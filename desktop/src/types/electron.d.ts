// Type definitions for the Electron API exposed via preload

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

declare global {
  interface Window {
    electronAPI?: {
      // Display management
      getDisplays: () => Promise<Array<{
        id: number
        label: string
        size: { width: number; height: number }
        isPrimary: boolean
      }>>
      
      // Presentation window
      openPresentation: (displayId?: number) => Promise<{ success: boolean; alreadyOpen?: boolean }>
      closePresentation: () => Promise<{ success: boolean; reason?: string }>
      updatePresentation: (slideData: unknown) => Promise<{ success: boolean; reason?: string }>
      isPresentationOpen: () => Promise<boolean>
      onSlideUpdate: (callback: (data: unknown) => void) => void
      removeSlideUpdateListener: () => void
      
      // Songs CRUD
      songs: {
        getAll: () => Promise<Song[]>
        getById: (id: string) => Promise<Song | null>
        create: (song: Song) => Promise<Song>
        update: (id: string, updates: Partial<Song>) => Promise<Song | null>
        delete: (id: string) => Promise<boolean>
      }
      
      // Schedules CRUD
      schedules: {
        getAll: () => Promise<Schedule[]>
        getById: (id: string) => Promise<Schedule | null>
        create: (schedule: Omit<Schedule, 'items'>) => Promise<Omit<Schedule, 'items'>>
        update: (id: string, updates: Partial<Omit<Schedule, 'items'>>) => Promise<Omit<Schedule, 'items'> | null>
        delete: (id: string) => Promise<boolean>
      }
      
      // Schedule Items CRUD
      scheduleItems: {
        add: (item: Omit<ScheduleItem, 'song'>) => Promise<Omit<ScheduleItem, 'song'>>
        update: (id: string, updates: Partial<Omit<ScheduleItem, 'song'>>) => Promise<Omit<ScheduleItem, 'song'> | null>
        delete: (id: string) => Promise<boolean>
        reorder: (scheduleId: string, itemIds: string[]) => Promise<boolean>
      }

      // Announcements
      announcements: {
        getAll: () => Promise<Array<{ id: string; type: string; name: string; content: string | null; filePath: string | null; formatting: string; createdAt: string; updatedAt: string }>>
        getByType: (type: string) => Promise<Array<{ id: string; type: string; name: string; content: string | null; filePath: string | null; formatting: string; createdAt: string; updatedAt: string }>>
        create: (announcement: { id: string; type: string; name: string; content: string | null; filePath: string | null; formatting: string; createdAt: string; updatedAt: string }) => Promise<unknown>
        update: (id: string, updates: Record<string, unknown>) => Promise<unknown>
        delete: (id: string) => Promise<boolean>
      }

      // Backgrounds
      backgrounds: {
        list: () => Promise<string[]>
        import: () => Promise<string[]>
        remove: (filename: string) => Promise<boolean>
      }

      // NDI output
      ndi: {
        getStatus: () => Promise<{
          available: boolean
          nativeAvailable: boolean
          running: boolean
          mockMode: boolean
          sourceName: string
          resolution: { width: number; height: number }
          frameCount: number
        }>
        start: (sourceName?: string) => Promise<{
          success: boolean
          status: { available: boolean; running: boolean; sourceName: string; mockMode: boolean }
        }>
        stop: () => Promise<{ success: boolean }>
        sendFrame: (frameData: { data: Uint8Array; width: number; height: number }) => Promise<{
          success: boolean
          reason?: string
        }>
        setSourceName: (name: string) => Promise<{ success: boolean }>
      }

      // API Proxy (CORS bypass)
      apiFetch: (options: {
        url: string
        method?: string
        headers?: Record<string, string>
        body?: string
      }) => Promise<{
        ok: boolean
        status: number
        statusText: string
        data: unknown
      }>

      // Window
      focusWindow: () => Promise<boolean>

      // Auto-updater
      updates: {
        checkForUpdates: () => Promise<{ success: boolean; updateInfo?: unknown; error?: string }>
        downloadUpdate: () => Promise<{ success: boolean; error?: string }>
        installUpdate: () => void
        onUpdateAvailable: (callback: (info: { version: string; releaseNotes?: string; releaseDate?: string }) => void) => void
        onDownloadProgress: (callback: (progress: { percent: number; transferred: number; total: number }) => void) => void
        onUpdateDownloaded: (callback: (info: { version: string }) => void) => void
        removeListeners: () => void
      }
    }
  }
}

export {}
