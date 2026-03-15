type View = 'library' | 'schedule' | 'presenter' | 'settings'

interface SidebarProps {
  currentView: string
  onViewChange: (view: View) => void
}

const menuItems: { id: View; label: string; icon: React.ReactNode }[] = [
  {
    id: 'library',
    label: 'Library',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 18V5l12-2v13" />
        <circle cx="6" cy="18" r="3" />
        <circle cx="18" cy="16" r="3" />
      </svg>
    ),
  },
  {
    id: 'schedule',
    label: 'Schedule',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="8" y1="6" x2="21" y2="6" />
        <line x1="8" y1="12" x2="21" y2="12" />
        <line x1="8" y1="18" x2="21" y2="18" />
        <line x1="3" y1="6" x2="3.01" y2="6" />
        <line x1="3" y1="12" x2="3.01" y2="12" />
        <line x1="3" y1="18" x2="3.01" y2="18" />
      </svg>
    ),
  },
  {
    id: 'presenter',
    label: 'Present',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
        <line x1="8" y1="21" x2="16" y2="21" />
        <line x1="12" y1="17" x2="12" y2="21" />
      </svg>
    ),
  },
  {
    id: 'settings',
    label: 'Settings',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
      </svg>
    ),
  },
]

export default function Sidebar({ currentView, onViewChange }: SidebarProps) {
  return (
    <aside 
      className="flex flex-col h-full"
      style={{ 
        width: 260, 
        minWidth: 260, 
        backgroundColor: '#16213e',
        borderRight: '1px solid rgba(255,255,255,0.08)'
      }}
    >
      {/* Logo */}
      <div className="px-6 py-6" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <h1 className="text-xl font-bold text-white flex items-center gap-3">
          <div 
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ backgroundColor: 'rgba(233,69,96,0.15)' }}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#e94560" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="2" x2="12" y2="22" />
              <line x1="4" y1="8" x2="20" y2="8" />
            </svg>
          </div>
          <span>Open Worship</span>
        </h1>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6">
        <ul className="space-y-2">
          {menuItems.map((item) => (
            <li key={item.id}>
              <button
                onClick={() => onViewChange(item.id)}
                className="w-full flex items-center gap-4 px-4 py-3.5 rounded-xl text-left transition-all"
                style={{
                  backgroundColor: currentView === item.id ? '#e94560' : 'transparent',
                  color: currentView === item.id ? '#ffffff' : '#a0aec0',
                }}
                onMouseEnter={(e) => {
                  if (currentView !== item.id) {
                    e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)'
                    e.currentTarget.style.color = '#ffffff'
                  }
                }}
                onMouseLeave={(e) => {
                  if (currentView !== item.id) {
                    e.currentTarget.style.backgroundColor = 'transparent'
                    e.currentTarget.style.color = '#a0aec0'
                  }
                }}
              >
                {item.icon}
                <span className="font-semibold text-[15px]">{item.label}</span>
              </button>
            </li>
          ))}
        </ul>
      </nav>

      {/* Footer */}
      <div className="px-6 py-5" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
        <p className="text-xs text-[#a0aec0]/50 text-center font-medium">v1.0.0</p>
      </div>
    </aside>
  )
}
