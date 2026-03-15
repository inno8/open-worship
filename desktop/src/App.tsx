import { useState } from 'react'
import Sidebar from './components/Sidebar'
import Library from './views/Library'
import Schedule from './views/Schedule'
import Presenter from './views/Presenter'
import Settings from './views/Settings'

type View = 'library' | 'schedule' | 'presenter' | 'settings'

function App() {
  const [currentView, setCurrentView] = useState<View>('library')

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
    <div className="flex h-screen bg-[#1a1a2e]">
      <Sidebar currentView={currentView} onViewChange={setCurrentView} />
      <main className="flex-1 overflow-hidden">
        {renderView()}
      </main>
    </div>
  )
}

function PresentationWindow() {
  const [slideData, setSlideData] = useState<any>(null)

  // Listen for slide updates from main window
  useState(() => {
    if (window.electronAPI) {
      window.electronAPI.onSlideUpdate((data) => {
        setSlideData(data)
      })
    }
  })

  if (!slideData) {
    return (
      <div className="h-screen w-screen bg-black flex items-center justify-center">
        <p className="text-white/30 text-2xl">Waiting for presentation...</p>
      </div>
    )
  }

  return (
    <div 
      className="h-screen w-screen flex items-center justify-center p-16"
      style={{
        backgroundColor: slideData.backgroundColor || '#000000',
        backgroundImage: slideData.backgroundImage ? `url(${slideData.backgroundImage})` : undefined,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      <div className="text-center">
        <p 
          className="text-white leading-relaxed"
          style={{
            fontSize: slideData.fontSize || '4rem',
            fontFamily: slideData.fontFamily || 'inherit',
            textShadow: '2px 2px 8px rgba(0,0,0,0.8)',
          }}
        >
          {slideData.text}
        </p>
      </div>
    </div>
  )
}

export default App
