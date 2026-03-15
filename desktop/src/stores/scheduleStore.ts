import { create } from 'zustand'
import { Song } from './songStore'

export interface ScheduleItem {
  id: string
  order: number
  type: 'song' | 'blank' | 'custom'
  song?: Song
  customTitle?: string
  customText?: string
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

  // Actions
  setSchedules: (schedules: Schedule[]) => void
  setActiveSchedule: (schedule: Schedule | null) => void
  addSchedule: (schedule: Schedule) => void
  updateSchedule: (id: string, updates: Partial<Schedule>) => void
  deleteSchedule: (id: string) => void
  
  // Schedule items
  addItem: (scheduleId: string, item: ScheduleItem) => void
  removeItem: (scheduleId: string, itemId: string) => void
  reorderItems: (scheduleId: string, itemIds: string[]) => void
  
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

  setSchedules: (schedules) => set({ schedules }),
  
  setActiveSchedule: (activeSchedule) => set({ 
    activeSchedule, 
    currentItemIndex: 0 
  }),
  
  addSchedule: (schedule) => set((state) => ({
    schedules: [...state.schedules, schedule],
  })),
  
  updateSchedule: (id, updates) => set((state) => ({
    schedules: state.schedules.map((s) =>
      s.id === id ? { ...s, ...updates } : s
    ),
    activeSchedule: state.activeSchedule?.id === id
      ? { ...state.activeSchedule, ...updates }
      : state.activeSchedule,
  })),
  
  deleteSchedule: (id) => set((state) => ({
    schedules: state.schedules.filter((s) => s.id !== id),
    activeSchedule: state.activeSchedule?.id === id ? null : state.activeSchedule,
  })),

  addItem: (scheduleId, item) => set((state) => ({
    schedules: state.schedules.map((s) =>
      s.id === scheduleId
        ? { ...s, items: [...s.items, item] }
        : s
    ),
    activeSchedule: state.activeSchedule?.id === scheduleId
      ? { ...state.activeSchedule, items: [...state.activeSchedule.items, item] }
      : state.activeSchedule,
  })),

  removeItem: (scheduleId, itemId) => set((state) => ({
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
  })),

  reorderItems: (scheduleId, itemIds) => set((state) => {
    const schedule = state.schedules.find((s) => s.id === scheduleId)
    if (!schedule) return state

    const reorderedItems = itemIds
      .map((id, index) => {
        const item = schedule.items.find((i) => i.id === id)
        return item ? { ...item, order: index } : null
      })
      .filter(Boolean) as ScheduleItem[]

    return {
      schedules: state.schedules.map((s) =>
        s.id === scheduleId ? { ...s, items: reorderedItems } : s
      ),
      activeSchedule: state.activeSchedule?.id === scheduleId
        ? { ...state.activeSchedule, items: reorderedItems }
        : state.activeSchedule,
    }
  }),

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
