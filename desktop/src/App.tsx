import { useState, useEffect } from 'react'
import Sidebar from './components/Sidebar'
import Library from './views/Library'
import Schedule from './views/Schedule'
import Presenter from './views/Presenter'
import Settings from './views/Settings'
import { useSongStore } from './stores/songStore'
import { useScheduleStore } from './stores/scheduleStore'
import { usePresentationStore } from './stores/presentationStore'

type View = 'library' | 'schedule' | 'presenter' | 'settings'

function App() {
  const [currentView, setCurrentView] = useState<View>('presenter')
  const loadSongs = useSongStore((state) => state.loadSongs)
  const loadSchedules = useScheduleStore((state) => state.loadSchedules)

  // Load data from database on startup; auto-enable NDI; auto-load today's schedule if it exists
  useEffect(() => {
    loadSongs()
    loadSchedules().then(() => {
      const { schedules, setActiveSchedule } = useScheduleStore.getState()
      const today = new Date().toISOString().slice(0, 10)
      const todaysSchedule = schedules.find((s) => s.date === today)
      if (todaysSchedule) setActiveSchedule(todaysSchedule)
    })
    usePresentationStore.getState().setNdiEnabled(true)
  }, [loadSongs, loadSchedules])

  // Check if this is the presentation window
  const isPresentation = window.location.hash === '#/presentation'

  if (isPresentation) {
    return <PresentationWindow />
  }

  const renderView = () => {
    switch (currentView) {
      case 'library':
        return <Library />
      case 'schedule':
        return <Schedule />
      case 'presenter':
        return <Presenter />
      case 'settings':
        return <Settings />
      default:
        return <Library />
    }
  }

  return (
    <div style={{ display: 'flex', height: '100vh', backgroundColor: '#1a1a2e' }}>
      <Sidebar currentView={currentView} onViewChange={(v) => setCurrentView(v)} />
      <main style={{ flex: 1, overflow: 'hidden' }}>
        {renderView()}
      </main>
    </div>
  )
}

function PresentationWindow() {
  const [slideData, setSlideData] = useState<{
    text?: string
    backgroundColor?: string
    backgroundImage?: string
    fontSize?: string
    fontFamily?: string
    sectionType?: string
  } | null>(null)

  // Listen for slide updates from main window
  useEffect(() => {
    if (window.electronAPI) {
      window.electronAPI.onSlideUpdate((data) => {
        setSlideData(data as typeof slideData)
      })
      
      return () => {
        window.electronAPI?.removeSlideUpdateListener()
      }
    }
  }, [])

  if (!slideData) {
    return (
      <div style={{ 
        height: '100vh', 
        width: '100vw', 
        backgroundColor: '#000000',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '24px' }}>
          Waiting for presentation...
        </p>
      </div>
    )
  }

  return (
    <div 
      style={{
        height: '100vh',
        width: '100vw',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '64px',
        backgroundColor: slideData.backgroundColor || '#000000',
        backgroundImage: slideData.backgroundImage || undefined,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        position: 'relative',
      }}
    >
      <div style={{ textAlign: 'center' }}>
        <p 
          style={{
            color: '#ffffff',
            lineHeight: 1.5,
            fontSize: slideData.fontSize || '4rem',
            fontFamily: slideData.fontFamily || 'inherit',
            textShadow: '2px 2px 8px rgba(0,0,0,0.8)',
            margin: 0,
          }}
        >
          {slideData.text}
        </p>
      </div>
      
      {/* Section indicator */}
      {slideData.sectionType && slideData.sectionType !== 'blank' && (
        <div style={{
          position: 'absolute',
          bottom: '32px',
          right: '32px',
          fontSize: '14px',
          color: 'rgba(255,255,255,0.4)',
          fontWeight: 600,
          textTransform: 'uppercase',
          letterSpacing: '0.1em',
        }}>
          {slideData.sectionType}
        </div>
      )}
    </div>
  )
}

export default App
