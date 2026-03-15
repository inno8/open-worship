import { create } from 'zustand'
import { Song } from './songStore'

export interface ScheduleItem {
  id: string
  scheduleId?: string
  order: number
  type: 'song' | 'blank' | 'custom'
  song?: Song | null
  songId?: string | null
  customTitle?: string | null
  customText?: string | null
  backgroundOverride?: string
}

export interface Schedule {
  id: string
  name: string
  date?: string
  notes: string
  items: ScheduleItem[]
  createdAt: string
  updatedAt: string
}

interface ScheduleState {
  schedules: Schedule[]
  activeSchedule: Schedule | null
  currentItemIndex: number
  isLoading: boolean
  error: string | null
  isInitialized: boolean

  // Actions
  loadSchedules: () => Promise<void>
  setSchedules: (schedules: Schedule[]) => void
  setActiveSchedule: (schedule: Schedule | null) => void
  addSchedule: (schedule: Schedule) => Promise<void>
  updateSchedule: (id: string, updates: Partial<Schedule>) => Promise<void>
  deleteSchedule: (id: string) => Promise<void>
  
  // Schedule items
  addItem: (scheduleId: string, item: ScheduleItem) => Promise<void>
  updateItem: (scheduleId: string, itemId: string, updates: Partial<ScheduleItem>) => Promise<void>
  removeItem: (scheduleId: string, itemId: string) => Promise<void>
  reorderItems: (scheduleId: string, itemIds: string[]) => Promise<void>
  
  // Presentation
  setCurrentItemIndex: (index: number) => void
  nextItem: () => void
  prevItem: () => void
  
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
}

