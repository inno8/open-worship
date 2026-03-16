import type { Song } from '../stores/songStore'
import type { Schedule } from '../stores/scheduleStore'
import { useSongStore } from '../stores/songStore'
import { useScheduleStore } from '../stores/scheduleStore'
import { wsSync } from './WebSocketSync'

function normalizeSong(payload: { id: string; title?: string; author?: string; lyrics?: string }): Song {
  const now = new Date().toISOString()
  return {
    id: payload.id,
    title: payload.title ?? '',
    author: payload.author ?? '',
    lyrics: payload.lyrics ?? '',
    tags: [],
    createdAt: now,
    updatedAt: now,
  }
}

function normalizeSchedule(payload: {
  id: string
  name?: string
  date?: string | null
  notes?: string
}): Schedule {
  const now = new Date().toISOString()
  return {
    id: payload.id,
    name: payload.name ?? '',
    date: payload.date ?? undefined,
    notes: payload.notes ?? '',
    items: [],
    createdAt: now,
    updatedAt: now,
  }
}

export function registerSyncHandlers(): void {
  wsSync.on('song_added', (data) => {
    const song = data.song as { id: string; title?: string; author?: string; lyrics?: string }
    if (!song?.id) return
    const { songs, setSongs } = useSongStore.getState()
    if (songs.some((s) => s.id === song.id)) return
    setSongs([...songs, normalizeSong(song)])
  })

  wsSync.on('song_updated', (data) => {
    const song = data.song as { id: string; title?: string; author?: string; lyrics?: string }
    if (!song?.id) return
    const { songs, setSongs, selectedSong } = useSongStore.getState()
    const next = songs.map((s) => (s.id === song.id ? { ...s, ...normalizeSong(song) } : s))
    setSongs(next)
    if (selectedSong?.id === song.id) {
      useSongStore.setState({ selectedSong: { ...selectedSong, ...normalizeSong(song) } })
    }
  })

  wsSync.on('song_deleted', (data) => {
    const songId = data.song_id as string
    if (!songId) return
    const { songs, setSongs, selectedSong } = useSongStore.getState()
    setSongs(songs.filter((s) => s.id !== songId))
    if (selectedSong?.id === songId) {
      useSongStore.setState({ selectedSong: null })
    }
  })

  wsSync.on('schedule_added', (data) => {
    const schedule = data.schedule as { id: string; name?: string; date?: string | null; notes?: string }
    if (!schedule?.id) return
    const { schedules, setSchedules } = useScheduleStore.getState()
    if (schedules.some((s) => s.id === schedule.id)) return
    setSchedules([...schedules, normalizeSchedule(schedule)])
  })

  wsSync.on('schedule_updated', (data) => {
    const schedule = data.schedule as { id: string; name?: string; date?: string | null; notes?: string }
    if (!schedule?.id) return
    const { schedules, setSchedules, activeSchedule } = useScheduleStore.getState()
    const next = schedules.map((s) =>
      s.id === schedule.id
        ? { ...s, name: schedule.name ?? s.name, date: schedule.date ?? s.date, notes: schedule.notes ?? s.notes }
        : s
    )
    setSchedules(next)
    if (activeSchedule?.id === schedule.id) {
      useScheduleStore.setState({
        activeSchedule: {
          ...activeSchedule,
          name: schedule.name ?? activeSchedule.name,
          date: schedule.date ?? activeSchedule.date,
          notes: schedule.notes ?? activeSchedule.notes,
        },
      })
    }
  })

  wsSync.on('schedule_deleted', (data) => {
    const scheduleId = data.schedule_id as string
    if (!scheduleId) return
    const { schedules, setSchedules, activeSchedule } = useScheduleStore.getState()
    setSchedules(schedules.filter((s) => s.id !== scheduleId))
    if (activeSchedule?.id === scheduleId) {
      useScheduleStore.setState({ activeSchedule: null })
    }
  })
}
