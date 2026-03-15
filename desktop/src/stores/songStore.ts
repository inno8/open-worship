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
  
  // Actions
  setSongs: (songs: Song[]) => void
  addSong: (song: Song) => void
  updateSong: (id: string, updates: Partial<Song>) => void
  deleteSong: (id: string) => void
  selectSong: (song: Song | null) => void
  setSearchQuery: (query: string) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
}

export const useSongStore = create<SongState>((set) => ({
  songs: [],
  selectedSong: null,
  searchQuery: '',
  isLoading: false,
  error: null,

  setSongs: (songs) => set({ songs }),
  
  addSong: (song) => set((state) => ({ 
    songs: [...state.songs, song] 
  })),
  
  updateSong: (id, updates) => set((state) => ({
    songs: state.songs.map((song) =>
      song.id === id ? { ...song, ...updates } : song
    ),
    selectedSong: state.selectedSong?.id === id 
      ? { ...state.selectedSong, ...updates }
      : state.selectedSong,
  })),
  
  deleteSong: (id) => set((state) => ({
    songs: state.songs.filter((song) => song.id !== id),
    selectedSong: state.selectedSong?.id === id ? null : state.selectedSong,
  })),
  
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
