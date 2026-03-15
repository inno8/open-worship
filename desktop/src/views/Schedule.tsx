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
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 18V5l12-2v13" />
            <circle cx="6" cy="18" r="3" />
            <circle cx="18" cy="16" r="3" />
          </svg>
        )
      case 'blank':
        return (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
          </svg>
        )
      case 'custom':
        return (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
    <div style={{ height: '100%', display: 'flex', backgroundColor: '#1a1a2e' }}>
      {/* Schedule list - left */}
      <div style={{ 
        width: '420px', 
        minWidth: '420px', 
        display: 'flex', 
        flexDirection: 'column',
        backgroundColor: '#16213e',
        borderRight: '1px solid rgba(255,255,255,0.08)'
      }}>
        {/* Schedule header */}
        <div style={{ padding: '28px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
            {editingName ? (
              <input
                value={scheduleName}
                onChange={(e) => setScheduleName(e.target.value)}
                onBlur={handleSaveName}
                onKeyDown={(e) => e.key === 'Enter' && handleSaveName()}
                style={{
                  fontSize: '22px',
                  fontWeight: 700,
                  color: '#ffffff',
                  backgroundColor: 'transparent',
                  border: 'none',
                  borderBottom: '2px solid #e94560',
                  outline: 'none',
                  padding: '4px 0',
                }}
                autoFocus
              />
            ) : (
              <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#ffffff', margin: 0 }}>
                {activeSchedule?.name ?? 'Schedule'}
              </h1>
            )}
            <button
              onClick={() => setEditingName(true)}
              style={{ 
                background: 'none', 
                border: 'none', 
                color: '#a0aec0', 
                cursor: 'pointer',
                padding: '6px',
                borderRadius: '8px',
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
            </button>
          </div>
          <p style={{ fontSize: '14px', color: '#a0aec0', margin: 0 }}>
            {formatDate(activeSchedule?.date)}
          </p>
        </div>

        {/* Schedule items */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
          {items.length === 0 && (
            <div style={{ textAlign: 'center', color: '#a0aec0', padding: '60px 20px' }}>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ margin: '0 auto 16px', opacity: 0.3 }}>
                <line x1="8" y1="6" x2="21" y2="6" />
                <line x1="8" y1="12" x2="21" y2="12" />
                <line x1="8" y1="18" x2="21" y2="18" />
                <line x1="3" y1="6" x2="3.01" y2="6" />
                <line x1="3" y1="12" x2="3.01" y2="12" />
                <line x1="3" y1="18" x2="3.01" y2="18" />
              </svg>
              <p style={{ fontSize: '15px', margin: '0 0 8px' }}>No items in schedule yet</p>
              <p style={{ fontSize: '13px', opacity: 0.6, margin: 0 }}>Add songs from the picker on the right</p>
            </div>
          )}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {items.map((item, index) => (
              <div
                key={item.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '14px',
                  padding: '16px',
                  borderRadius: '12px',
                  backgroundColor: '#1a1a2e',
                  border: '1px solid rgba(255,255,255,0.05)',
                }}
              >
                {/* Drag handle */}
                <div style={{ color: 'rgba(160,174,192,0.4)', cursor: 'grab' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <circle cx="9" cy="6" r="1.5" />
                    <circle cx="15" cy="6" r="1.5" />
                    <circle cx="9" cy="12" r="1.5" />
                    <circle cx="15" cy="12" r="1.5" />
                    <circle cx="9" cy="18" r="1.5" />
                    <circle cx="15" cy="18" r="1.5" />
                  </svg>
                </div>

                {/* Order number */}
                <span style={{ 
                  color: 'rgba(160,174,192,0.5)', 
                  fontSize: '12px', 
                  fontFamily: 'monospace',
                  width: '20px',
                  textAlign: 'center',
                }}>
                  {index + 1}
                </span>

                {/* Type icon */}
                <span style={{ color: item.type === 'song' ? '#e94560' : '#a0aec0' }}>
                  {getItemIcon(item.type)}
                </span>

                {/* Item info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ 
                    color: '#ffffff', 
                    fontSize: '14px', 
                    fontWeight: 500,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}>
                    {item.type === 'song'
                      ? item.song?.title
                      : item.customTitle ?? 'Blank Slide'}
                  </div>
                  {item.type === 'song' && item.song && (
                    <div style={{ 
                      fontSize: '12px', 
                      color: '#a0aec0',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}>
                      {item.song.author}
                    </div>
                  )}
                </div>

                {/* Reorder and remove */}
                <div style={{ display: 'flex', gap: '4px' }}>
                  <button
                    onClick={() => handleMove(index, 'up')}
                    disabled={index === 0}
                    style={{ 
                      padding: '6px', 
                      borderRadius: '6px', 
                      background: 'none',
                      border: 'none',
                      color: '#a0aec0',
                      cursor: index === 0 ? 'default' : 'pointer',
                      opacity: index === 0 ? 0.2 : 1,
                    }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="18 15 12 9 6 15" /></svg>
                  </button>
                  <button
                    onClick={() => handleMove(index, 'down')}
                    disabled={index === items.length - 1}
                    style={{ 
                      padding: '6px', 
                      borderRadius: '6px', 
                      background: 'none',
                      border: 'none',
                      color: '#a0aec0',
                      cursor: index === items.length - 1 ? 'default' : 'pointer',
                      opacity: index === items.length - 1 ? 0.2 : 1,
                    }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9" /></svg>
                  </button>
                  <button
                    onClick={() => handleRemove(item.id)}
                    style={{ 
                      padding: '6px', 
                      borderRadius: '6px', 
                      background: 'none',
                      border: 'none',
                      color: '#a0aec0',
                      cursor: 'pointer',
                    }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Add item button */}
        <div style={{ padding: '20px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              style={{
                flex: 1,
                padding: '14px',
                borderRadius: '12px',
                backgroundColor: '#e94560',
                color: '#ffffff',
                fontSize: '14px',
                fontWeight: 600,
                border: 'none',
                cursor: 'pointer',
              }}
            >
              + Add Item
            </button>
            <button
              onClick={handleAddBlank}
              title="Add blank slide"
              style={{
                padding: '14px 18px',
                borderRadius: '12px',
                backgroundColor: '#0f3460',
                color: '#ffffff',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
              </svg>
            </button>
            <button
              onClick={handleAddCustom}
              title="Add custom text"
              style={{
                padding: '14px 18px',
                borderRadius: '12px',
                backgroundColor: '#0f3460',
                color: '#ffffff',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Song picker - right */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '28px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#ffffff', marginBottom: '24px' }}>
          Add Songs
        </h2>

        {/* Search */}
        <div style={{ position: 'relative', marginBottom: '20px' }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#a0aec0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)' }}>
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            placeholder="Search songs..."
            value={pickerSearch}
            onChange={(e) => setPickerSearch(e.target.value)}
            style={{
              width: '100%',
              padding: '14px 16px 14px 48px',
              borderRadius: '12px',
              backgroundColor: '#16213e',
              color: '#ffffff',
              border: '1px solid rgba(255,255,255,0.1)',
              fontSize: '14px',
              outline: 'none',
            }}
          />
        </div>

        {/* Filter pills */}
        <div style={{ display: 'flex', gap: '10px', marginBottom: '24px' }}>
          {(['recent', 'favorites', 'all'] as const).map((filter) => (
            <button
              key={filter}
              onClick={() => setPickerFilter(filter)}
              style={{
                padding: '10px 20px',
                borderRadius: '20px',
                fontSize: '13px',
                fontWeight: 600,
                textTransform: 'capitalize',
                backgroundColor: pickerFilter === filter ? '#e94560' : '#16213e',
                color: pickerFilter === filter ? '#ffffff' : '#a0aec0',
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              {filter}
            </button>
          ))}
        </div>

        {/* Song grid */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
            {filteredPickerSongs.length === 0 && (
              <p style={{ color: '#a0aec0', fontSize: '14px', gridColumn: 'span 2', textAlign: 'center', padding: '40px 0' }}>
                No songs found. Add songs in the Library first.
              </p>
            )}
            {filteredPickerSongs.map((song) => (
              <div
                key={song.id}
                style={{
                  backgroundColor: '#16213e',
                  borderRadius: '14px',
                  padding: '20px',
                  border: '1px solid rgba(255,255,255,0.05)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ 
                      color: '#ffffff', 
                      fontSize: '15px', 
                      fontWeight: 600,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      marginBottom: '4px',
                    }}>
                      {song.title}
                    </div>
                    <div style={{ 
                      fontSize: '13px', 
                      color: '#a0aec0',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}>
                      {song.author}
                    </div>
                    {song.tags.length > 0 && (
                      <div style={{ display: 'flex', gap: '6px', marginTop: '12px', flexWrap: 'wrap' }}>
                        {song.tags.slice(0, 2).map((tag) => (
                          <span 
                            key={tag} 
                            style={{ 
                              fontSize: '11px', 
                              padding: '4px 10px', 
                              borderRadius: '12px', 
                              backgroundColor: '#0f3460', 
                              color: '#a0aec0' 
                            }}
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => handleAddSong(song.id)}
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '10px',
                      backgroundColor: 'rgba(233,69,96,0.15)',
                      color: '#e94560',
                      border: 'none',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginLeft: '12px',
                      flexShrink: 0,
                    }}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
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
