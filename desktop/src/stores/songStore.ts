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

// Helper to parse lyrics into sections
export function parseLyrics(lyrics: string): Section[] {
  const sections: Section[] = []
  let currentSection: Section = { type: 'Intro', lines: [] }

  for (const line of lyrics.split('\n')) {
    const match = line.trim().match(/^\[(.+?)\]$/)
    if (match) {
      if (currentSection.lines.length > 0) {
        sections.push(currentSection)
      }
      currentSection = { type: match[1], lines: [] }
    } else if (line.trim()) {
      currentSection.lines.push(line.trim())
    }
  }

  if (currentSection.lines.length > 0) {
    sections.push(currentSection)
  }

  return sections
}
