import { useSyncStore } from '../stores/syncStore'

type EventHandler = (data: Record<string, unknown>) => void

export class WebSocketSync {
  private ws: WebSocket | null = null
  private getUrl: () => string
  private handlers: Map<string, EventHandler[]> = new Map()
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null
  private reconnectDelay = 1000
  private onStatusChange?: (status: 'connected' | 'disconnected' | 'connecting') => void

  constructor(
    getUrl: () => string,
    options?: { onStatusChange?: (status: 'connected' | 'disconnected' | 'connecting') => void }
  ) {
    this.getUrl = getUrl
    this.onStatusChange = options?.onStatusChange
  }

  connect(): void {
    const url = this.getUrl()
    if (!url?.trim()) {
      this.onStatusChange?.('disconnected')
      return
    }
    this.onStatusChange?.('connecting')
    this.ws = new WebSocket(url)

    this.ws.onopen = () => {
      console.log('WebSocket connected')
      this.reconnectDelay = 1000
      this.onStatusChange?.('connected')
    }

    this.ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data) as Record<string, unknown>
        const eventName = data.event as string
        if (eventName) this.emit(eventName, data)
      } catch {
        console.error('WebSocket invalid JSON:', event.data)
      }
    }

    this.ws.onclose = () => {
      console.log('WebSocket disconnected, reconnecting...')
      this.onStatusChange?.('disconnected')
      this.scheduleReconnect()
    }

    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error)
    }
  }

  private scheduleReconnect(): void {
    if (this.reconnectTimer) return
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null
      this.reconnectDelay = Math.min(this.reconnectDelay * 2, 30000)
      this.connect()
    }, this.reconnectDelay)
  }

  on(event: string, handler: EventHandler): void {
    if (!this.handlers.has(event)) {
      this.handlers.set(event, [])
    }
    this.handlers.get(event)!.push(handler)
  }

  private emit(event: string, data: Record<string, unknown>): void {
    const list = this.handlers.get(event) || []
    list.forEach((h) => h(data))
  }

  disconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer)
      this.reconnectTimer = null
    }
    this.ws?.close()
    this.ws = null
    this.onStatusChange?.('disconnected')
  }

  getConnectionStatus(): 'connected' | 'disconnected' | 'connecting' {
    if (!this.ws) return 'disconnected'
    switch (this.ws.readyState) {
      case WebSocket.CONNECTING:
        return 'connecting'
      case WebSocket.OPEN:
        return 'connected'
      default:
        return 'disconnected'
    }
  }
}

function getWsUrl(): string {
  return useSyncStore.getState().backendWsUrl
}

export const wsSync = new WebSocketSync(getWsUrl, {
  onStatusChange: (status) => useSyncStore.getState().setConnectionStatus(status),
})
