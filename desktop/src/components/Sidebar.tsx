import { useState } from 'react'

type View = 'library' | 'schedule' | 'presenter' | 'announcements' | 'settings'

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
    id: 'announcements',
    label: 'Announce',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M19 4v6a2 2 0 01-2 2H7l-4 4V6a2 2 0 012-2h12a2 2 0 012 2z" />
        <line x1="12" y1="8" x2="12" y2="8.01" />
        <line x1="8" y1="8" x2="8" y2="8.01" />
        <line x1="16" y1="8" x2="16" y2="8.01" />
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

const COLLAPSED_WIDTH = 60
const EXPANDED_WIDTH = 200

export default function Sidebar({ currentView, onViewChange }: SidebarProps) {
  const [hovered, setHovered] = useState(false)
  const expanded = hovered

  return (
    <aside
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        width: expanded ? EXPANDED_WIDTH : COLLAPSED_WIDTH,
        minWidth: expanded ? EXPANDED_WIDTH : COLLAPSED_WIDTH,
        backgroundColor: '#16213e',
        borderRight: '1px solid rgba(255,255,255,0.08)',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        transition: 'width 0.2s ease, min-width 0.2s ease',
        overflow: 'hidden',
        position: 'relative',
        zIndex: 20,
      }}
    >
      {/* Logo */}
      <div style={{
        padding: expanded ? '16px 16px' : '16px 0',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: expanded ? 'flex-start' : 'center',
        gap: '10px',
        minHeight: '56px',
      }}>
        <img
          src="./assets/icons/icon.svg"
          alt="Open Worship"
          style={{ width: 28, height: 28, flexShrink: 0 }}
        />
        {expanded && (
          <span style={{
            color: '#ffffff',
            fontWeight: 700,
            fontSize: '14px',
            whiteSpace: 'nowrap',
          }}>
            Open Worship
          </span>
        )}
      </div>

      {/* Navigation */}
      <nav style={{ flex: 1, padding: '16px 8px' }}>
        <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {menuItems.map((item) => (
            <li key={item.id}>
              <button
                onClick={() => onViewChange(item.id)}
                title={expanded ? undefined : item.label}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: expanded ? '10px 14px' : '10px 0',
                  justifyContent: expanded ? 'flex-start' : 'center',
                  borderRadius: '10px',
                  border: 'none',
                  textAlign: 'left',
                  cursor: 'pointer',
                  transition: 'background-color 0.15s, color 0.15s',
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
                <span style={{ flexShrink: 0, display: 'flex' }}>{item.icon}</span>
                {expanded && (
                  <span style={{ fontWeight: 600, fontSize: '13px', whiteSpace: 'nowrap' }}>
                    {item.label}
                  </span>
                )}
              </button>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  )
}
