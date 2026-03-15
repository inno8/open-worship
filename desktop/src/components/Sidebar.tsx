interface SidebarProps {
  currentView: string
  onViewChange: (view: any) => void
}

const menuItems = [
  { id: 'library', label: 'Library', icon: '🎵' },
  { id: 'schedule', label: 'Schedule', icon: '📋' },
  { id: 'presenter', label: 'Present', icon: '🖥️' },
  { id: 'settings', label: 'Settings', icon: '⚙️' },
]

export default function Sidebar({ currentView, onViewChange }: SidebarProps) {
  return (
    <aside className="w-64 bg-[#16213e] border-r border-[#0f3460] flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-[#0f3460]">
        <h1 className="text-xl font-bold text-white flex items-center gap-2">
          <span className="text-2xl">✝️</span>
          Open Worship
        </h1>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {menuItems.map((item) => (
            <li key={item.id}>
              <button
                onClick={() => onViewChange(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                  currentView === item.id
                    ? 'bg-[#e94560] text-white'
                    : 'text-gray-300 hover:bg-[#0f3460] hover:text-white'
                }`}
              >
                <span className="text-xl">{item.icon}</span>
                <span className="font-medium">{item.label}</span>
              </button>
            </li>
          ))}
        </ul>
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-[#0f3460]">
        <p className="text-xs text-gray-500 text-center">
          Open Worship v1.0.0
        </p>
      </div>
    </aside>
  )
}
