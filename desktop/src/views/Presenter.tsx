import { useEffect, useState, useCallback } from 'react'
import { usePresentationStore, getBackgroundStyle } from '../stores/presentationStore'
import { useScheduleStore, ScheduleItem, Schedule } from '../stores/scheduleStore'
import { useSongStore, parseLyrics, Section, Song } from '../stores/songStore'
import { useNdiOutput } from '../ndi/useNdiOutput'
import { useSyncStore } from '../stores/syncStore'
import { fetchSchedulesFromApi, apiScheduleToLocal } from '../services/apiSync'

export default function Presenter() {
  useNdiOutput()
  const {
    isLive,
    currentSlide,
    setLive,
    setCurrentSlide,
    fontSize,
    fontFamily,
    fontWeight,
    textColor,
    defaultBackground,
    backgrounds,
    loadBackgrounds,
    ndiEnabled,
    ndiRunning,
    ndiMockMode,
  } = usePresentationStore()

  const { activeSchedule, addItem, setSchedules, setActiveSchedule, schedules } = useScheduleStore()
  const { songs } = useSongStore()
  const { apiToken, apiBaseUrl } = useSyncStore()

  const [activeTab, setActiveTab] = useState<'schedule' | 'songs'>('schedule')
  const [songSearch, setSongSearch] = useState('')
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null)
  const [selectedSongId, setSelectedSongId] = useState<string | null>(null)
  const [selectedVerseIndex, setSelectedVerseIndex] = useState<number>(0)
  const [previewSlide, setPreviewSlide] = useState<{ text: string; sectionType: string } | null>(null)
  const [toast, setToast] = useState<string | null>(null)
  const [slideOverrideBg, setSlideOverrideBg] = useState<string | null>(null)
  const [showBgPicker, setShowBgPicker] = useState(false)
  const [isSyncingSchedules, setIsSyncingSchedules] = useState(false)
  
  // API schedules state for schedule list view
  const [apiSchedules, setApiSchedules] = useState<Schedule[]>([])
  const [selectedApiSchedule, setSelectedApiSchedule] = useState<Schedule | null>(null)
  const [viewMode, setViewMode] = useState<'list' | 'detail'>('list')

  useEffect(() => { loadBackgrounds() }, [])

  const showToast = useCallback((message: string) => {
    setToast(message)
    setTimeout(() => setToast(null), 3000)
  }, [])

  // Sync schedules from external API
  async function handleSyncSchedules() {
    if (!apiToken || !apiBaseUrl) {
      showToast('Configure API settings first')
      return
    }

    setIsSyncingSchedules(true)
    try {
      const result = await fetchSchedulesFromApi()
      
      if (!result.success) {
        showToast(result.error || 'Sync failed')
        setIsSyncingSchedules(false)
        return
      }

      const fetchedSchedules = (result.data || []).map(apiScheduleToLocal)
      
      // Filter to current and future schedules
      const today = new Date().toISOString().split('T')[0]
      const currentAndFuture = fetchedSchedules.filter(s => !s.date || s.date >= today)
      
      setApiSchedules(currentAndFuture)
      setViewMode('list')
      setSelectedApiSchedule(null)
      
      showToast(`Found ${currentAndFuture.length} schedule${currentAndFuture.length !== 1 ? 's' : ''}`)
    } catch (error) {
      console.error('Schedule sync error:', error)
      showToast('Sync failed: ' + (error instanceof Error ? error.message : 'Unknown error'))
    }
    setIsSyncingSchedules(false)
  }

  // Handle clicking on a schedule from the API list
  function handleSelectApiSchedule(schedule: Schedule) {
    setSelectedApiSchedule(schedule)
    setViewMode('detail')
    // Auto-select first item if available
    if (schedule.items && schedule.items.length > 0) {
      setSelectedItemId(schedule.items[0].id)
    }
  }

  // Go back to schedule list
  function handleBackToList() {
    setViewMode('list')
    setSelectedApiSchedule(null)
    setSelectedItemId(null)
  }

  const items = activeSchedule?.items ?? []
  
  // If viewing an API schedule, use its items instead
  const displayItems = selectedApiSchedule?.items ?? items

  // Filter songs by search
  const filteredSongs = songs.filter(song => {
    const q = songSearch.toLowerCase()
    return song.title.toLowerCase().includes(q) || 
           song.author.toLowerCase().includes(q) ||
           song.lyrics.toLowerCase().includes(q)
  })

  // Get the selected schedule item or direct song
  // Check both local schedule items and API schedule items
  const selectedItem = selectedApiSchedule?.items?.find(i => i.id === selectedItemId) 
    ?? items.find(i => i.id === selectedItemId)
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

  // Effective background: slide override > song bg > default
  const activeSong = activeTab === 'schedule' && selectedItem?.type === 'song' && selectedItem.song
    ? selectedItem.song
    : activeTab === 'songs' && selectedSong
    ? selectedSong
    : null
  const effectiveBg = slideOverrideBg || activeSong?.defaultBackground || defaultBackground

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
      const bgStyle = getBackgroundStyle(effectiveBg)
      const slide = {
        text: verse.lines.join('\n'),
        sectionType: verse.type,
        fontSize,
        fontFamily,
        fontWeight,
        textColor,
        ...bgStyle,
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
      setLive(false)
    } else {
      setLive(true)

      if (previewSlide) {
        const bgStyle = getBackgroundStyle(effectiveBg)
        const slideWithBg = { ...previewSlide, fontSize, fontFamily, fontWeight, textColor, ...bgStyle }
        setCurrentSlide(slideWithBg)
        if (window.electronAPI) {
          window.electronAPI.updatePresentation(slideWithBg)
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
      const bgStyle = getBackgroundStyle(effectiveBg)
      const slideWithBg = { ...previewSlide, fontSize, fontFamily, fontWeight, textColor, ...bgStyle }
      setCurrentSlide(slideWithBg)
      if (window.electronAPI) {
        window.electronAPI.updatePresentation(slideWithBg)
      }
      if (!isLive) {
        setLive(true)
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
          {ndiEnabled && ndiRunning && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '3px 10px',
              borderRadius: '6px',
              backgroundColor: ndiMockMode ? 'rgba(245,158,11,0.15)' : 'rgba(34,197,94,0.15)',
              border: `1px solid ${ndiMockMode ? 'rgba(245,158,11,0.3)' : 'rgba(34,197,94,0.3)'}`,
            }}>
              <div style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                backgroundColor: ndiMockMode ? '#f59e0b' : '#22c55e',
              }} />
              <span style={{
                fontSize: '10px',
                fontWeight: 700,
                color: ndiMockMode ? '#f59e0b' : '#22c55e',
                letterSpacing: '0.05em',
              }}>
                NDI{ndiMockMode ? ' MOCK' : ''}
              </span>
            </div>
          )}
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
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
              {/* Sync button and back button */}
              {apiToken && apiBaseUrl && (
                <div style={{ padding: '8px 12px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  {viewMode === 'detail' && selectedApiSchedule ? (
                    <button
                      onClick={handleBackToList}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '8px 12px',
                        borderRadius: '8px',
                        backgroundColor: 'rgba(255,255,255,0.05)',
                        color: '#a0aec0',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: '12px',
                        width: '100%',
                      }}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M19 12H5M12 19l-7-7 7-7" />
                      </svg>
                      Back to Schedules
                    </button>
                  ) : (
                    <button
                      onClick={handleSyncSchedules}
                      disabled={isSyncingSchedules}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        padding: '8px 12px',
                        borderRadius: '8px',
                        backgroundColor: isSyncingSchedules ? 'rgba(15,52,96,0.5)' : '#0f3460',
                        color: '#ffffff',
                        border: 'none',
                        cursor: isSyncingSchedules ? 'not-allowed' : 'pointer',
                        fontSize: '12px',
                        width: '100%',
                      }}
                    >
                      {isSyncingSchedules ? (
                        <>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ animation: 'pulse 1s ease-in-out infinite' }}>
                            <path d="M21 12a9 9 0 11-6.219-8.56" />
                          </svg>
                          Syncing...
                        </>
                      ) : (
                        <>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M21 2v6h-6M3 12a9 9 0 0115-6.7L21 8M3 22v-6h6M21 12a9 9 0 01-15 6.7L3 16" />
                          </svg>
                          Sync Schedules
                        </>
                      )}
                    </button>
                  )}
                </div>
              )}

              {/* Schedule list view (API schedules) */}
              {viewMode === 'list' && apiSchedules.length > 0 ? (
                <div style={{ flex: 1, overflowY: 'auto' }}>
                  {apiSchedules.map((schedule) => (
                    <div
                      key={schedule.id}
                      onClick={() => handleSelectApiSchedule(schedule)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        padding: '12px 16px',
                        cursor: 'pointer',
                        backgroundColor: 'transparent',
                        borderLeft: '3px solid transparent',
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.03)'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#e94560" strokeWidth="2">
                        <rect x="3" y="4" width="18" height="18" rx="2" />
                        <path d="M16 2v4M8 2v4M3 10h18" />
                      </svg>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ 
                          fontSize: '13px', 
                          color: '#ffffff',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}>
                          {schedule.name}
                        </div>
                        {schedule.date && (
                          <div style={{ fontSize: '11px', color: '#a0aec0' }}>
                            {schedule.date}
                          </div>
                        )}
                      </div>
                      <span style={{ fontSize: '11px', color: '#a0aec0' }}>
                        {schedule.items?.length || 0} items
                      </span>
                    </div>
                  ))}
                </div>
              ) : viewMode === 'detail' && selectedApiSchedule ? (
                /* Detail view - show schedule items */
                <div style={{ flex: 1, overflowY: 'auto' }}>
                  <div style={{ padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <div style={{ fontSize: '14px', fontWeight: 600, color: '#ffffff' }}>{selectedApiSchedule.name}</div>
                    {selectedApiSchedule.date && (
                      <div style={{ fontSize: '11px', color: '#a0aec0', marginTop: '4px' }}>{selectedApiSchedule.date}</div>
                    )}
                  </div>
                  {selectedApiSchedule.items && selectedApiSchedule.items.length > 0 ? (
                    selectedApiSchedule.items.map((item, idx) => (
                      <div
                        key={item.id}
                        onClick={() => {
                          setSelectedItemId(item.id)
                          setSelectedVerseIndex(0)
                        }}
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
                  ) : (
                    <div style={{ padding: '40px 20px', textAlign: 'center', color: '#a0aec0', fontSize: '13px' }}>
                      No items in this schedule
                    </div>
                  )}
                </div>
              ) : (
                /* Default: show local schedule items or empty state */
                <div style={{ flex: 1, overflowY: 'auto' }}>
                  {displayItems.length === 0 ? (
                    <div style={{ padding: '40px 20px', textAlign: 'center', color: '#a0aec0', fontSize: '13px' }}>
                      {apiToken && apiBaseUrl ? 'Click Sync to load schedules' : 'No items in schedule'}
                    </div>
                  ) : (
                    displayItems.map((item, idx) => (
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
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '11px', fontWeight: 700, color: '#a0aec0', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Preview
                  </span>
                  <button
                    onClick={() => setShowBgPicker(true)}
                    title="Change slide background"
                    style={{
                      padding: '3px 6px',
                      borderRadius: '4px',
                      backgroundColor: 'rgba(255,255,255,0.05)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      cursor: 'pointer',
                      color: '#a0aec0',
                      display: 'flex',
                      alignItems: 'center',
                    }}
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="3" width="18" height="18" rx="2" />
                      <circle cx="8.5" cy="8.5" r="1.5" />
                      <path d="M21 15l-5-5L5 21" />
                    </svg>
                  </button>
                </div>
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
                ...getBackgroundStyle(effectiveBg),
                backgroundSize: 'cover',
                backgroundPosition: 'center',
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
                      color: textColor, 
                      fontSize: `calc(${fontSize} * 0.25)`,
                      fontFamily: fontFamily,
                      fontWeight,
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
                ...getBackgroundStyle(effectiveBg),
                backgroundSize: 'cover',
                backgroundPosition: 'center',
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
                      color: currentSlide.textColor ?? textColor, 
                      fontSize: `calc(${fontSize} * 0.25)`,
                      fontFamily: fontFamily,
                      fontWeight: currentSlide.fontWeight ?? fontWeight,
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

      {/* Per-slide background picker modal */}
      {showBgPicker && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 50,
            backgroundColor: 'rgba(0,0,0,0.75)'
          }}
          onClick={() => setShowBgPicker(false)}
        >
          <div
            style={{
              borderRadius: '20px',
              border: '1px solid rgba(255,255,255,0.1)',
              width: '480px',
              maxHeight: '70vh',
              display: 'flex',
              flexDirection: 'column',
              backgroundColor: '#16213e',
              boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '20px 24px',
              borderBottom: '1px solid rgba(255,255,255,0.1)',
            }}>
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#ffffff', margin: 0 }}>Slide Background</h3>
              <button
                onClick={() => setShowBgPicker(false)}
                style={{ background: 'none', border: 'none', color: '#a0aec0', cursor: 'pointer', padding: '6px' }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>
              {/* Reset to song/default */}
              <button
                onClick={() => { setSlideOverrideBg(null); setShowBgPicker(false) }}
                style={{
                  width: '100%',
                  padding: '12px',
                  marginBottom: '16px',
                  borderRadius: '10px',
                  border: !slideOverrideBg
                    ? '2px solid #e94560'
                    : '1px solid rgba(255,255,255,0.1)',
                  backgroundColor: !slideOverrideBg
                    ? 'rgba(233,69,96,0.15)'
                    : 'rgba(255,255,255,0.05)',
                  color: '#ffffff',
                  cursor: 'pointer',
                  fontSize: '13px',
                }}
              >
                Use Song/Default Background
              </button>

              {backgrounds.length > 0 && (
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: '10px',
                }}>
                  {backgrounds.map((filename) => (
                    <button
                      key={filename}
                      onClick={() => {
                        setSlideOverrideBg(filename)
                        setShowBgPicker(false)
                      }}
                      style={{
                        aspectRatio: '16/9',
                        borderRadius: '10px',
                        border: slideOverrideBg === filename
                          ? '3px solid #e94560'
                          : '2px solid rgba(255,255,255,0.1)',
                        backgroundImage: `url(app-bg:///${filename})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        cursor: 'pointer',
                      }}
                    />
                  ))}
                </div>
              )}
              {backgrounds.length === 0 && (
                <p style={{ color: '#a0aec0', fontSize: '13px', textAlign: 'center' }}>
                  No backgrounds. Add them in Settings.
                </p>
              )}
            </div>
          </div>
        </div>
      )}

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
