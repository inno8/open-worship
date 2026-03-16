import { useState, useEffect, useCallback } from 'react'
import Sidebar from './components/Sidebar'
import Library from './views/Library'
import Schedule from './views/Schedule'
import Presenter from './views/Presenter'
import Settings from './views/Settings'
import SplashScreen from './views/SplashScreen'
import { wsSync } from './services/WebSocketSync'

type View = 'splash' | 'library' | 'schedule' | 'presenter' | 'settings'

const FADE_MS = 350

function App() {
  const [currentView, setCurrentView] = useState<View>('splash')
  const [splashExiting, setSplashExiting] = useState(false)
  const [mainOpacity, setMainOpacity] = useState(0)

  const handleSplashComplete = useCallback(() => {
    setSplashExiting(true)
    setTimeout(() => {
      setCurrentView('presenter')
      setSplashExiting(false)
    }, FADE_MS)
  }, [])

  // Fade in main app when switching from splash
  useEffect(() => {
    if (currentView !== 'splash') {
      const id = requestAnimationFrame(() => requestAnimationFrame(() => setMainOpacity(1)))
      return () => cancelAnimationFrame(id)
    }
    setMainOpacity(0)
  }, [currentView])

  // WebSocket cleanup on unmount (main window only; connect is done in SplashScreen)
  useEffect(() => {
    if (window.location.hash === '#/presentation') return
    return () => wsSync.disconnect()
  }, [])

  const isPresentation = window.location.hash === '#/presentation'

  if (isPresentation) {
    return <PresentationWindow />
  }

  if (currentView === 'splash') {
    return (
      <div
        style={{
          opacity: splashExiting ? 0 : 1,
          transition: `opacity ${FADE_MS}ms ease-out`,
        }}
      >
        <SplashScreen onComplete={handleSplashComplete} />
      </div>
    )
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
        return <Presenter />
    }
  }

  return (
    <div
      style={{
        display: 'flex',
        height: '100vh',
        backgroundColor: '#1a1a2e',
        opacity: mainOpacity,
        transition: `opacity ${FADE_MS}ms ease-in`,
      }}
    >
      <Sidebar
        currentView={currentView}
        onViewChange={(v) => setCurrentView(v as View)}
      />
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
    fontWeight?: number
    textColor?: string
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
            color: slideData.textColor || '#ffffff',
            lineHeight: 1.5,
            fontSize: slideData.fontSize || '4rem',
            fontFamily: slideData.fontFamily || 'inherit',
            fontWeight: slideData.fontWeight ?? 400,
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
