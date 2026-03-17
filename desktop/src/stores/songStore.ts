import { create } from 'zustand'

export interface Song {
  id: string
  title: string
  author: string
  lyrics: string
  tags: string[]
  defaultBackground?: string
  createdAt: string
  updatedAt: string
}

export interface Section {
  type: string
  lines: string[]
}

interface SongState {
  songs: Song[]
  selectedSong: Song | null
  searchQuery: string
  isLoading: boolean
  error: string | null
  isInitialized: boolean
  
  // Actions
  loadSongs: () => Promise<void>
  reloadSongs: () => Promise<void>
  setSongs: (songs: Song[]) => void
  addSong: (song: Song) => Promise<void>
  updateSong: (id: string, updates: Partial<Song>) => Promise<void>
  deleteSong: (id: string) => Promise<void>
  selectSong: (song: Song | null) => void
  setSearchQuery: (query: string) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
}

export const useSongStore = create<SongState>((set, get) => ({
  songs: [],
  selectedSong: null,
  searchQuery: '',
  isLoading: false,
  error: null,
  isInitialized: false,

  loadSongs: async () => {
    if (get().isInitialized) return
    
    set({ isLoading: true, error: null })
    
    try {
      if (window.electronAPI?.songs) {
        const songs = await window.electronAPI.songs.getAll()
        set({ songs, isInitialized: true, isLoading: false })
      } else {
        // Browser mode - no persistence
        set({ isInitialized: true, isLoading: false })
      }
    } catch (error) {
      console.error('Failed to load songs:', error)
      set({ error: 'Failed to load songs', isLoading: false, isInitialized: true })
    }
  },

  // Force reload songs from DB (call after bulk sync)
  reloadSongs: async () => {
    set({ isLoading: true, error: null })
    
    try {
      if (window.electronAPI?.songs) {
        const songs = await window.electronAPI.songs.getAll()
        set({ songs, isLoading: false })
        console.log('[songStore] Reloaded', songs.length, 'songs from DB')
      } else {
        set({ isLoading: false })
      }
    } catch (error) {
      console.error('Failed to reload songs:', error)
      set({ error: 'Failed to reload songs', isLoading: false })
    }
  },

  setSongs: (songs) => set({ songs }),
  
  addSong: async (song) => {
    try {
      if (window.electronAPI?.songs) {
        await window.electronAPI.songs.create(song)
      }
      set((state) => ({ songs: [...state.songs, song] }))
    } catch (error) {
      console.error('Failed to add song:', error)
      set({ error: 'Failed to add song' })
    }
  },
  
  updateSong: async (id, updates) => {
    try {
      if (window.electronAPI?.songs) {
        await window.electronAPI.songs.update(id, updates)
      }
      set((state) => ({
        songs: state.songs.map((song) =>
          song.id === id ? { ...song, ...updates } : song
        ),
        selectedSong: state.selectedSong?.id === id 
          ? { ...state.selectedSong, ...updates }
          : state.selectedSong,
      }))
    } catch (error) {
      console.error('Failed to update song:', error)
      set({ error: 'Failed to update song' })
    }
  },
  
  deleteSong: async (id) => {
    try {
      if (window.electronAPI?.songs) {
        await window.electronAPI.songs.delete(id)
      }
      set((state) => ({
        songs: state.songs.filter((song) => song.id !== id),
        selectedSong: state.selectedSong?.id === id ? null : state.selectedSong,
      }))
    } catch (error) {
      console.error('Failed to delete song:', error)
      set({ error: 'Failed to delete song' })
    }
  },
  
  selectSong: (song) => set({ selectedSong: song }),
  
  setSearchQuery: (searchQuery) => set({ searchQuery }),
  
  setLoading: (isLoading) => set({ isLoading }),
  
  setError: (error) => set({ error }),
}))

// Max lines per slide/verse
const MAX_LINES_PER_SLIDE = 3

// Helper to parse lyrics into sections, splitting into slides of max 3 lines
export function parseLyrics(lyrics: string): Section[] {
  const sections: Section[] = []
  let currentType = 'Verse 1'
  let currentLines: string[] = []

  for (const line of lyrics.split('\n')) {
    const match = line.trim().match(/^\[(.+?)\]$/)
    if (match) {
      // Save current section if it has content
      if (currentLines.length > 0) {
        // Split into chunks of MAX_LINES_PER_SLIDE
        const chunks = chunkLines(currentLines, MAX_LINES_PER_SLIDE)
        chunks.forEach((chunk, idx) => {
          sections.push({ 
            type: chunks.length > 1 ? `${currentType} (${idx + 1})` : currentType, 
            lines: chunk 
          })
        })
      }
      currentType = match[1]
      currentLines = []
    } else if (line.trim()) {
      currentLines.push(line.trim())
    }
  }

  // Don't forget the last section
  if (currentLines.length > 0) {
    const chunks = chunkLines(currentLines, MAX_LINES_PER_SLIDE)
    chunks.forEach((chunk, idx) => {
      sections.push({ 
        type: chunks.length > 1 ? `${currentType} (${idx + 1})` : currentType, 
        lines: chunk 
      })
    })
  }

  return sections
}

// Split array into chunks of specified size
function chunkLines(lines: string[], size: number): string[][] {
  const chunks: string[][] = []
  for (let i = 0; i < lines.length; i += size) {
    chunks.push(lines.slice(i, i + size))
  }
  return chunks
}

// Auto-format lyrics: split long verses into sections with max 3 lines
export function autoFormatLyrics(lyrics: string): string {
  const lines = lyrics.split('\n')
  const result: string[] = []
  let inSection = false
  let lineCount = 0
  let verseNum = 1
  let currentSectionType = ''
  
  for (const line of lines) {
    const trimmed = line.trim()
    const sectionMatch = trimmed.match(/^\[(.+?)\]$/)
    
    if (sectionMatch) {
      // It's a section marker
      inSection = true
      lineCount = 0
      currentSectionType = sectionMatch[1]
      result.push(trimmed)
    } else if (trimmed) {
      // It's a lyric line
      if (!inSection) {
        // No section marker yet, add one
        result.push(`[Verse ${verseNum}]`)
        verseNum++
        inSection = true
        lineCount = 0
      }
      
      // Check if we need to start a new section
      if (lineCount >= MAX_LINES_PER_SLIDE) {
        // Start a new section - reuse the type with continuation
        const baseType = currentSectionType.replace(/\s*\(\d+\)$/, '')
        result.push('')
        result.push(`[${baseType} cont.]`)
        lineCount = 0
      }
      
      result.push(trimmed)
      lineCount++
    } else {
      // Empty line - could signal end of section
      if (lineCount > 0) {
        inSection = false
        lineCount = 0
      }
      result.push('')
    }
  }
  
  return result.join('\n').replace(/\n{3,}/g, '\n\n').trim()
}
