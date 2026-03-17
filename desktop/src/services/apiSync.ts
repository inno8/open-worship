import { useSyncStore } from '../stores/syncStore'
import { Song } from '../stores/songStore'
import { Schedule } from '../stores/scheduleStore'

// API response types (can be adjusted based on actual API)
export interface ApiSong {
  id: string
  title: string
  name?: string // Some APIs use name instead of title
  author: string
  artist?: string // Some APIs use artist instead of author
  lyrics: string
  text?: string // Some APIs use text instead of lyrics
  content?: string // Some APIs use content instead of lyrics
  body?: string // Some APIs use body instead of lyrics
  tags?: string[]
  createdAt?: string
  updatedAt?: string
  created_at?: string
  updated_at?: string
}

export interface ApiScheduleItem {
  id?: string
  order?: number
  type?: 'song' | 'blank' | 'custom'
  songId?: string
  song_id?: string // snake_case variant
  song?: ApiSong
  customTitle?: string
  custom_title?: string
  customText?: string
  custom_text?: string
}

export interface ApiSchedule {
  id: string
  name?: string
  title?: string // Some APIs use title instead of name
  date?: string
  notes?: string
  items?: ApiScheduleItem[]
  entries?: ApiScheduleItem[] // Some APIs use "entries" instead of "items"
  songs?: ApiSong[] // Some APIs embed songs directly
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
    console.log('[apiSync] Songs API raw response:', data)
    
    // Handle various API response formats
    let songs: ApiSong[] = []
    if (Array.isArray(data)) {
      songs = data
    } else if (data?.songs && Array.isArray(data.songs)) {
      songs = data.songs as ApiSong[]
    } else if (data?.data && Array.isArray(data.data)) {
      songs = data.data as ApiSong[]
    } else if (data?.results && Array.isArray(data.results)) {
      songs = data.results as ApiSong[]
    }
    
    console.log('[apiSync] Parsed songs:', songs.length, songs)
    
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
    console.log('[apiSync] Schedules API raw response:', data)
    
    // Handle various API response formats
    let schedules: ApiSchedule[] = []
    if (Array.isArray(data)) {
      schedules = data
    } else if (data?.schedules && Array.isArray(data.schedules)) {
      schedules = data.schedules as ApiSchedule[]
    } else if (data?.data && Array.isArray(data.data)) {
      schedules = data.data as ApiSchedule[]
    } else if (data?.results && Array.isArray(data.results)) {
      schedules = data.results as ApiSchedule[]
    }
    
    console.log('[apiSync] Parsed schedules:', schedules.length, schedules)
    
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
  
  // Handle various field name variants
  const title = apiSong.title || apiSong.name || 'Untitled'
  const author = apiSong.author || apiSong.artist || ''
  const lyrics = apiSong.lyrics || apiSong.text || apiSong.content || apiSong.body || ''
  const createdAt = apiSong.createdAt || apiSong.created_at || now
  const updatedAt = apiSong.updatedAt || apiSong.updated_at || now
  
  console.log('[apiSync] Converting song:', { id: apiSong.id, title, author, lyricsLength: lyrics.length })
  
  return {
    id: apiSong.id,
    title,
    author,
    lyrics,
    tags: apiSong.tags || [],
    createdAt,
    updatedAt,
  }
}

// Convert API schedule to local Schedule format
export function apiScheduleToLocal(apiSchedule: ApiSchedule): Schedule {
  const now = new Date().toISOString()
  
  // Handle different API response formats for items
  // Could be: items, entries, or songs (direct array of songs)
  let scheduleItems: ApiScheduleItem[] = []
  
  if (apiSchedule.items && apiSchedule.items.length > 0) {
    scheduleItems = apiSchedule.items
  } else if (apiSchedule.entries && apiSchedule.entries.length > 0) {
    scheduleItems = apiSchedule.entries
  } else if (apiSchedule.songs && apiSchedule.songs.length > 0) {
    // If API returns songs directly, convert them to schedule items
    scheduleItems = apiSchedule.songs.map((song, idx) => ({
      id: `item-${song.id}`,
      order: idx,
      type: 'song' as const,
      song: song,
    }))
  }
  
  return {
    id: apiSchedule.id,
    name: apiSchedule.name || apiSchedule.title || 'Untitled Schedule',
    date: apiSchedule.date,
    notes: apiSchedule.notes || '',
    items: scheduleItems.map((item, index) => ({
      id: item.id || crypto.randomUUID(),
      order: item.order ?? index,
      type: item.type || 'song',
      songId: item.songId || item.song_id || item.song?.id || null,
      song: item.song ? apiSongToLocal(item.song) : null,
      customTitle: item.customTitle || item.custom_title || null,
      customText: item.customText || item.custom_text || null,
    })),
    createdAt: apiSchedule.createdAt || now,
    updatedAt: apiSchedule.updatedAt || now,
  }
}
