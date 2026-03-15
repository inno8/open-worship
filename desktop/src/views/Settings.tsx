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
  { keys: 'Space', action: 'Next slide' },
  { keys: '← →', action: 'Previous / Next slide' },
  { keys: '↑ ↓', action: 'Previous / Next slide' },
  { keys: 'B', action: 'Black screen' },
  { keys: 'Esc', action: 'Stop live presentation' },
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
      if (window.electronAPI?.getDisplays) {
        try {
          const d = await window.electronAPI.getDisplays()
          if (Array.isArray(d)) {
            setDisplays(d)
          }
        } catch (e) {
          console.error('Failed to get displays:', e)
        }
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
  }

  function handleReset() {
    setFontSize('4rem')
    setFontFamily('inherit')
    setDefaultBackground('#000000')
    setDisplayId(null)
    setBackendUrl('http://localhost:8000')
  }

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '14px 16px',
    borderRadius: '12px',
    backgroundColor: '#1a1a2e',
    color: '#ffffff',
    border: '1px solid rgba(255,255,255,0.1)',
    fontSize: '14px',
    outline: 'none',
  }

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: '14px',
    fontWeight: 500,
    color: '#a0aec0',
    marginBottom: '8px',
  }

  const sectionTitleStyle: React.CSSProperties = {
    fontSize: '11px',
    fontWeight: 700,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.1em',
    color: 'rgba(160,174,192,0.6)',
    marginBottom: '20px',
  }

  const buttonPrimaryStyle: React.CSSProperties = {
    padding: '14px 28px',
    borderRadius: '12px',
    backgroundColor: '#e94560',
    color: '#ffffff',
    fontWeight: 600,
    fontSize: '14px',
    border: 'none',
    cursor: 'pointer',
    transition: 'opacity 0.2s',
  }

  const buttonSecondaryStyle: React.CSSProperties = {
    padding: '14px 20px',
    borderRadius: '12px',
    backgroundColor: '#0f3460',
    color: '#ffffff',
    fontWeight: 500,
    fontSize: '14px',
    border: 'none',
    cursor: 'pointer',
    transition: 'opacity 0.2s',
  }

  return (
    <div style={{ height: '100%', overflowY: 'auto', backgroundColor: '#1a1a2e' }}>
      <div style={{ maxWidth: '720px', margin: '0 auto', padding: '48px 32px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 700, color: '#ffffff', marginBottom: '48px' }}>
          Settings
        </h1>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '48px' }}>
          
          {/* DISPLAY */}
          <section>
            <h2 style={sectionTitleStyle}>Display</h2>
            <div style={{ 
              backgroundColor: '#16213e', 
              borderRadius: '16px', 
              padding: '24px',
              border: '1px solid rgba(255,255,255,0.05)'
            }}>
              <label style={labelStyle}>Presentation Output</label>
              <div style={{ display: 'flex', gap: '12px' }}>
                <select
                  value={displayId ?? ''}
                  onChange={(e) => setDisplayId(e.target.value ? Number(e.target.value) : null)}
                  style={{ ...inputStyle, flex: 1 }}
                >
                  <option value="">Auto (Primary)</option>
                  {displays.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.label}{d.size ? ` (${d.size.width}x${d.size.height})` : ''}
                    </option>
                  ))}
                </select>
                <button style={buttonSecondaryStyle}>Preview</button>
              </div>
            </div>
          </section>

          {/* APPEARANCE */}
          <section>
            <h2 style={sectionTitleStyle}>Appearance</h2>
            <div style={{ 
              backgroundColor: '#16213e', 
              borderRadius: '16px', 
              padding: '24px',
              border: '1px solid rgba(255,255,255,0.05)',
              display: 'flex',
              flexDirection: 'column',
              gap: '24px'
            }}>
              <div>
                <label style={labelStyle}>Font Family</label>
                <select
                  value={fontFamily}
                  onChange={(e) => setFontFamily(e.target.value)}
                  style={inputStyle}
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
                <label style={labelStyle}>Font Size: {fontSizeSliderVal}px</label>
                <input
                  type="range"
                  min="48"
                  max="96"
                  step="2"
                  value={fontSizeSliderVal}
                  onChange={(e) => handleFontSizeChange(Number(e.target.value))}
                  style={{ 
                    width: '100%', 
                    accentColor: '#e94560',
                    height: '8px',
                    borderRadius: '4px',
                  }}
                />
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  fontSize: '11px', 
                  color: 'rgba(160,174,192,0.5)',
                  marginTop: '8px'
                }}>
                  <span>48px</span>
                  <span>96px</span>
                </div>
              </div>

              {/* Font preview */}
              <div style={{
                padding: '32px',
                borderRadius: '12px',
                backgroundColor: '#000000',
                border: '1px solid rgba(255,255,255,0.05)',
                textAlign: 'center',
                color: '#ffffff',
                fontFamily,
                fontSize: `${fontSizeSliderVal / 3}px`,
              }}>
                Preview Text
              </div>
            </div>
          </section>

          {/* BACKGROUNDS */}
          <section>
            <h2 style={sectionTitleStyle}>Backgrounds</h2>
            <div style={{ 
              backgroundColor: '#16213e', 
              borderRadius: '16px', 
              padding: '24px',
              border: '1px solid rgba(255,255,255,0.05)'
            }}>
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(4, 1fr)', 
                gap: '12px',
                marginBottom: '20px'
              }}>
                {BACKGROUND_PRESETS.map((bg) => (
                  <button
                    key={bg}
                    onClick={() => setDefaultBackground(bg)}
                    style={{
                      aspectRatio: '16/9',
                      borderRadius: '12px',
                      border: defaultBackground === bg 
                        ? '3px solid #e94560' 
                        : '2px solid rgba(255,255,255,0.1)',
                      backgroundColor: bg,
                      cursor: 'pointer',
                      transition: 'border-color 0.2s',
                    }}
                  />
                ))}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <input
                  type="color"
                  value={defaultBackground}
                  onChange={(e) => setDefaultBackground(e.target.value)}
                  style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '12px',
                    border: '1px solid rgba(255,255,255,0.1)',
                    cursor: 'pointer',
                    backgroundColor: 'transparent',
                    padding: '2px',
                  }}
                />
                <input
                  type="text"
                  value={defaultBackground}
                  onChange={(e) => setDefaultBackground(e.target.value)}
                  style={{ ...inputStyle, flex: 1, fontFamily: 'monospace' }}
                />
                <button style={{
                  ...buttonSecondaryStyle,
                  backgroundColor: 'transparent',
                  border: '1px solid rgba(255,255,255,0.15)',
                  color: '#a0aec0',
                }}>
                  Upload New
                </button>
              </div>
            </div>
          </section>

          {/* CONNECTION */}
          <section>
            <h2 style={sectionTitleStyle}>Connection</h2>
            <div style={{ 
              backgroundColor: '#16213e', 
              borderRadius: '16px', 
              padding: '24px',
              border: '1px solid rgba(255,255,255,0.05)'
            }}>
              <label style={labelStyle}>Backend URL</label>
              <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
                <input
                  type="text"
                  value={backendUrl}
                  onChange={(e) => setBackendUrl(e.target.value)}
                  placeholder="http://localhost:8000"
                  style={{ ...inputStyle, flex: 1, fontFamily: 'monospace' }}
                />
                <button
                  onClick={testConnection}
                  disabled={connectionStatus === 'testing'}
                  style={{
                    ...buttonSecondaryStyle,
                    opacity: connectionStatus === 'testing' ? 0.5 : 1,
                  }}
                >
                  {connectionStatus === 'testing' ? 'Testing...' : 'Test'}
                </button>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{
                  width: '10px',
                  height: '10px',
                  borderRadius: '50%',
                  backgroundColor: connectionStatus === 'connected' 
                    ? '#22c55e' 
                    : connectionStatus === 'testing'
                    ? '#eab308'
                    : 'rgba(160,174,192,0.3)',
                }} />
                <span style={{ fontSize: '13px', color: '#a0aec0' }}>
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
            <h2 style={sectionTitleStyle}>Keyboard Shortcuts</h2>
            <div style={{ 
              backgroundColor: '#16213e', 
              borderRadius: '16px', 
              border: '1px solid rgba(255,255,255,0.05)',
              overflow: 'hidden',
            }}>
              {SHORTCUTS.map((shortcut, idx) => (
                <div 
                  key={shortcut.keys} 
                  style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'space-between', 
                    padding: '16px 24px',
                    borderBottom: idx < SHORTCUTS.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none',
                  }}
                >
                  <span style={{ fontSize: '14px', color: '#a0aec0' }}>{shortcut.action}</span>
                  <kbd style={{
                    padding: '6px 14px',
                    borderRadius: '8px',
                    backgroundColor: '#1a1a2e',
                    color: '#ffffff',
                    fontSize: '12px',
                    fontFamily: 'monospace',
                    border: '1px solid rgba(255,255,255,0.1)',
                  }}>
                    {shortcut.keys}
                  </kbd>
                </div>
              ))}
            </div>
          </section>

          {/* Footer */}
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between', 
            paddingTop: '32px',
            paddingBottom: '48px',
            borderTop: '1px solid rgba(255,255,255,0.1)',
          }}>
            <button
              onClick={handleReset}
              style={{
                background: 'none',
                border: 'none',
                color: '#a0aec0',
                fontSize: '14px',
                cursor: 'pointer',
              }}
            >
              Reset to Defaults
            </button>
            <button
              onClick={handleSave}
              style={buttonPrimaryStyle}
            >
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
