import { useState, useEffect } from 'react'
import { usePresentationStore } from '../stores/presentationStore'

interface DisplayInfo {
  id: number
  label: string
  size: { width: number; height: number }
}

const BACKGROUND_PRESETS = [
  '#000000',
  '#1a1a2e',
  '#0f3460',
  '#16213e',
  '#1b1b3a',
  '#2d132c',
  '#0a1628',
  '#1c2541',
]

const SHORTCUTS = [
  { keys: '← →', action: 'Previous / Next slide' },
  { keys: '↑ ↓', action: 'Previous / Next slide' },
  { keys: 'B', action: 'Black screen' },
  { keys: 'Esc', action: 'Stop live presentation' },
  { keys: 'Space', action: 'Next slide' },
]

export default function Settings() {
  const {
    displayId,
    fontSize,
    fontFamily,
    defaultBackground,
    setDisplayId,
    setFontSize,
    setFontFamily,
    setDefaultBackground,
  } = usePresentationStore()

  const [displays, setDisplays] = useState<DisplayInfo[]>([])
  const [backendUrl, setBackendUrl] = useState('http://localhost:8000')
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'testing'>('disconnected')

  // Convert rem-based font size to px for slider (48-96px range)
  const fontSizePx = Math.round(parseFloat(fontSize) * 16) || 64
  const fontSizeSliderVal = Math.max(48, Math.min(96, fontSizePx))

  useEffect(() => {
    async function loadDisplays() {
      if (window.electronAPI) {
        const d = await window.electronAPI.getDisplays()
        setDisplays(d)
      }
    }
    loadDisplays()
  }, [])

  async function testConnection() {
    setConnectionStatus('testing')
    try {
      const res = await fetch(`${backendUrl}/api/`, { signal: AbortSignal.timeout(5000) })
      setConnectionStatus(res.ok ? 'connected' : 'disconnected')
    } catch {
      setConnectionStatus('disconnected')
    }
  }

  function handleFontSizeChange(px: number) {
    setFontSize(`${px / 16}rem`)
  }

  function handleSave() {
    // Settings are already persisted via zustand store
    // This could persist backendUrl etc. in the future
  }

  function handleReset() {
    setFontSize('4rem')
    setFontFamily('inherit')
    setDefaultBackground('#000000')
    setDisplayId(null)
    setBackendUrl('http://localhost:8000')
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-2xl mx-auto px-6 py-8">
        <h1 className="text-2xl font-bold text-white mb-8">Settings</h1>

        <div className="space-y-10">
          {/* DISPLAY */}
          <section>
            <h2 className="text-xs font-bold uppercase tracking-widest text-[#a0aec0]/60 mb-4">Display</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#a0aec0] mb-1.5">
                  Presentation Output
                </label>
                <div className="flex gap-2">
                  <select
                    value={displayId ?? ''}
                    onChange={(e) =>
                      setDisplayId(e.target.value ? Number(e.target.value) : null)
                    }
                    className="flex-1 px-3 py-2.5 rounded-lg bg-[#16213e] text-white border border-white/10 focus:border-[#e94560] focus:outline-none text-sm"
                  >
                    <option value="">Auto (Primary)</option>
                    {displays.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.label} ({d.size.width}x{d.size.height})
                      </option>
                    ))}
                  </select>
                  <button className="px-4 py-2.5 rounded-lg bg-[#0f3460] hover:bg-[#0f3460]/80 text-white text-sm font-medium transition-colors">
                    Preview
                  </button>
                </div>
              </div>
            </div>
          </section>

          {/* APPEARANCE */}
          <section>
            <h2 className="text-xs font-bold uppercase tracking-widest text-[#a0aec0]/60 mb-4">Appearance</h2>
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-[#a0aec0] mb-1.5">
                  Font Family
                </label>
                <select
                  value={fontFamily}
                  onChange={(e) => setFontFamily(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-lg bg-[#16213e] text-white border border-white/10 focus:border-[#e94560] focus:outline-none text-sm"
                >
                  <option value="inherit">System Default</option>
                  <option value="'Georgia', serif">Georgia</option>
                  <option value="'Times New Roman', serif">Times New Roman</option>
                  <option value="'Arial', sans-serif">Arial</option>
                  <option value="'Verdana', sans-serif">Verdana</option>
                  <option value="'Segoe UI', sans-serif">Segoe UI</option>
                  <option value="'Courier New', monospace">Courier New</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#a0aec0] mb-1.5">
                  Font Size: {fontSizeSliderVal}px
                </label>
                <input
                  type="range"
                  min="48"
                  max="96"
                  step="2"
                  value={fontSizeSliderVal}
                  onChange={(e) => handleFontSizeChange(Number(e.target.value))}
                  className="w-full accent-[#e94560]"
                />
                <div className="flex justify-between text-[10px] text-[#a0aec0]/50 mt-1">
                  <span>48px</span>
                  <span>96px</span>
                </div>
              </div>

              {/* Font preview */}
              <div
                className="p-6 rounded-xl bg-black border border-white/5 text-center text-white"
                style={{ fontFamily, fontSize: `${fontSizeSliderVal / 4}px` }}
              >
                Preview Text
              </div>
            </div>
          </section>

          {/* BACKGROUNDS */}
          <section>
            <h2 className="text-xs font-bold uppercase tracking-widest text-[#a0aec0]/60 mb-4">Backgrounds</h2>
            <div className="grid grid-cols-4 gap-3">
              {BACKGROUND_PRESETS.map((bg) => (
                <button
                  key={bg}
                  onClick={() => setDefaultBackground(bg)}
                  className={`aspect-video rounded-lg border-2 transition-colors ${
                    defaultBackground === bg
                      ? 'border-[#e94560]'
                      : 'border-white/10 hover:border-white/20'
                  }`}
                  style={{ backgroundColor: bg }}
                />
              ))}
            </div>
            <div className="flex items-center gap-3 mt-4">
              <input
                type="color"
                value={defaultBackground}
                onChange={(e) => setDefaultBackground(e.target.value)}
                className="w-10 h-10 rounded-lg border border-white/10 cursor-pointer bg-transparent"
              />
              <input
                type="text"
                value={defaultBackground}
                onChange={(e) => setDefaultBackground(e.target.value)}
                className="flex-1 px-3 py-2 rounded-lg bg-[#16213e] text-white border border-white/10 focus:border-[#e94560] focus:outline-none font-mono text-sm"
              />
              <button className="px-4 py-2.5 rounded-lg border border-white/10 hover:border-white/30 text-[#a0aec0] hover:text-white text-sm font-medium transition-colors">
                Upload New
              </button>
            </div>
          </section>

          {/* CONNECTION */}
          <section>
            <h2 className="text-xs font-bold uppercase tracking-widest text-[#a0aec0]/60 mb-4">Connection</h2>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-[#a0aec0] mb-1.5">
                  Backend URL
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={backendUrl}
                    onChange={(e) => setBackendUrl(e.target.value)}
                    placeholder="http://localhost:8000"
                    className="flex-1 px-3 py-2.5 rounded-lg bg-[#16213e] text-white border border-white/10 focus:border-[#e94560] focus:outline-none font-mono text-sm"
                  />
                  <button
                    onClick={testConnection}
                    disabled={connectionStatus === 'testing'}
                    className="px-4 py-2.5 rounded-lg bg-[#0f3460] hover:bg-[#0f3460]/80 text-white text-sm font-medium transition-colors disabled:opacity-50"
                  >
                    {connectionStatus === 'testing' ? 'Testing...' : 'Test'}
                  </button>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div
                  className={`w-2 h-2 rounded-full ${
                    connectionStatus === 'connected'
                      ? 'bg-green-500'
                      : connectionStatus === 'testing'
                      ? 'bg-yellow-500 animate-pulse'
                      : 'bg-[#a0aec0]/30'
                  }`}
                />
                <span className="text-xs text-[#a0aec0]">
                  {connectionStatus === 'connected'
                    ? 'Connected'
                    : connectionStatus === 'testing'
                    ? 'Testing connection...'
                    : 'Not connected'}
                </span>
              </div>
            </div>
          </section>

          {/* KEYBOARD SHORTCUTS */}
          <section>
            <h2 className="text-xs font-bold uppercase tracking-widest text-[#a0aec0]/60 mb-4">Keyboard Shortcuts</h2>
            <div className="bg-[#16213e] rounded-xl border border-white/5 divide-y divide-white/5">
              {SHORTCUTS.map((shortcut) => (
                <div key={shortcut.keys} className="flex items-center justify-between px-4 py-3">
                  <span className="text-sm text-[#a0aec0]">{shortcut.action}</span>
                  <kbd className="px-2.5 py-1 rounded-lg bg-[#1a1a2e] text-white text-xs font-mono border border-white/10">
                    {shortcut.keys}
                  </kbd>
                </div>
              ))}
            </div>
          </section>

          {/* Footer */}
          <div className="flex items-center justify-between pt-4 pb-8 border-t border-white/10">
            <button
              onClick={handleReset}
              className="text-sm text-[#a0aec0] hover:text-white transition-colors"
            >
              Reset to Defaults
            </button>
            <button
              onClick={handleSave}
              className="px-6 py-2.5 rounded-lg bg-[#e94560] hover:bg-[#ff6b6b] text-white font-medium transition-colors text-sm"
            >
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
