import { useEffect } from 'react'
import { usePresentationStore } from '../stores/presentationStore'
import { useSongStore, parseLyrics } from '../stores/songStore'

export default function Presenter() {
  const {
    isLive,
    currentSlide,
    sections,
    currentSectionIndex,
    currentLineIndex,
    setLive,
    setSections,
    goToSection,
    goToLine,
    nextSlide,
    prevSlide,
    showBlank,
  } = usePresentationStore()

  const { selectedSong } = useSongStore()

  // Load sections from selected song
  useEffect(() => {
    if (selectedSong) {
      const parsed = parseLyrics(selectedSong.lyrics)
      setSections(parsed)
    }
  }, [selectedSong, setSections])

  // Keyboard navigation
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return
      switch (e.key) {
        case ' ':
        case 'ArrowRight':
        case 'ArrowDown':
          e.preventDefault()
          nextSlide()
          break
        case 'ArrowLeft':
        case 'ArrowUp':
          e.preventDefault()
          prevSlide()
          break
        case 'b':
        case 'B':
          e.preventDefault()
          showBlank()
          break
        case 'Escape':
          e.preventDefault()
          if (isLive) {
            handleStopLive()
          }
          break
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [nextSlide, prevSlide, showBlank, setLive, isLive])

  // Compute next slide preview
  const currentSection = sections[currentSectionIndex]
  let nextPreviewText = ''
  if (currentSection) {
    if (currentLineIndex < currentSection.lines.length - 1) {
      nextPreviewText = currentSection.lines[currentLineIndex + 1]
    } else if (currentSectionIndex < sections.length - 1) {
      const nextSec = sections[currentSectionIndex + 1]
      nextPreviewText = nextSec.lines[0] ?? ''
    }
  }

  // Build slide timeline
  const allSlides: { sectionIdx: number; lineIdx: number; text: string; sectionType: string }[] = []
  sections.forEach((section, sIdx) => {
    section.lines.forEach((line, lIdx) => {
      allSlides.push({ sectionIdx: sIdx, lineIdx: lIdx, text: line, sectionType: section.type })
    })
  })
  const currentFlatIndex = allSlides.findIndex(
    (s) => s.sectionIdx === currentSectionIndex && s.lineIdx === currentLineIndex
  )

  async function handleGoLive() {
    if (window.electronAPI) {
      await window.electronAPI.openPresentation()
    }
    setLive(true)
    if (sections.length > 0) {
      goToSection(0)
    }
  }

  async function handleStopLive() {
    setLive(false)
    if (window.electronAPI) {
      await window.electronAPI.closePresentation()
    }
  }

  function handleBlackout() {
    showBlank()
  }

  function handleClear() {
    if (sections.length > 0) {
      goToSection(0)
    }
  }

  const buttonStyle: React.CSSProperties = {
    padding: '14px 24px',
    borderRadius: '12px',
    backgroundColor: '#16213e',
    color: '#ffffff',
    fontSize: '14px',
    fontWeight: 600,
    border: 'none',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  }

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', padding: '28px', backgroundColor: '#1a1a2e' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#ffffff', margin: '0 0 4px' }}>Presenter</h1>
          <p style={{ fontSize: '14px', color: '#a0aec0', margin: 0 }}>
            {selectedSong ? selectedSong.title : 'No song selected'}
          </p>
        </div>
        {/* Live status indicator */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              width: '12px',
              height: '12px',
              borderRadius: '50%',
              backgroundColor: isLive ? '#22c55e' : 'rgba(160,174,192,0.3)',
              animation: isLive ? 'pulse 1.5s ease-in-out infinite' : 'none',
            }}
          />
          <span style={{ 
            fontSize: '12px', 
            fontWeight: 700, 
            letterSpacing: '0.05em',
            color: isLive ? '#22c55e' : 'rgba(160,174,192,0.5)' 
          }}>
            {isLive ? 'LIVE' : 'OFF AIR'}
          </span>
        </div>
      </div>

      {sections.length === 0 ? (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ 
              width: '80px', 
              height: '80px', 
              borderRadius: '20px', 
              backgroundColor: 'rgba(160,174,192,0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 20px',
            }}>
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#a0aec0" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.5 }}>
                <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
                <line x1="8" y1="21" x2="16" y2="21" />
                <line x1="12" y1="17" x2="12" y2="21" />
              </svg>
            </div>
            <p style={{ color: '#a0aec0', fontSize: '16px', margin: 0 }}>Select a song from the Library to present</p>
          </div>
        </div>
      ) : (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '24px', minHeight: 0 }}>
          {/* Slide previews */}
          <div style={{ flex: 1, display: 'flex', gap: '20px', minHeight: 0 }}>
            {/* Current slide (larger) */}
            <div style={{ flex: 2, display: 'flex', flexDirection: 'column' }}>
              <div style={{ 
                fontSize: '11px', 
                fontWeight: 700, 
                textTransform: 'uppercase', 
                letterSpacing: '0.1em', 
                color: 'rgba(160,174,192,0.5)', 
                marginBottom: '12px' 
              }}>
                Current
              </div>
              <div style={{
                flex: 1,
                borderRadius: '16px',
                backgroundColor: '#000000',
                border: '3px solid #e94560',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '40px',
                position: 'relative',
                overflow: 'hidden',
              }}>
                {currentSlide?.sectionType && currentSlide.sectionType !== 'blank' && (
                  <div style={{
                    position: 'absolute',
                    top: '16px',
                    left: '20px',
                    fontSize: '11px',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.1em',
                    color: 'rgba(233,69,96,0.5)',
                  }}>
                    {currentSlide.sectionType}
                  </div>
                )}
                <p style={{
                  color: '#ffffff',
                  textAlign: 'center',
                  fontSize: '28px',
                  lineHeight: 1.5,
                  fontWeight: 500,
                  textShadow: '2px 2px 8px rgba(0,0,0,0.8)',
                  margin: 0,
                }}>
                  {currentSlide?.text || 'Ready'}
                </p>
              </div>
            </div>

            {/* Next slide (smaller) */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              <div style={{ 
                fontSize: '11px', 
                fontWeight: 700, 
                textTransform: 'uppercase', 
                letterSpacing: '0.1em', 
                color: 'rgba(160,174,192,0.5)', 
                marginBottom: '12px' 
              }}>
                Next
              </div>
              <div style={{
                flex: 1,
                borderRadius: '16px',
                backgroundColor: 'rgba(0,0,0,0.4)',
                border: '1px solid rgba(255,255,255,0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '32px',
              }}>
                <p style={{
                  color: 'rgba(255,255,255,0.4)',
                  textAlign: 'center',
                  fontSize: '20px',
                  lineHeight: 1.5,
                  margin: 0,
                }}>
                  {nextPreviewText || '- End -'}
                </p>
              </div>
            </div>
          </div>

          {/* Quick controls */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
            <button onClick={prevSlide} style={buttonStyle}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6" /></svg>
              Prev
            </button>
            <button
              onClick={handleGoLive}
              style={{
                ...buttonStyle,
                padding: '14px 36px',
                backgroundColor: isLive ? '#22c55e' : '#e94560',
              }}
            >
              {isLive ? 'LIVE' : 'GO LIVE'}
            </button>
            <button
              onClick={handleBlackout}
              style={{
                ...buttonStyle,
                backgroundColor: '#000000',
                border: '1px solid rgba(255,255,255,0.15)',
              }}
            >
              Blackout
            </button>
            <button onClick={handleClear} style={buttonStyle}>
              Clear
            </button>
            <button style={buttonStyle}>
              Logo
            </button>
            <button onClick={nextSlide} style={buttonStyle}>
              Next
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6" /></svg>
            </button>
          </div>

          {/* Slide timeline */}
          <div>
            <div style={{ 
              fontSize: '11px', 
              fontWeight: 700, 
              textTransform: 'uppercase', 
              letterSpacing: '0.1em', 
              color: 'rgba(160,174,192,0.5)', 
              marginBottom: '12px' 
            }}>
              Slide Sequence
            </div>
            <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '8px' }}>
              {allSlides.map((slide, idx) => (
                <button
                  key={idx}
                  onClick={() => goToLine(slide.sectionIdx, slide.lineIdx)}
                  title={slide.text}
                  style={{
                    flexShrink: 0,
                    padding: '10px 14px',
                    borderRadius: '8px',
                    fontSize: '12px',
                    fontWeight: 600,
                    backgroundColor: idx === currentFlatIndex ? '#e94560' : '#16213e',
                    color: idx === currentFlatIndex ? '#ffffff' : 'rgba(160,174,192,0.7)',
                    border: 'none',
                    cursor: 'pointer',
                  }}
                >
                  {idx + 1}
                </button>
              ))}
            </div>
          </div>

          {/* Section jump */}
          <div>
            <div style={{ 
              fontSize: '11px', 
              fontWeight: 700, 
              textTransform: 'uppercase', 
              letterSpacing: '0.1em', 
              color: 'rgba(160,174,192,0.5)', 
              marginBottom: '12px' 
            }}>
              Sections
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
              {sections.map((section, idx) => (
                <button
                  key={idx}
                  onClick={() => goToSection(idx)}
                  style={{
                    padding: '10px 18px',
                    borderRadius: '10px',
                    fontSize: '13px',
                    fontWeight: 600,
                    backgroundColor: idx === currentSectionIndex ? '#e94560' : '#16213e',
                    color: idx === currentSectionIndex ? '#ffffff' : '#a0aec0',
                    border: 'none',
                    cursor: 'pointer',
                  }}
                >
                  {section.type}
                </button>
              ))}
            </div>
          </div>

          {/* Keyboard hints */}
          <div style={{ 
            display: 'flex', 
            gap: '32px', 
            fontSize: '12px', 
            color: 'rgba(160,174,192,0.5)', 
            borderTop: '1px solid rgba(255,255,255,0.05)', 
            paddingTop: '20px' 
          }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <kbd style={{
                padding: '4px 10px',
                borderRadius: '6px',
                backgroundColor: 'rgba(255,255,255,0.05)',
                color: '#a0aec0',
                fontSize: '11px',
                fontFamily: 'monospace',
              }}>
                ← →
              </kbd>
              Navigate
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <kbd style={{
                padding: '4px 10px',
                borderRadius: '6px',
                backgroundColor: 'rgba(255,255,255,0.05)',
                color: '#a0aec0',
                fontSize: '11px',
                fontFamily: 'monospace',
              }}>
                Space
              </kbd>
              Next
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <kbd style={{
                padding: '4px 10px',
                borderRadius: '6px',
                backgroundColor: 'rgba(255,255,255,0.05)',
                color: '#a0aec0',
                fontSize: '11px',
                fontFamily: 'monospace',
              }}>
                B
              </kbd>
              Black screen
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <kbd style={{
                padding: '4px 10px',
                borderRadius: '6px',
                backgroundColor: 'rgba(255,255,255,0.05)',
                color: '#a0aec0',
                fontSize: '11px',
                fontFamily: 'monospace',
              }}>
                Esc
              </kbd>
              Stop live
            </span>
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
