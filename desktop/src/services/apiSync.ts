import { useSyncStore } from '../stores/syncStore'
import { Song, autoFormatLyrics } from '../stores/songStore'
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
  // Alternate date field names different APIs use
  service_date?: string
  serviceDate?: string
  start_date?: string
  startDate?: string
  schedule_date?: string
  scheduleDate?: string
  scheduled_date?: string
  scheduledDate?: string
  scheduled_at?: string
  scheduledAt?: string
  event_date?: string
  eventDate?: string
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
  
  // Get raw lyrics/content from various possible fields
  let rawLyrics = apiSong.lyrics || apiSong.text || apiSong.content || apiSong.body || ''
  
  // Format lyrics into sections with max 3 lines per verse
  const formattedLyrics = formatLyricsFromContent(rawLyrics)
  
  const createdAt = apiSong.createdAt || apiSong.created_at || now
  const updatedAt = apiSong.updatedAt || apiSong.updated_at || now
  
  console.log('[apiSync] Converting song:', { id: apiSong.id, title, author, rawLength: rawLyrics.length, formattedLength: formattedLyrics.length })
  
  return {
    id: apiSong.id,
    title,
    author,
    lyrics: formattedLyrics,
    tags: apiSong.tags || [],
    createdAt,
    updatedAt,
  }
}

// Format raw content/lyrics into structured sections with max 3 lines per verse
function formatLyricsFromContent(content: string): string {
  if (!content || !content.trim()) return ''
  
  // Split by common section markers or double newlines
  const lines = content.split(/\r?\n/)
  const result: string[] = []
  let currentSection: string[] = []
  let verseNum = 1
  let hasSection = false
  
  for (const line of lines) {
    const trimmed = line.trim()
    
    // Check if this is a section marker like [Verse 1], [Chorus], etc.
    if (trimmed.match(/^\[.+\]$/)) {
      // Save current section if any
      if (currentSection.length > 0) {
        result.push(...formatSection(currentSection, hasSection ? null : `Verse ${verseNum++}`))
        currentSection = []
      }
      result.push(trimmed)
      hasSection = true
    } else if (trimmed === '') {
      // Empty line - might indicate section break
      if (currentSection.length > 0) {
        result.push(...formatSection(currentSection, hasSection ? null : `Verse ${verseNum++}`))
        currentSection = []
        hasSection = false
      }
      result.push('')
    } else {
      currentSection.push(trimmed)
    }
  }
  
  // Don't forget last section
  if (currentSection.length > 0) {
    result.push(...formatSection(currentSection, hasSection ? null : `Verse ${verseNum}`))
  }
  
  return result.join('\n').replace(/\n{3,}/g, '\n\n').trim()
}

// Format a section into chunks of max 3 lines
function formatSection(lines: string[], defaultHeader: string | null): string[] {
  const MAX_LINES = 3
  const result: string[] = []
  
  // Add default header if no section marker was present
  if (defaultHeader && lines.length > 0) {
    result.push(`[${defaultHeader}]`)
  }
  
  // Split lines into chunks of 3
  for (let i = 0; i < lines.length; i += MAX_LINES) {
    const chunk = lines.slice(i, i + MAX_LINES)
    
    // If this is a continuation (not first chunk) and we had a header, add continuation marker
    if (i > 0 && defaultHeader) {
      result.push('')
      result.push(`[${defaultHeader} cont.]`)
    } else if (i > 0) {
      result.push('')
    }
    
    result.push(...chunk)
  }
  
  return result
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
  
  // Try common date field names
  const rawDate = apiSchedule.date
    || apiSchedule.service_date || apiSchedule.serviceDate
    || apiSchedule.start_date || apiSchedule.startDate
    || apiSchedule.schedule_date || apiSchedule.scheduleDate
    || apiSchedule.scheduled_date || apiSchedule.scheduledDate
    || apiSchedule.scheduled_at || apiSchedule.scheduledAt
    || apiSchedule.event_date || apiSchedule.eventDate
  // Normalize to YYYY-MM-DD (the toLocaleDateString path expects this format)
  const normalizedDate = rawDate ? rawDate.slice(0, 10) : undefined

  return {
    id: apiSchedule.id,
    name: apiSchedule.name || apiSchedule.title || 'Untitled Schedule',
    date: normalizedDate,
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
