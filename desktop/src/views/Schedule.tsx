import { useEffect, useState } from 'react'
import { useScheduleStore, ScheduleItem } from '../stores/scheduleStore'
import { useSongStore } from '../stores/songStore'

export default function Schedule() {
  const {
    activeSchedule,
    setActiveSchedule,
    addItem,
    removeItem,
    reorderItems,
  } = useScheduleStore()
  const { songs } = useSongStore()
  const [pickerSearch, setPickerSearch] = useState('')
  const [pickerFilter, setPickerFilter] = useState<'recent' | 'favorites' | 'all'>('all')
  const [editingName, setEditingName] = useState(false)
  const [scheduleName, setScheduleName] = useState('')

  useEffect(() => {
    if (!activeSchedule) {
      const now = new Date().toISOString()
      setActiveSchedule({
        id: crypto.randomUUID(),
        name: 'Sunday Service',
        date: new Date().toISOString().split('T')[0],
        notes: '',
        items: [],
        createdAt: now,
        updatedAt: now,
      })
    }
  }, [])

  useEffect(() => {
    if (activeSchedule) {
      setScheduleName(activeSchedule.name)
    }
  }, [activeSchedule?.name])

  function handleAddSong(songId: string) {
    if (!activeSchedule) return
    const song = songs.find((s) => s.id === songId)
    if (!song) return

    const item: ScheduleItem = {
      id: crypto.randomUUID(),
      order: activeSchedule.items.length,
      type: 'song',
      song,
    }
    addItem(activeSchedule.id, item)
  }

  function handleAddBlank() {
    if (!activeSchedule) return
    const item: ScheduleItem = {
      id: crypto.randomUUID(),
      order: activeSchedule.items.length,
      type: 'blank',
      customTitle: 'Blank Slide',
    }
    addItem(activeSchedule.id, item)
  }

  function handleAddCustom() {
    if (!activeSchedule) return
    const item: ScheduleItem = {
      id: crypto.randomUUID(),
      order: activeSchedule.items.length,
      type: 'custom',
      customTitle: 'Custom Text',
      customText: '',
    }
    addItem(activeSchedule.id, item)
  }

  function handleRemove(itemId: string) {
    if (!activeSchedule) return
    removeItem(activeSchedule.id, itemId)
  }

  function handleMove(index: number, direction: 'up' | 'down') {
    if (!activeSchedule) return
    const items = [...activeSchedule.items]
    const target = direction === 'up' ? index - 1 : index + 1
    if (target < 0 || target >= items.length) return

    const ids = items.map((i) => i.id)
    ;[ids[index], ids[target]] = [ids[target], ids[index]]
    reorderItems(activeSchedule.id, ids)
  }

  function handleSaveName() {
    if (activeSchedule && scheduleName.trim()) {
      const { updateSchedule } = useScheduleStore.getState()
      updateSchedule(activeSchedule.id, { name: scheduleName.trim() })
    }
    setEditingName(false)
  }

  const items = activeSchedule?.items ?? []

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return ''
    const d = new Date(dateStr + 'T00:00:00')
    return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
  }

  const filteredPickerSongs = songs.filter((song) => {
    const q = pickerSearch.toLowerCase()
    return (
      song.title.toLowerCase().includes(q) ||
      song.author.toLowerCase().includes(q)
    )
  })

  function getItemIcon(type: string) {
    switch (type) {
      case 'song':
        return (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 18V5l12-2v13" />
            <circle cx="6" cy="18" r="3" />
            <circle cx="18" cy="16" r="3" />
          </svg>
        )
      case 'blank':
        return (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
          </svg>
        )
      case 'custom':
        return (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
          </svg>
        )
      default:
        return null
    }
  }

  return (
    <div className="h-full flex">
      {/* Schedule list - left */}
      <div className="flex flex-col border-r border-white/10" style={{ width: 400, minWidth: 400 }}>
        {/* Schedule header */}
        <div className="px-6 py-5 border-b border-white/10">
          <div className="flex items-center gap-2">
            {editingName ? (
              <input
                value={scheduleName}
                onChange={(e) => setScheduleName(e.target.value)}
                onBlur={handleSaveName}
                onKeyDown={(e) => e.key === 'Enter' && handleSaveName()}
                className="text-xl font-bold text-white bg-transparent border-b border-[#e94560] focus:outline-none"
                autoFocus
              />
            ) : (
              <h1 className="text-xl font-bold text-white">
                {activeSchedule?.name ?? 'Schedule'}
              </h1>
            )}
            <button
              onClick={() => setEditingName(true)}
              className="text-[#a0aec0] hover:text-white transition-colors p-1"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
            </button>
          </div>
          <p className="text-sm text-[#a0aec0] mt-1">{formatDate(activeSchedule?.date)}</p>
        </div>

        {/* Schedule items */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {items.length === 0 && (
            <div className="text-center text-[#a0aec0] py-16">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="mx-auto mb-3 opacity-30">
                <line x1="8" y1="6" x2="21" y2="6" />
                <line x1="8" y1="12" x2="21" y2="12" />
                <line x1="8" y1="18" x2="21" y2="18" />
                <line x1="3" y1="6" x2="3.01" y2="6" />
                <line x1="3" y1="12" x2="3.01" y2="12" />
                <line x1="3" y1="18" x2="3.01" y2="18" />
              </svg>
              <p className="text-sm">No items in schedule yet</p>
              <p className="text-xs mt-1 opacity-60">Add songs from the picker on the right</p>
            </div>
          )}
          {items.map((item, index) => (
            <div
              key={item.id}
              className="flex items-center gap-3 px-3 py-3 rounded-lg bg-[#16213e] border border-white/5 group hover:border-white/10 transition-colors"
            >
              {/* Drag handle */}
              <div className="text-[#a0aec0]/40 cursor-grab group-hover:text-[#a0aec0]/70 transition-colors">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                  <circle cx="9" cy="6" r="1.5" />
                  <circle cx="15" cy="6" r="1.5" />
                  <circle cx="9" cy="12" r="1.5" />
                  <circle cx="15" cy="12" r="1.5" />
                  <circle cx="9" cy="18" r="1.5" />
                  <circle cx="15" cy="18" r="1.5" />
                </svg>
              </div>

              {/* Order number */}
              <span className="text-[#a0aec0]/60 text-xs font-mono w-5 text-center">
                {index + 1}
              </span>

              {/* Type icon */}
              <span className={`${item.type === 'song' ? 'text-[#e94560]' : 'text-[#a0aec0]'}`}>
                {getItemIcon(item.type)}
              </span>

              {/* Item info */}
              <div className="flex-1 min-w-0">
                <div className="text-white text-sm font-medium truncate">
                  {item.type === 'song'
                    ? item.song?.title
                    : item.customTitle ?? 'Blank Slide'}
                </div>
                {item.type === 'song' && item.song && (
                  <div className="text-xs text-[#a0aec0] truncate">
                    {item.song.author}
                  </div>
                )}
              </div>

              {/* Reorder and remove */}
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => handleMove(index, 'up')}
                  disabled={index === 0}
                  className="p-1 rounded hover:bg-white/10 text-[#a0aec0] text-xs disabled:opacity-20 transition-colors"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="18 15 12 9 6 15" /></svg>
                </button>
                <button
                  onClick={() => handleMove(index, 'down')}
                  disabled={index === items.length - 1}
                  className="p-1 rounded hover:bg-white/10 text-[#a0aec0] text-xs disabled:opacity-20 transition-colors"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9" /></svg>
                </button>
                <button
                  onClick={() => handleRemove(item.id)}
                  className="p-1 rounded hover:bg-[#ef4444]/20 text-[#a0aec0] hover:text-[#ef4444] text-xs transition-colors"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Add item button */}
        <div className="p-4 border-t border-white/10">
          <div className="flex gap-2">
            <button
              onClick={() => {/* picker is always visible on right */}}
              className="flex-1 py-2.5 rounded-lg bg-[#e94560] hover:bg-[#ff6b6b] text-white text-sm font-medium transition-colors"
            >
              + Add Item
            </button>
            <button
              onClick={handleAddBlank}
              className="px-4 py-2.5 rounded-lg bg-[#0f3460] hover:bg-[#0f3460]/80 text-white text-sm font-medium transition-colors"
              title="Add blank slide"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
              </svg>
            </button>
            <button
              onClick={handleAddCustom}
              className="px-4 py-2.5 rounded-lg bg-[#0f3460] hover:bg-[#0f3460]/80 text-white text-sm font-medium transition-colors"
              title="Add custom text"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Song picker - right */}
      <div className="flex-1 flex flex-col p-6">
        <h2 className="text-lg font-bold text-white mb-4">Add Songs</h2>

        {/* Search */}
        <div className="relative mb-4">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#a0aec0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="absolute left-3 top-1/2 -translate-y-1/2">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            placeholder="Search songs..."
            value={pickerSearch}
            onChange={(e) => setPickerSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2.5 rounded-lg bg-[#16213e] text-white placeholder-[#a0aec0]/50 border border-white/10 focus:border-[#e94560] focus:outline-none text-sm"
          />
        </div>

        {/* Filter pills */}
        <div className="flex gap-2 mb-4">
          {(['recent', 'favorites', 'all'] as const).map((filter) => (
            <button
              key={filter}
              onClick={() => setPickerFilter(filter)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors capitalize ${
                pickerFilter === filter
                  ? 'bg-[#e94560] text-white'
                  : 'bg-[#16213e] text-[#a0aec0] hover:bg-[#0f3460] hover:text-white'
              }`}
            >
              {filter}
            </button>
          ))}
        </div>

        {/* Song grid */}
        <div className="flex-1 overflow-y-auto">
          <div className="grid grid-cols-2 gap-3">
            {filteredPickerSongs.length === 0 && (
              <p className="text-[#a0aec0] text-sm col-span-2 text-center py-8">
                No songs found. Add songs in the Library first.
              </p>
            )}
            {filteredPickerSongs.map((song) => (
              <div
                key={song.id}
                className="bg-[#16213e] rounded-lg p-4 border border-white/5 hover:border-white/15 transition-colors group"
              >
                <div className="flex items-start justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="text-white text-sm font-medium truncate">{song.title}</div>
                    <div className="text-xs text-[#a0aec0] truncate mt-0.5">{song.author}</div>
                    {song.tags.length > 0 && (
                      <div className="flex gap-1 mt-2 flex-wrap">
                        {song.tags.slice(0, 2).map((tag) => (
                          <span key={tag} className="text-[10px] px-1.5 py-0.5 rounded-full bg-[#0f3460] text-[#a0aec0]">
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => handleAddSong(song.id)}
                    className="shrink-0 w-8 h-8 rounded-lg bg-[#e94560]/20 hover:bg-[#e94560] text-[#e94560] hover:text-white flex items-center justify-center transition-colors ml-2"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
