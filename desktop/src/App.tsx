import { useState, useEffect, useCallback } from 'react'
import Sidebar from './components/Sidebar'
import Library from './views/Library'
import Schedule from './views/Schedule'
import Presenter from './views/Presenter'
import Settings from './views/Settings'
import SplashScreen from './views/SplashScreen'
import type { SlideData } from './stores/presentationStore'
import { wsSync } from './services/WebSocketSync'
import { startHeartbeat, stopHeartbeat, requestNotificationPermission } from './services/heartbeatService'
import { useSyncStore } from './stores/syncStore'

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

  // Heartbeat service for API sync notifications
  const { apiToken, apiBaseUrl, heartbeatIntervalMinutes } = useSyncStore()
  
  useEffect(() => {
    if (window.location.hash === '#/presentation') return
    
    // Request notification permission on app start
    requestNotificationPermission()
    
    // Start heartbeat if API is configured
    if (apiToken && apiBaseUrl) {
      startHeartbeat()
    }
    
    return () => stopHeartbeat()
  }, [])

  // Restart heartbeat when settings change
  useEffect(() => {
    if (window.location.hash === '#/presentation') return
    
    if (apiToken && apiBaseUrl) {
      startHeartbeat()
    } else {
      stopHeartbeat()
    }
  }, [apiToken, apiBaseUrl, heartbeatIntervalMinutes])

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
      case 'settings':
        return <Settings />
      default:
        return null
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
        {/* Keep Presenter always mounted so state persists across view switches */}
        <div style={{ display: currentView === 'presenter' ? 'contents' : 'none' }}>
          <Presenter />
        </div>
        {renderView()}
      </main>
    </div>
  )
}

function PresentationWindow() {
  const [slideData, setSlideData] = useState<SlideData | null>(null)

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

  // Calculate responsive font size based on viewport width
  // Base: 4rem at 1920px viewport, scales down proportionally
  // Using clamp for minimum readability and maximum size
  const getResponsiveFontSize = (baseFontSize?: string): string => {
    if (!baseFontSize) {
      // Default: scale from 2rem (min) to 4rem (max) based on viewport
      // At 812px OBS source: ~2.5rem, at 1920px: 4rem
      return 'clamp(1.5rem, 4vw, 4rem)'
    }
    
    // Parse the base font size
    const match = baseFontSize.match(/([\d.]+)(rem|px|em)/)
    if (!match) return baseFontSize
    
    const value = parseFloat(match[1])
    const unit = match[2]
    
    // Convert to rem for scaling (assuming 16px base)
    let remValue = value
    if (unit === 'px') remValue = value / 16
    if (unit === 'em') remValue = value // em ≈ rem for our purposes
    
    // Create a responsive clamp: min is 40% of base, max is 100% of base
    // Scale based on viewport width (4vw ≈ 4rem at 1920px width)
    const minRem = Math.max(1.5, remValue * 0.4)
    const vwValue = (remValue / 4) * 4 // Proportional vw based on 4rem = 4vw at 1920px
    
    return `clamp(${minRem}rem, ${vwValue}vw, ${remValue}rem)`
  }

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
        padding: 'clamp(16px, 4vw, 64px)',
        backgroundColor: slideData.backgroundColor || '#000000',
        backgroundImage: slideData.backgroundImage || undefined,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        position: 'relative',
        boxSizing: 'border-box',
      }}
    >
      <div style={{ 
        textAlign: 'center',
        width: '100%',
        maxWidth: '90%',
        wordWrap: 'break-word',
        overflowWrap: 'break-word',
      }}>
        <p 
          style={{
            color: slideData.textColor || '#ffffff',
            lineHeight: 1.4,
            fontSize: getResponsiveFontSize(slideData.fontSize),
            fontFamily: slideData.fontFamily || 'inherit',
            fontWeight: slideData.fontWeight ?? 400,
            textShadow: `${slideData.shadowOffsetX ?? 2}px ${slideData.shadowOffsetY ?? 2}px ${slideData.shadowBlur ?? 8}px ${slideData.shadowColor ?? 'rgba(0,0,0,0.8)'}`,
            margin: 0,
            wordWrap: 'break-word',
            overflowWrap: 'break-word',
            hyphens: 'auto',
          }}
        >
          {slideData.text}
        </p>
      </div>
      
      {/* Section indicator */}
      {slideData.sectionType && slideData.sectionType !== 'blank' && (
        <div style={{
          position: 'absolute',
          bottom: 'clamp(8px, 2vw, 32px)',
          right: 'clamp(8px, 2vw, 32px)',
          fontSize: 'clamp(8px, 1vw, 14px)',
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
