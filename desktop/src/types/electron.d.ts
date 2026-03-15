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
    }
  }
}

export {}
