import { useEffect, useState, useCallback } from 'react'
import { usePresentationStore } from '../stores/presentationStore'
import { useScheduleStore, ScheduleItem } from '../stores/scheduleStore'
import { useSongStore, parseLyrics, Section, Song } from '../stores/songStore'

export default function Presenter() {
  const {
    isLive,
    currentSlide,
    setLive,
    setCurrentSlide,
    fontSize,
    fontFamily,
    defaultBackground,
  } = usePresentationStore()

  const { activeSchedule, addItem } = useScheduleStore()
  const { songs } = useSongStore()

  const [activeTab, setActiveTab] = useState<'schedule' | 'songs'>('schedule')
  const [songSearch, setSongSearch] = useState('')
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null)
  const [selectedSongId, setSelectedSongId] = useState<string | null>(null)
  const [selectedVerseIndex, setSelectedVerseIndex] = useState<number>(0)
  const [previewSlide, setPreviewSlide] = useState<{ text: string; sectionType: string } | null>(null)
  const [toast, setToast] = useState<string | null>(null)

  const showToast = useCallback((message: string) => {
    setToast(message)
    setTimeout(() => setToast(null), 3000)
  }, [])

  const items = activeSchedule?.items ?? []

  // Filter songs by search
  const filteredSongs = songs.filter(song => {
    const q = songSearch.toLowerCase()
    return song.title.toLowerCase().includes(q) || 
           song.author.toLowerCase().includes(q) ||
           song.lyrics.toLowerCase().includes(q)
  })

  // Get the selected schedule item or direct song
  const selectedItem = items.find(i => i.id === selectedItemId)
  const selectedSong = songs.find(s => s.id === selectedSongId)
  
  // Parse verses - from schedule item or direct song
  const verses: Section[] = activeTab === 'schedule' && selectedItem?.type === 'song' && selectedItem.song
    ? parseLyrics(selectedItem.song.lyrics)
    : activeTab === 'schedule' && selectedItem?.type === 'custom' && selectedItem.customText
    ? [{ type: 'Custom', lines: selectedItem.customText.split('\n').filter(l => l.trim()) }]
    : activeTab === 'schedule' && selectedItem?.type === 'blank'
    ? [{ type: 'Blank', lines: [''] }]
    : activeTab === 'songs' && selectedSong
    ? parseLyrics(selectedSong.lyrics)
    : []

  // Get current title for verse panel
  const currentTitle = activeTab === 'schedule' && selectedItem
    ? getItemTitle(selectedItem)
    : activeTab === 'songs' && selectedSong
    ? selectedSong.title
    : 'Select an item'

  // Auto-select first item if none selected
  useEffect(() => {
    if (activeTab === 'schedule' && !selectedItemId && items.length > 0) {
      setSelectedItemId(items[0].id)
    }
  }, [items, selectedItemId, activeTab])

  // Update preview when verse selection changes
  useEffect(() => {
    if (verses.length > 0 && selectedVerseIndex < verses.length) {
      const verse = verses[selectedVerseIndex]
      setPreviewSlide({
        text: verse.lines.join('\n'),
        sectionType: verse.type,
      })
    } else {
      setPreviewSlide(null)
    }
  }, [selectedVerseIndex, verses])

  // Reset verse index when switching items
  useEffect(() => {
    setSelectedVerseIndex(0)
  }, [selectedItemId, selectedSongId])

  // Keyboard navigation
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return
      
      switch (e.key) {
        case ' ':
        case 'ArrowRight':
        case 'ArrowDown':
          e.preventDefault()
          handleNextVerse()
          break
        case 'ArrowLeft':
        case 'ArrowUp':
          e.preventDefault()
          handlePrevVerse()
          break
        case 'b':
        case 'B':
          e.preventDefault()
          handleBlackout()
          break
        case 'Enter':
          e.preventDefault()
          handleToggleLive()
          break
        case 'Escape':
          e.preventDefault()
          if (isLive) handleToggleLive()
          break
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [isLive, selectedVerseIndex, verses])

  function handleSelectItem(item: ScheduleItem) {
    setActiveTab('schedule')
    setSelectedItemId(item.id)
    setSelectedSongId(null)
    setSelectedVerseIndex(0)
  }

  function handleSelectSong(song: Song) {
    setSelectedSongId(song.id)
    setSelectedItemId(null)
    setSelectedVerseIndex(0)
  }

  async function handleAddSongToSchedule(song: Song) {
    let schedule = activeSchedule
    
    // Create a schedule if none exists
    if (!schedule) {
      const { addSchedule, setActiveSchedule } = useScheduleStore.getState()
      const now = new Date().toISOString()
      const newSchedule = {
        id: crypto.randomUUID(),
        name: 'Sunday Service',
        date: new Date().toISOString().split('T')[0],
        notes: '',
        items: [],
        createdAt: now,
        updatedAt: now,
      }
      await addSchedule(newSchedule)
      setActiveSchedule(newSchedule)
      schedule = newSchedule
    }
    
    const item: ScheduleItem = {
      id: crypto.randomUUID(),
      order: schedule.items.length,
      type: 'song',
      song,
    }
    await addItem(schedule.id, item)
    showToast(`"${song.title}" added to schedule`)
  }

  function handleSelectVerse(index: number) {
    setSelectedVerseIndex(index)
    const verse = verses[index]
    if (verse) {
      const slide = {
        text: verse.lines.join('\n'),
        sectionType: verse.type,
        backgroundColor: '#000000',
      }
      setPreviewSlide(slide)
      
      // If live, also update the live output
      if (isLive) {
        setCurrentSlide(slide)
        if (window.electronAPI) {
          window.electronAPI.updatePresentation(slide)
        }
      }
    }
  }

  function handleNextVerse() {
    if (selectedVerseIndex < verses.length - 1) {
      handleSelectVerse(selectedVerseIndex + 1)
    } else if (activeTab === 'schedule' && items.length > 0) {
      // Move to next schedule item
      const currentIdx = items.findIndex(i => i.id === selectedItemId)
      if (currentIdx < items.length - 1) {
        setSelectedItemId(items[currentIdx + 1].id)
        setSelectedVerseIndex(0)
      }
    }
  }

  function handlePrevVerse() {
    if (selectedVerseIndex > 0) {
      handleSelectVerse(selectedVerseIndex - 1)
    } else if (activeTab === 'schedule' && items.length > 0) {
      // Move to previous schedule item
      const currentIdx = items.findIndex(i => i.id === selectedItemId)
      if (currentIdx > 0) {
        setSelectedItemId(items[currentIdx - 1].id)
      }
    }
  }

  function handleToggleLive() {
    if (isLive) {
      // Stop live - just toggle state, OBS/NDI will stop receiving
      setLive(false)
    } else {
      // Go live - start sending to OBS/NDI
      setLive(true)
      
      // Push current preview to live output
      if (previewSlide) {
        setCurrentSlide(previewSlide)
        if (window.electronAPI) {
          window.electronAPI.updatePresentation(previewSlide)
        }
      }
    }
  }

  function handleBlackout() {
    const blankSlide = { text: '', sectionType: 'blank', backgroundColor: '#000000' }
    if (isLive) {
      setCurrentSlide(blankSlide)
      if (window.electronAPI) {
        window.electronAPI.updatePresentation(blankSlide)
      }
    }
  }

  function handlePushToLive() {
    if (previewSlide) {
      setCurrentSlide(previewSlide)
      if (window.electronAPI) {
        window.electronAPI.updatePresentation(previewSlide)
      }
      if (!isLive) {
        handleToggleLive()
      }
    }
  }

  function getItemTitle(item: ScheduleItem): string {
    if (item.type === 'song' && item.song) return item.song.title
    if (item.type === 'custom') return item.customTitle || 'Custom Text'
    if (item.type === 'blank') return 'Blank Slide'
    return 'Unknown'
  }

  function getItemIcon(type: string) {
    switch (type) {
      case 'song':
        return (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 18V5l12-2v13" />
            <circle cx="6" cy="18" r="3" />
            <circle cx="18" cy="16" r="3" />
          </svg>
        )
      case 'blank':
        return (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="18" height="18" rx="2" />
          </svg>
        )
      case 'custom':
        return (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
          </svg>
        )
      default:
        return null
    }
  }

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', backgroundColor: '#1a1a2e' }}>
      {/* Header with GO LIVE button */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between', 
        padding: '12px 20px',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
        backgroundColor: '#16213e',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <span style={{ fontSize: '15px', fontWeight: 700, color: '#ffffff' }}>Presenter</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: isLive ? '#22c55e' : 'rgba(160,174,192,0.3)',
                animation: isLive ? 'pulse 1.5s ease-in-out infinite' : 'none',
              }}
            />
            <span style={{ fontSize: '11px', fontWeight: 600, color: isLive ? '#22c55e' : '#a0aec0' }}>
              {isLive ? 'LIVE' : 'OFF AIR'}
            </span>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            onClick={handleBlackout}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              backgroundColor: '#000000',
              color: '#ffffff',
              border: '1px solid rgba(255,255,255,0.15)',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: 600,
            }}
          >
            Black
          </button>
          <button
            onClick={handleToggleLive}
            style={{
              padding: '8px 24px',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: 700,
              border: 'none',
              cursor: 'pointer',
              backgroundColor: isLive ? '#22c55e' : '#e94560',
              color: '#ffffff',
            }}
          >
            {isLive ? '● STOP' : 'GO LIVE'}
          </button>
        </div>
      </div>

      {/* Main content */}
      <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>
        
        {/* Schedule/Songs Panel with Tabs */}
        <div style={{ 
          width: '280px', 
          minWidth: '280px',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: '#16213e',
          borderRight: '1px solid rgba(255,255,255,0.08)',
        }}>
          {/* Tabs */}
          <div style={{ 
            display: 'flex',
            borderBottom: '1px solid rgba(255,255,255,0.08)',
          }}>
            <button
              onClick={() => setActiveTab('schedule')}
              style={{
                flex: 1,
                padding: '12px',
                backgroundColor: activeTab === 'schedule' ? 'rgba(233,69,96,0.15)' : 'transparent',
                color: activeTab === 'schedule' ? '#e94560' : '#a0aec0',
                border: 'none',
                borderBottom: activeTab === 'schedule' ? '2px solid #e94560' : '2px solid transparent',
                cursor: 'pointer',
                fontSize: '12px',
                fontWeight: 600,
              }}
            >
              Schedule
            </button>
            <button
              onClick={() => setActiveTab('songs')}
              style={{
                flex: 1,
                padding: '12px',
                backgroundColor: activeTab === 'songs' ? 'rgba(233,69,96,0.15)' : 'transparent',
                color: activeTab === 'songs' ? '#e94560' : '#a0aec0',
                border: 'none',
                borderBottom: activeTab === 'songs' ? '2px solid #e94560' : '2px solid transparent',
                cursor: 'pointer',
                fontSize: '12px',
                fontWeight: 600,
              }}
            >
              Songs
            </button>
          </div>

          {/* Tab Content */}
          {activeTab === 'schedule' ? (
            <div style={{ flex: 1, overflowY: 'auto' }}>
              {items.length === 0 ? (
                <div style={{ padding: '40px 20px', textAlign: 'center', color: '#a0aec0', fontSize: '13px' }}>
                  No items in schedule
                </div>
              ) : (
                items.map((item, idx) => (
                  <div
                    key={item.id}
                    onClick={() => handleSelectItem(item)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '12px 16px',
                      cursor: 'pointer',
                      backgroundColor: selectedItemId === item.id ? 'rgba(233,69,96,0.15)' : 'transparent',
                      borderLeft: selectedItemId === item.id ? '3px solid #e94560' : '3px solid transparent',
                    }}
                  >
                    <span style={{ 
                      fontSize: '11px', 
                      color: 'rgba(160,174,192,0.5)', 
                      fontFamily: 'monospace',
                      width: '16px',
                    }}>
                      {idx + 1}
                    </span>
                    <span style={{ color: item.type === 'song' ? '#e94560' : '#a0aec0' }}>
                      {getItemIcon(item.type)}
                    </span>
                    <span style={{ 
                      fontSize: '13px', 
                      color: '#ffffff',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      flex: 1,
                    }}>
                      {getItemTitle(item)}
                    </span>
                  </div>
                ))
              )}
            </div>
          ) : (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
              {/* Search */}
              <div style={{ padding: '12px' }}>
                <div style={{ position: 'relative' }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#a0aec0" strokeWidth="2" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }}>
                    <circle cx="11" cy="11" r="8" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                  </svg>
                  <input
                    type="text"
                    placeholder="Search songs..."
                    value={songSearch}
                    onChange={(e) => setSongSearch(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 12px 10px 36px',
                      borderRadius: '8px',
                      backgroundColor: '#1a1a2e',
                      color: '#ffffff',
                      border: '1px solid rgba(255,255,255,0.1)',
                      fontSize: '13px',
                      outline: 'none',
                    }}
                  />
                </div>
              </div>
              {/* Song List */}
              <div style={{ flex: 1, overflowY: 'auto' }}>
                {filteredSongs.length === 0 ? (
                  <div style={{ padding: '40px 20px', textAlign: 'center', color: '#a0aec0', fontSize: '13px' }}>
                    No songs found
                  </div>
                ) : (
                  filteredSongs.map((song) => (
                    <div
                      key={song.id}
                      onClick={() => handleSelectSong(song)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        padding: '10px 16px',
                        cursor: 'pointer',
                        backgroundColor: selectedSongId === song.id ? 'rgba(233,69,96,0.15)' : 'transparent',
                        borderLeft: selectedSongId === song.id ? '3px solid #e94560' : '3px solid transparent',
                      }}
                    >
                      <span style={{ color: '#e94560' }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M9 18V5l12-2v13" />
                          <circle cx="6" cy="18" r="3" />
                          <circle cx="18" cy="16" r="3" />
                        </svg>
                      </span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ 
                          fontSize: '13px', 
                          color: '#ffffff',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}>
                          {song.title}
                        </div>
                        <div style={{ 
                          fontSize: '11px', 
                          color: '#a0aec0',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}>
                          {song.author}
                        </div>
                      </div>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleAddSongToSchedule(song) }}
                        title="Add to schedule"
                        style={{
                          padding: '4px 8px',
                          borderRadius: '6px',
                          backgroundColor: 'rgba(255,255,255,0.05)',
                          color: '#a0aec0',
                          border: 'none',
                          cursor: 'pointer',
                          fontSize: '11px',
                        }}
                      >
                        +
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Verses Panel */}
        <div style={{ 
          width: '300px',
          minWidth: '300px',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: '#16213e',
          borderRight: '1px solid rgba(255,255,255,0.08)',
        }}>
          <div style={{ 
            padding: '12px 16px', 
            borderBottom: '1px solid rgba(255,255,255,0.08)',
          }}>
            <span style={{ fontSize: '13px', fontWeight: 700, color: '#ffffff' }}>
              {currentTitle}
            </span>
          </div>
          <div style={{ flex: 1, overflowY: 'auto', padding: '8px' }}>
            {verses.length === 0 ? (
              <div style={{ padding: '40px 20px', textAlign: 'center', color: '#a0aec0', fontSize: '13px' }}>
                Select an item to see verses
              </div>
            ) : (
              verses.map((verse, idx) => (
                <div
                  key={idx}
                  onClick={() => handleSelectVerse(idx)}
                  onDoubleClick={handlePushToLive}
                  style={{
                    padding: '12px 14px',
                    marginBottom: '6px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    backgroundColor: selectedVerseIndex === idx 
                      ? 'rgba(233,69,96,0.2)' 
                      : 'rgba(255,255,255,0.03)',
                    border: selectedVerseIndex === idx 
                      ? '1px solid #e94560' 
                      : '1px solid transparent',
                  }}
                >
                  <div style={{ 
                    fontSize: '10px', 
                    fontWeight: 700, 
                    color: '#e94560', 
                    marginBottom: '6px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                  }}>
                    {verse.type}
                  </div>
                  <div style={{ fontSize: '12px', color: '#ffffff', lineHeight: 1.5 }}>
                    {verse.lines.slice(0, 3).map((line, i) => (
                      <div key={i} style={{ 
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}>
                        {line}
                      </div>
                    ))}
                    {verse.lines.length > 3 && (
                      <div style={{ color: '#a0aec0', fontStyle: 'italic' }}>
                        +{verse.lines.length - 3} more lines
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Preview and Live Outputs */}
        <div style={{ 
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          minWidth: '300px',
        }}>
          <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>
            {/* Preview Output */}
            <div style={{ 
              flex: 1, 
              display: 'flex',
              flexDirection: 'column',
              borderRight: '1px solid rgba(255,255,255,0.08)',
            }}>
              <div style={{ 
                padding: '12px 16px', 
                borderBottom: '1px solid rgba(255,255,255,0.08)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}>
                <span style={{ fontSize: '11px', fontWeight: 700, color: '#a0aec0', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Preview
                </span>
                <button
                  onClick={handlePushToLive}
                  style={{
                    padding: '4px 10px',
                    borderRadius: '6px',
                    backgroundColor: '#e94560',
                    color: '#ffffff',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '10px',
                    fontWeight: 600,
                  }}
                >
                  → LIVE
                </button>
              </div>
              <div style={{ 
                flex: 1, 
                backgroundColor: defaultBackground,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '24px',
              }}>
                {previewSlide && previewSlide.sectionType !== 'blank' ? (
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ 
                      fontSize: '10px', 
                      color: 'rgba(233,69,96,0.6)', 
                      marginBottom: '12px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.1em',
                    }}>
                      {previewSlide.sectionType}
                    </div>
                    <p style={{ 
                      color: '#ffffff', 
                      fontSize: `calc(${fontSize} * 0.25)`,
                      fontFamily: fontFamily,
                      lineHeight: 1.6,
                      margin: 0,
                      textShadow: '1px 1px 4px rgba(0,0,0,0.8)',
                      whiteSpace: 'pre-line',
                    }}>
                      {previewSlide.text}
                    </p>
                  </div>
                ) : (
                  <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '14px' }}>
                    Select a verse to preview
                  </span>
                )}
              </div>
            </div>

            {/* Live Output */}
            <div style={{ 
              flex: 1, 
              display: 'flex',
              flexDirection: 'column',
            }}>
              <div style={{ 
                padding: '12px 16px', 
                borderBottom: '1px solid rgba(255,255,255,0.08)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}>
                <div
                  style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    backgroundColor: isLive ? '#22c55e' : 'rgba(160,174,192,0.3)',
                    animation: isLive ? 'pulse 1.5s ease-in-out infinite' : 'none',
                  }}
                />
                <span style={{ fontSize: '11px', fontWeight: 700, color: isLive ? '#22c55e' : '#a0aec0', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Live
                </span>
              </div>
              <div style={{ 
                flex: 1, 
                backgroundColor: defaultBackground,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '24px',
                border: isLive ? '2px solid #22c55e' : '2px solid transparent',
              }}>
                {currentSlide && currentSlide.sectionType !== 'blank' ? (
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ 
                      fontSize: '10px', 
                      color: 'rgba(34,197,94,0.6)', 
                      marginBottom: '12px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.1em',
                    }}>
                      {currentSlide.sectionType}
                    </div>
                    <p style={{ 
                      color: '#ffffff', 
                      fontSize: `calc(${fontSize} * 0.25)`,
                      fontFamily: fontFamily,
                      lineHeight: 1.6,
                      margin: 0,
                      textShadow: '1px 1px 4px rgba(0,0,0,0.8)',
                      whiteSpace: 'pre-line',
                    }}>
                      {currentSlide.text}
                    </p>
                  </div>
                ) : (
                  <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '14px' }}>
                    {isLive ? 'Black screen' : 'Not live'}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Keyboard hints */}
          <div style={{ 
            display: 'flex', 
            justifyContent: 'center',
            gap: '24px', 
            fontSize: '11px', 
            color: 'rgba(160,174,192,0.4)',
            padding: '10px',
            borderTop: '1px solid rgba(255,255,255,0.05)',
          }}>
            <span>← → Navigate</span>
            <span>Space Next</span>
            <span>B Black</span>
            <span>Enter Live</span>
            <span>Esc Stop</span>
          </div>
        </div>
      </div>

      {/* Toast notification */}
      {toast && (
        <div style={{ position: 'fixed', bottom: '32px', left: '50%', transform: 'translateX(-50%)', zIndex: 50 }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '12px', 
            padding: '14px 20px', 
            borderRadius: '10px', 
            border: '1px solid rgba(255,255,255,0.1)',
            backgroundColor: '#16213e', 
            boxShadow: '0 10px 25px rgba(0,0,0,0.3)' 
          }}>
            <div style={{ 
              width: '20px', 
              height: '20px', 
              borderRadius: '50%', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              backgroundColor: 'rgba(34,197,94,0.2)' 
            }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <span style={{ color: '#ffffff', fontWeight: 500, fontSize: '13px' }}>{toast}</span>
          </div>
        </div>
      )}

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </div>
  )
}
