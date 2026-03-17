import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected'

const DEFAULT_WS_URL = 'ws://localhost:8000/ws/sync/'

interface SyncState {
  // Existing fields
  backendWsUrl: string
  connectionStatus: ConnectionStatus
  
  // API Integration fields
  apiToken: string
  apiBaseUrl: string
  songEndpoint: string
  scheduleEndpoint: string
  heartbeatEndpoint: string
  heartbeatIntervalMinutes: number
  
  // Existing setters
  setBackendWsUrl: (url: string) => void
  setConnectionStatus: (status: ConnectionStatus) => void
  
  // API Integration setters
  setApiToken: (token: string) => void
  setApiBaseUrl: (url: string) => void
  setSongEndpoint: (endpoint: string) => void
  setScheduleEndpoint: (endpoint: string) => void
  setHeartbeatEndpoint: (endpoint: string) => void
  setHeartbeatIntervalMinutes: (minutes: number) => void
}

export const useSyncStore = create<SyncState>()(
  persist(
    (set) => ({
      // Existing defaults
      backendWsUrl: DEFAULT_WS_URL,
      connectionStatus: 'disconnected',
      
      // API Integration defaults
      apiToken: '',
      apiBaseUrl: '',
      songEndpoint: '/api/songs',
      scheduleEndpoint: '/api/schedules',
      heartbeatEndpoint: '/api/heartbeat',
      heartbeatIntervalMinutes: 60,
      
      // Existing setters
      setBackendWsUrl: (backendWsUrl) => set({ backendWsUrl }),
      setConnectionStatus: (connectionStatus) => set({ connectionStatus }),
      
      // API Integration setters
      setApiToken: (apiToken) => set({ apiToken }),
      setApiBaseUrl: (apiBaseUrl) => set({ apiBaseUrl }),
      setSongEndpoint: (songEndpoint) => set({ songEndpoint }),
      setScheduleEndpoint: (scheduleEndpoint) => set({ scheduleEndpoint }),
      setHeartbeatEndpoint: (heartbeatEndpoint) => set({ heartbeatEndpoint }),
      setHeartbeatIntervalMinutes: (heartbeatIntervalMinutes) => set({ heartbeatIntervalMinutes }),
    }),
    { name: 'open-worship-sync' }
  )
)