export const useScheduleStore = create<ScheduleState>((set, get) => ({
  schedules: [],
  activeSchedule: null,
  currentItemIndex: 0,
  isLoading: false,
  error: null,
  isInitialized: false,

  loadSchedules: async () => {
    if (get().isInitialized) return
    
    set({ isLoading: true, error: null })
    
    try {
      if (window.electronAPI?.schedules) {
        const schedules = await window.electronAPI.schedules.getAll()
        set({ schedules, isInitialized: true, isLoading: false })
      } else {
        // Browser mode - no persistence
        set({ isInitialized: true, isLoading: false })
      }
    } catch (error) {
      console.error('Failed to load schedules:', error)
      set({ error: 'Failed to load schedules', isLoading: false, isInitialized: true })
    }
  },

  setSchedules: (schedules) => set({ schedules }),
  
  setActiveSchedule: (activeSchedule) => set({ 
    activeSchedule, 
    currentItemIndex: 0 
  }),
  
  addSchedule: async (schedule) => {
    try {
      if (window.electronAPI?.schedules) {
        await window.electronAPI.schedules.create({
          id: schedule.id,
          name: schedule.name,
          date: schedule.date || '',
          notes: schedule.notes,
          createdAt: schedule.createdAt,
          updatedAt: schedule.updatedAt,
        })
      }
      set((state) => ({
        schedules: [...state.schedules, schedule],
      }))
    } catch (error) {
      console.error('Failed to add schedule:', error)
      set({ error: 'Failed to add schedule' })
    }
  },
  
  updateSchedule: async (id, updates) => {
    try {
      if (window.electronAPI?.schedules) {
        const { items, ...scheduleUpdates } = updates
        await window.electronAPI.schedules.update(id, scheduleUpdates as Partial<Omit<Schedule, 'items'>>)
      }
      set((state) => ({
        schedules: state.schedules.map((s) =>
          s.id === id ? { ...s, ...updates } : s
        ),
        activeSchedule: state.activeSchedule?.id === id
          ? { ...state.activeSchedule, ...updates }
          : state.activeSchedule,
      }))
    } catch (error) {
      console.error('Failed to update schedule:', error)
      set({ error: 'Failed to update schedule' })
    }
  },
  
  deleteSchedule: async (id) => {
    try {
      if (window.electronAPI?.schedules) {
        await window.electronAPI.schedules.delete(id)
      }
      set((state) => ({
        schedules: state.schedules.filter((s) => s.id !== id),
        activeSchedule: state.activeSchedule?.id === id ? null : state.activeSchedule,
      }))
    } catch (error) {
      console.error('Failed to delete schedule:', error)
      set({ error: 'Failed to delete schedule' })
    }
  },

  addItem: async (scheduleId, item) => {
    try {
      if (window.electronAPI?.scheduleItems) {
        await window.electronAPI.scheduleItems.add({
          id: item.id,
          scheduleId,
          order: item.order,
          type: item.type,
          songId: item.song?.id || item.songId || null,
          customTitle: item.customTitle || null,
          customText: item.customText || null,
        })
      }
      set((state) => ({
        schedules: state.schedules.map((s) =>
          s.id === scheduleId
            ? { ...s, items: [...s.items, item] }
            : s
        ),
        activeSchedule: state.activeSchedule?.id === scheduleId
          ? { ...state.activeSchedule, items: [...state.activeSchedule.items, item] }
          : state.activeSchedule,
      }))
    } catch (error) {
      console.error('Failed to add item:', error)
      set({ error: 'Failed to add item' })
    }
  },

  updateItem: async (scheduleId, itemId, updates) => {
    try {
      if (window.electronAPI?.scheduleItems) {
        await window.electronAPI.scheduleItems.update(itemId, updates)
      }
      set((state) => ({
        schedules: state.schedules.map((s) =>
          s.id === scheduleId
            ? { 
                ...s, 
                items: s.items.map((i) => 
                  i.id === itemId ? { ...i, ...updates } : i
                ) 
              }
            : s
        ),
        activeSchedule: state.activeSchedule?.id === scheduleId
          ? { 
              ...state.activeSchedule, 
              items: state.activeSchedule.items.map((i) => 
                i.id === itemId ? { ...i, ...updates } : i
              ) 
            }
          : state.activeSchedule,
      }))
    } catch (error) {
      console.error('Failed to update item:', error)
      set({ error: 'Failed to update item' })
    }
  },

  removeItem: async (scheduleId, itemId) => {
    try {
      if (window.electronAPI?.scheduleItems) {
        await window.electronAPI.scheduleItems.delete(itemId)
      }
      set((state) => ({
        schedules: state.schedules.map((s) =>
          s.id === scheduleId
            ? { ...s, items: s.items.filter((i) => i.id !== itemId) }
            : s
        ),
        activeSchedule: state.activeSchedule?.id === scheduleId
          ? { 
              ...state.activeSchedule, 
              items: state.activeSchedule.items.filter((i) => i.id !== itemId) 
            }
          : state.activeSchedule,
      }))
    } catch (error) {
      console.error('Failed to remove item:', error)
      set({ error: 'Failed to remove item' })
    }
  },

  reorderItems: async (scheduleId, itemIds) => {
    const schedule = get().schedules.find((s) => s.id === scheduleId)
    if (!schedule) return

    const reorderedItems = itemIds
      .map((id, index) => {
        const item = schedule.items.find((i) => i.id === id)
        return item ? { ...item, order: index } : null
      })
      .filter(Boolean) as ScheduleItem[]

    try {
      if (window.electronAPI?.scheduleItems) {
        await window.electronAPI.scheduleItems.reorder(scheduleId, itemIds)
      }
      set((state) => ({
        schedules: state.schedules.map((s) =>
          s.id === scheduleId ? { ...s, items: reorderedItems } : s
        ),
        activeSchedule: state.activeSchedule?.id === scheduleId
          ? { ...state.activeSchedule, items: reorderedItems }
          : state.activeSchedule,
      }))
    } catch (error) {
      console.error('Failed to reorder items:', error)
      set({ error: 'Failed to reorder items' })
    }
  },

  setCurrentItemIndex: (currentItemIndex) => set({ currentItemIndex }),
  
  nextItem: () => {
    const { activeSchedule, currentItemIndex } = get()
    if (activeSchedule && currentItemIndex < activeSchedule.items.length - 1) {
      set({ currentItemIndex: currentItemIndex + 1 })
    }
  },
  
  prevItem: () => {
    const { currentItemIndex } = get()
    if (currentItemIndex > 0) {
      set({ currentItemIndex: currentItemIndex - 1 })
    }
  },

  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
}))
