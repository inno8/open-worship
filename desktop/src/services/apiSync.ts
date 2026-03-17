import { useSyncStore } from '../stores/syncStore'
import { Song } from '../stores/songStore'
import { Schedule } from '../stores/scheduleStore'

// API response types (can be adjusted based on actual API)
export interface ApiSong {
  id: string
  title: string
  author: string
  lyrics: string
  tags?: string[]
  createdAt?: string
  updatedAt?: string
}

export interface ApiSchedule {
  id: string
  name: string
  title?: string // Some APIs use title instead of name
  date?: string
  notes?: string
  items?: Array<{
    id: string
    order: number
    type: 'song' | 'blank' | 'custom'
    songId?: string
    song?: ApiSong
    customTitle?: string
    customText?: string
  }>
  createdAt?: string
  updatedAt?: string
}

export interface SyncResult<T> {
  success: boolean
  data?: T
  error?: string
  added?: number
  skipped?: number
}

function getConfig() {
  const state = useSyncStore.getState()
  return {
    apiToken: state.apiToken,
    apiBaseUrl: state.apiBaseUrl,
    songEndpoint: state.songEndpoint,
    scheduleEndpoint: state.scheduleEndpoint,
    heartbeatEndpoint: state.heartbeatEndpoint,
  }
}

function buildUrl(baseUrl: string, endpoint: string): string {
  // Remove trailing slash from base, leading slash from endpoint if needed
  const base = baseUrl.replace(/\/+$/, '')
  const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`
  return `${base}${path}`
}

// Helper to make API requests - uses Electron proxy if available (bypasses CORS)
async function apiFetch(url: string, options: { method?: string; headers?: Record<string, string>; body?: string } = {}): Promise<{ ok: boolean; status: number; statusText: string; data: unknown }> {
  // If in Electron, use the IPC proxy to bypass CORS
  if (window.electronAPI?.apiFetch) {
    return window.electronAPI.apiFetch({
      url,
      method: options.method || 'GET',
      headers: options.headers || {},
      body: options.body,
    })
  }

  // Fallback to browser fetch (may fail due to CORS in dev mode)
  try {
    const response = await fetch(url, {
      method: options.method || 'GET',
      headers: options.headers,
      body: options.body,
    })

    let data: unknown
    try {
      data = await response.json()
    } catch {
      data = await response.text()
    }

    return {
      ok: response.ok,
      status: response.status,
      statusText: response.statusText,
      data,
    }
  } catch (error) {
    return {
      ok: false,
      status: 0,
      statusText: error instanceof Error ? error.message : 'Unknown error',
      data: null,
    }
  }
}

export async function fetchSongsFromApi(): Promise<SyncResult<ApiSong[]>> {
  const config = getConfig()
  
  if (!config.apiToken || !config.apiBaseUrl) {
    return { success: false, error: 'API token or base URL not configured' }
  }

  try {
    const url = buildUrl(config.apiBaseUrl, config.songEndpoint)
    const response = await apiFetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${config.apiToken}`,
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      return { success: false, error: `API error: ${response.status} ${response.statusText}` }
    }

    const data = response.data as Record<string, unknown>
    // Handle both array response and { songs: [...] } response
    const songs: ApiSong[] = Array.isArray(data) ? data : ((data?.songs || data?.data || []) as ApiSong[])
    
    return { success: true, data: songs }
  } catch (error) {
    return { success: false, error: `Network error: ${error instanceof Error ? error.message : 'Unknown error'}` }
  }
}

export async function fetchSchedulesFromApi(): Promise<SyncResult<ApiSchedule[]>> {
  const config = getConfig()
  
  if (!config.apiToken || !config.apiBaseUrl) {
    return { success: false, error: 'API token or base URL not configured' }
  }

  try {
    const url = buildUrl(config.apiBaseUrl, config.scheduleEndpoint)
    const response = await apiFetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${config.apiToken}`,
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      return { success: false, error: `API error: ${response.status} ${response.statusText}` }
    }

    const data = response.data as Record<string, unknown>
    // Handle both array response and { schedules: [...] } response
    const schedules: ApiSchedule[] = Array.isArray(data) ? data : ((data?.schedules || data?.data || []) as ApiSchedule[])
    
    return { success: true, data: schedules }
  } catch (error) {
    return { success: false, error: `Network error: ${error instanceof Error ? error.message : 'Unknown error'}` }
  }
}

export async function checkHeartbeat(): Promise<SyncResult<{ hasNewSongs: boolean; hasNewSchedules: boolean }>> {
  const config = getConfig()
  
  if (!config.apiToken || !config.apiBaseUrl) {
    return { success: false, error: 'API token or base URL not configured' }
  }

  try {
    const url = buildUrl(config.apiBaseUrl, config.heartbeatEndpoint)
    const response = await apiFetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${config.apiToken}`,
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      return { success: false, error: `API error: ${response.status} ${response.statusText}` }
    }

    const data = response.data as Record<string, unknown>
    return { 
      success: true, 
      data: {
        hasNewSongs: !!(data?.hasNewSongs || data?.newSongs),
        hasNewSchedules: !!(data?.hasNewSchedules || data?.newSchedules),
      }
    }
  } catch (error) {
    return { success: false, error: `Network error: ${error instanceof Error ? error.message : 'Unknown error'}` }
  }
}

// Convert API song to local Song format
export function apiSongToLocal(apiSong: ApiSong): Song {
  const now = new Date().toISOString()
  return {
    id: apiSong.id,
    title: apiSong.title,
    author: apiSong.author || '',
    lyrics: apiSong.lyrics || '',
    tags: apiSong.tags || [],
    createdAt: apiSong.createdAt || now,
    updatedAt: apiSong.updatedAt || now,
  }
}

// Convert API schedule to local Schedule format
export function apiScheduleToLocal(apiSchedule: ApiSchedule): Schedule {
  const now = new Date().toISOString()
  return {
    id: apiSchedule.id,
    name: apiSchedule.name || apiSchedule.title || 'Untitled Schedule',
    date: apiSchedule.date,
    notes: apiSchedule.notes || '',
    items: (apiSchedule.items || []).map((item, index) => ({
      id: item.id || crypto.randomUUID(),
      order: item.order ?? index,
      type: item.type || 'song',
      songId: item.songId || item.song?.id || null,
      song: item.song ? apiSongToLocal(item.song) : null,
      customTitle: item.customTitle || null,
      customText: item.customText || null,
    })),
    createdAt: apiSchedule.createdAt || now,
    updatedAt: apiSchedule.updatedAt || now,
  }
}
