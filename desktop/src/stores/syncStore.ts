import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected'

const DEFAULT_WS_URL = 'ws://localhost:8000/ws/sync/'

interface SyncState {
  backendWsUrl: string
  connectionStatus: ConnectionStatus
  setBackendWsUrl: (url: string) => void
  setConnectionStatus: (status: ConnectionStatus) => void
}

export const useSyncStore = create<SyncState>()(
  persist(
    (set) => ({
      backendWsUrl: DEFAULT_WS_URL,
      connectionStatus: 'disconnected',
      setBackendWsUrl: (backendWsUrl) => set({ backendWsUrl }),
      setConnectionStatus: (connectionStatus) => set({ connectionStatus }),
    }),
    { name: 'open-worship-sync' }
  )
)
