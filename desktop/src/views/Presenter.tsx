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

  return (
    <div className="h-full flex flex-col p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-bold text-white">Presenter</h1>
          <p className="text-sm text-[#a0aec0]">
            {selectedSong ? selectedSong.title : 'No song selected'}
          </p>
        </div>
        {/* Live status indicator */}
        <div className="flex items-center gap-2">
          <div
            className={`w-2.5 h-2.5 rounded-full ${
              isLive ? 'bg-green-500' : 'bg-[#a0aec0]/30'
            }`}
            style={isLive ? { animation: 'pulse-live 1.5s ease-in-out infinite' } : undefined}
          />
          <span className={`text-xs font-bold tracking-wider ${isLive ? 'text-green-500' : 'text-[#a0aec0]/50'}`}>
            {isLive ? 'LIVE' : 'OFF AIR'}
          </span>
        </div>
      </div>

      {sections.length === 0 ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#a0aec0" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="mx-auto mb-3 opacity-30">
              <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
              <line x1="8" y1="21" x2="16" y2="21" />
              <line x1="12" y1="17" x2="12" y2="21" />
            </svg>
            <p className="text-[#a0aec0]">Select a song from the Library to present</p>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col gap-4 min-h-0">
          {/* Slide previews */}
          <div className="flex gap-4 flex-1 min-h-0">
            {/* Current slide (larger) */}
            <div className="flex-[2] flex flex-col">
              <div className="text-[10px] font-bold uppercase tracking-widest text-[#a0aec0]/60 mb-1.5">
                Current
              </div>
              <div className="flex-1 rounded-xl bg-black border-2 border-[#e94560] flex items-center justify-center p-8 relative overflow-hidden">
                {currentSlide?.sectionType && currentSlide.sectionType !== 'blank' && (
                  <div className="absolute top-3 left-3 text-[10px] font-bold uppercase tracking-widest text-[#e94560]/60">
                    {currentSlide.sectionType}
                  </div>
                )}
                <p
                  className="text-white text-center text-2xl leading-relaxed font-medium"
                  style={{ textShadow: '1px 1px 4px rgba(0,0,0,0.8)' }}
                >
                  {currentSlide?.text || 'Ready'}
                </p>
              </div>
            </div>

            {/* Next slide (smaller) */}
            <div className="flex-1 flex flex-col">
              <div className="text-[10px] font-bold uppercase tracking-widest text-[#a0aec0]/60 mb-1.5">
                Next
              </div>
              <div className="flex-1 rounded-xl bg-black/40 border border-white/10 flex items-center justify-center p-6">
                <p className="text-white/40 text-center text-lg leading-relaxed">
                  {nextPreviewText || '- End -'}
                </p>
              </div>
            </div>
          </div>

          {/* Quick controls */}
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={prevSlide}
              className="px-5 py-2.5 rounded-lg bg-[#16213e] hover:bg-[#0f3460] text-white font-medium transition-colors text-sm"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="inline mr-1.5"><polyline points="15 18 9 12 15 6" /></svg>
              Prev
            </button>
            <button
              onClick={handleGoLive}
              className={`px-8 py-2.5 rounded-lg font-bold text-white transition-colors text-sm ${
                isLive
                  ? 'bg-green-600 hover:bg-green-500'
                  : 'bg-[#e94560] hover:bg-[#ff6b6b]'
              }`}
            >
              {isLive ? 'LIVE' : 'GO LIVE'}
            </button>
            <button
              onClick={handleBlackout}
              className="px-5 py-2.5 rounded-lg bg-black border border-white/15 hover:border-white/30 text-white font-medium transition-colors text-sm"
            >
              Blackout
            </button>
            <button
              onClick={handleClear}
              className="px-5 py-2.5 rounded-lg bg-[#16213e] hover:bg-[#0f3460] text-white font-medium transition-colors text-sm"
            >
              Clear
            </button>
            <button
              className="px-5 py-2.5 rounded-lg bg-[#16213e] hover:bg-[#0f3460] text-white font-medium transition-colors text-sm"
            >
              Logo
            </button>
            <button
              onClick={nextSlide}
              className="px-5 py-2.5 rounded-lg bg-[#16213e] hover:bg-[#0f3460] text-white font-medium transition-colors text-sm"
            >
              Next
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="inline ml-1.5"><polyline points="9 18 15 12 9 6" /></svg>
            </button>
          </div>

          {/* Slide timeline */}
          <div>
            <div className="text-[10px] font-bold uppercase tracking-widest text-[#a0aec0]/60 mb-2">
              Slide Sequence
            </div>
            <div className="flex gap-1 overflow-x-auto pb-1">
              {allSlides.map((slide, idx) => (
                <button
                  key={idx}
                  onClick={() => goToLine(slide.sectionIdx, slide.lineIdx)}
                  className={`shrink-0 px-2.5 py-1.5 rounded text-[11px] font-medium transition-colors ${
                    idx === currentFlatIndex
                      ? 'bg-[#e94560] text-white'
                      : 'bg-[#16213e] text-[#a0aec0]/70 hover:bg-[#0f3460] hover:text-white'
                  }`}
                  title={slide.text}
                >
                  {idx + 1}
                </button>
              ))}
            </div>
          </div>

          {/* Section jump */}
          <div>
            <div className="text-[10px] font-bold uppercase tracking-widest text-[#a0aec0]/60 mb-2">
              Sections
            </div>
            <div className="flex flex-wrap gap-1.5">
              {sections.map((section, idx) => (
                <button
                  key={idx}
                  onClick={() => goToSection(idx)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    idx === currentSectionIndex
                      ? 'bg-[#e94560] text-white'
                      : 'bg-[#16213e] text-[#a0aec0] hover:bg-[#0f3460] hover:text-white'
                  }`}
                >
                  {section.type}
                </button>
              ))}
            </div>
          </div>

          {/* Keyboard hints */}
          <div className="flex gap-4 text-[11px] text-[#a0aec0]/60 border-t border-white/5 pt-3">
            <span>
              <kbd className="px-1.5 py-0.5 rounded bg-white/5 text-[#a0aec0] mr-1 text-[10px] font-mono">
                ← →
              </kbd>
              Navigate
            </span>
            <span>
              <kbd className="px-1.5 py-0.5 rounded bg-white/5 text-[#a0aec0] mr-1 text-[10px] font-mono">
                B
              </kbd>
              Black screen
            </span>
            <span>
              <kbd className="px-1.5 py-0.5 rounded bg-white/5 text-[#a0aec0] mr-1 text-[10px] font-mono">
                Esc
              </kbd>
              Stop live
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
