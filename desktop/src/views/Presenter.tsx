import { useEffect, useState } from 'react'
import { usePresentationStore } from '../stores/presentationStore'
import { useScheduleStore, ScheduleItem } from '../stores/scheduleStore'
import { parseLyrics, Section } from '../stores/songStore'

export default function Presenter() {
  const {
    isLive,
    currentSlide,
    setLive,
    setCurrentSlide,
  } = usePresentationStore()

  const { activeSchedule } = useScheduleStore()

  const [selectedItemId, setSelectedItemId] = useState<string | null>(null)
  const [selectedVerseIndex, setSelectedVerseIndex] = useState<number>(0)
  const [previewSlide, setPreviewSlide] = useState<{ text: string; sectionType: string } | null>(null)

  const items = activeSchedule?.items ?? []

  // Get the selected schedule item
  const selectedItem = items.find(i => i.id === selectedItemId)
  
  // Parse verses for the selected item
  const verses: Section[] = selectedItem?.type === 'song' && selectedItem.song
    ? parseLyrics(selectedItem.song.lyrics)
    : selectedItem?.type === 'custom' && selectedItem.customText
    ? [{ type: 'Custom', lines: selectedItem.customText.split('\n').filter(l => l.trim()) }]
    : selectedItem?.type === 'blank'
    ? [{ type: 'Blank', lines: [''] }]
    : []

  // Auto-select first item if none selected
  useEffect(() => {
    if (!selectedItemId && items.length > 0) {
      setSelectedItemId(items[0].id)
    }
  }, [items, selectedItemId])

  // Update preview when verse selection changes
  useEffect(() => {
    if (verses.length > 0 && selectedVerseIndex < verses.length) {
      const verse = verses[selectedVerseIndex]
      setPreviewSlide({
        text: verse.lines.join('\n'),
        sectionType: verse.type,
      })
    }
  }, [selectedVerseIndex, verses])

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
          handleGoLive()
          break
        case 'Escape':
          e.preventDefault()
          if (isLive) handleStopLive()
          break
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [isLive, selectedVerseIndex, verses])

  function handleSelectItem(item: ScheduleItem) {
    setSelectedItemId(item.id)
    setSelectedVerseIndex(0)
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
    } else if (items.length > 0) {
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
    } else if (items.length > 0) {
      // Move to previous schedule item
      const currentIdx = items.findIndex(i => i.id === selectedItemId)
      if (currentIdx > 0) {
        const prevItem = items[currentIdx - 1]
        setSelectedItemId(prevItem.id)
        // Will auto-set to last verse of prev item after re-render
      }
    }
  }

  async function handleGoLive() {
    if (!isLive && window.electronAPI) {
      await window.electronAPI.openPresentation()
    }
    setLive(true)
    
    // Push current preview to live
    if (previewSlide) {
      setCurrentSlide(previewSlide)
      if (window.electronAPI) {
        window.electronAPI.updatePresentation(previewSlide)
      }
    }
  }

  async function handleStopLive() {
    setLive(false)
    if (window.electronAPI) {
      await window.electronAPI.closePresentation()
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
        handleGoLive()
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
      {/* Top row: Schedule | Verses | (empty for now) */}
      <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>
        
        {/* Schedule Panel */}
        <div style={{ 
          width: '240px', 
          minWidth: '240px',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: '#16213e',
          borderRight: '1px solid rgba(255,255,255,0.08)',
        }}>
          <div style={{ 
            padding: '16px 20px', 
            borderBottom: '1px solid rgba(255,255,255,0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
            <span style={{ fontSize: '13px', fontWeight: 700, color: '#ffffff' }}>Schedule</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  backgroundColor: isLive ? '#22c55e' : 'rgba(160,174,192,0.3)',
                }}
              />
              <span style={{ fontSize: '11px', fontWeight: 600, color: isLive ? '#22c55e' : '#a0aec0' }}>
                {isLive ? 'LIVE' : 'OFF'}
              </span>
            </div>
          </div>
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
        </div>

        {/* Verses Panel */}
        <div style={{ 
          width: '320px',
          minWidth: '320px',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: '#16213e',
          borderRight: '1px solid rgba(255,255,255,0.08)',
        }}>
          <div style={{ 
            padding: '16px 20px', 
            borderBottom: '1px solid rgba(255,255,255,0.08)',
          }}>
            <span style={{ fontSize: '13px', fontWeight: 700, color: '#ffffff' }}>
              {selectedItem ? getItemTitle(selectedItem) : 'Select an item'}
            </span>
          </div>
          <div style={{ flex: 1, overflowY: 'auto', padding: '8px' }}>
            {verses.map((verse, idx) => (
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
            ))}
          </div>
        </div>

        {/* Controls Column */}
        <div style={{ 
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '16px',
          padding: '20px',
        }}>
          <button
            onClick={handleGoLive}
            style={{
              padding: '16px 48px',
              borderRadius: '12px',
              fontSize: '16px',
              fontWeight: 700,
              border: 'none',
              cursor: 'pointer',
              backgroundColor: isLive ? '#22c55e' : '#e94560',
              color: '#ffffff',
            }}
          >
            {isLive ? '● LIVE' : 'GO LIVE'}
          </button>
          
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={handlePrevVerse}
              style={{
                padding: '12px 20px',
                borderRadius: '10px',
                backgroundColor: '#16213e',
                color: '#ffffff',
                border: 'none',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: 600,
              }}
            >
              ← Prev
            </button>
            <button
              onClick={handleBlackout}
              style={{
                padding: '12px 20px',
                borderRadius: '10px',
                backgroundColor: '#000000',
                color: '#ffffff',
                border: '1px solid rgba(255,255,255,0.15)',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: 600,
              }}
            >
              Black
            </button>
            <button
              onClick={handleNextVerse}
              style={{
                padding: '12px 20px',
                borderRadius: '10px',
                backgroundColor: '#16213e',
                color: '#ffffff',
                border: 'none',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: 600,
              }}
            >
              Next →
            </button>
          </div>

          {/* Keyboard hints */}
          <div style={{ 
            display: 'flex', 
            gap: '20px', 
            fontSize: '11px', 
            color: 'rgba(160,174,192,0.5)',
            marginTop: '20px',
          }}>
            <span>← → Navigate</span>
            <span>Space Next</span>
            <span>B Black</span>
            <span>Enter Live</span>
            <span>Esc Stop</span>
          </div>
        </div>
      </div>

      {/* Bottom row: Preview Output | Live Output */}
      <div style={{ 
        height: '200px',
        minHeight: '200px',
        display: 'flex',
        borderTop: '1px solid rgba(255,255,255,0.08)',
      }}>
        {/* Preview Output */}
        <div style={{ 
          flex: 1, 
          display: 'flex',
          flexDirection: 'column',
          borderRight: '1px solid rgba(255,255,255,0.08)',
        }}>
          <div style={{ 
            padding: '10px 16px', 
            borderBottom: '1px solid rgba(255,255,255,0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
            <span style={{ fontSize: '11px', fontWeight: 700, color: '#a0aec0', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Preview Output
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
            backgroundColor: '#000000',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
          }}>
            {previewSlide && previewSlide.sectionType !== 'blank' ? (
              <div style={{ textAlign: 'center' }}>
                <div style={{ 
                  fontSize: '10px', 
                  color: 'rgba(233,69,96,0.6)', 
                  marginBottom: '8px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                }}>
                  {previewSlide.sectionType}
                </div>
                <p style={{ 
                  color: '#ffffff', 
                  fontSize: '14px', 
                  lineHeight: 1.6,
                  margin: 0,
                  textShadow: '1px 1px 4px rgba(0,0,0,0.8)',
                  whiteSpace: 'pre-line',
                }}>
                  {previewSlide.text}
                </p>
              </div>
            ) : (
              <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '12px' }}>
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
            padding: '10px 16px', 
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
              Live Output
            </span>
          </div>
          <div style={{ 
            flex: 1, 
            backgroundColor: '#000000',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
            border: isLive ? '2px solid #22c55e' : '2px solid transparent',
          }}>
            {currentSlide && currentSlide.sectionType !== 'blank' ? (
              <div style={{ textAlign: 'center' }}>
                <div style={{ 
                  fontSize: '10px', 
                  color: 'rgba(34,197,94,0.6)', 
                  marginBottom: '8px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                }}>
                  {currentSlide.sectionType}
                </div>
                <p style={{ 
                  color: '#ffffff', 
                  fontSize: '14px', 
                  lineHeight: 1.6,
                  margin: 0,
                  textShadow: '1px 1px 4px rgba(0,0,0,0.8)',
                  whiteSpace: 'pre-line',
                }}>
                  {currentSlide.text}
                </p>
              </div>
            ) : (
              <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '12px' }}>
                {isLive ? 'Black screen' : 'Not live'}
              </span>
            )}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </div>
  )
}
