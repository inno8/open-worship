import { useState, useEffect, useCallback } from 'react'
import { usePresentationStore, getBackgroundStyle } from '../stores/presentationStore'
import { useSongStore } from '../stores/songStore'
import { useScheduleStore } from '../stores/scheduleStore'
import { useSyncStore } from '../stores/syncStore'
import { wsSync } from '../services/WebSocketSync'

interface DisplayInfo {
  id: number
  label: string
  size: { width: number; height: number }
}

const APP_VERSION = '1.0.0'

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
    fontWeight,
    textColor,
    defaultBackground,
    backgrounds,
    ndiEnabled,
    ndiSourceName,
    ndiRunning,
    ndiAvailable,
    ndiMockMode,
    setDisplayId,
    setFontSize,
    setFontFamily,
    setFontWeight,
    setTextColor,
    setDefaultBackground,
    loadBackgrounds,
    addBackgrounds,
    removeBackground,
    setNdiEnabled,
    setNdiSourceName,
    refreshNdiStatus,
  } = usePresentationStore()

  const [displays, setDisplays] = useState<DisplayInfo[]>([])
  const [toast, setToast] = useState<string | null>(null)
  const [showClearConfirm, setShowClearConfirm] = useState(false)
  const [hoveredBg, setHoveredBg] = useState<string | null>(null)

  const { songs } = useSongStore()
  const { schedules } = useScheduleStore()
  const {
    backendWsUrl,
    connectionStatus,
    setBackendWsUrl,
    apiToken,
    apiBaseUrl,
    songEndpoint,
    scheduleEndpoint,
    heartbeatEndpoint,
    heartbeatIntervalMinutes,
    setApiToken,
    setApiBaseUrl,
    setSongEndpoint,
    setScheduleEndpoint,
    setHeartbeatEndpoint,
    setHeartbeatIntervalMinutes,
  } = useSyncStore()

  // API Token state
  const [showApiToken, setShowApiToken] = useState(false)
  const [showTokenWarning, setShowTokenWarning] = useState(false)
  const [pendingTokenAction, setPendingTokenAction] = useState<'edit' | 'clear' | null>(null)
  const [tempToken, setTempToken] = useState('')

  const showToast = useCallback((message: string) => {
    setToast(message)
    setTimeout(() => setToast(null), 3000)
  }, [])

  // Convert rem-based font size to px for slider (8-200px range)
  const fontSizePx = Math.round(parseFloat(fontSize) * 16) || 64
  const fontSizeSliderVal = Math.max(8, Math.min(200, fontSizePx))

  useEffect(() => {
    async function init() {
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
      loadBackgrounds()
      refreshNdiStatus()
    }
    init()
  }, [])

  function handleFontSizeChange(px: number) {
    setFontSize(`${px / 16}rem`)
  }

  function handleSave() {
    showToast('Settings saved')
  }

  function handleReconnectWs() {
    wsSync.disconnect()
    wsSync.connect()
    showToast('Reconnecting…')
  }

  function handleReset() {
    setFontSize('4rem')
    setFontFamily('inherit')
    setFontWeight(400)
    setTextColor('#ffffff')
    setDefaultBackground('#000000')
    setDisplayId(null)
    setNdiEnabled(false)
    setNdiSourceName('Open Worship')
    showToast('Settings reset to defaults')
  }

  async function handleAddBackground() {
    const imported = await addBackgrounds()
    if (imported.length > 0) {
      // Refresh list from main process so grid updates immediately (fixes import not showing)
      await loadBackgrounds()
      setDefaultBackground(imported[0])
      showToast(`${imported.length} background${imported.length > 1 ? 's' : ''} added`)
    }
  }

  async function handleDeleteBackground(filename: string) {
    await removeBackground(filename)
    showToast('Background removed')
  }

  async function handleExportData() {
    const data = {
      version: APP_VERSION,
      exportedAt: new Date().toISOString(),
      songs,
      schedules,
      settings: {
        fontSize,
        fontFamily,
        fontWeight,
        textColor,
        defaultBackground,
      }
    }
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `open-worship-backup-${new Date().toISOString().split('T')[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
    showToast('Data exported successfully')
  }

  async function handleClearData() {
    // Clear local storage
    localStorage.clear()
    
    // In Electron, we could also clear the SQLite database
    // For now, just show confirmation
    setShowClearConfirm(false)
    showToast('Local data cleared. Restart the app to apply changes.')
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
          
          {/* BACKEND SYNC */}
          <section>
            <h2 style={sectionTitleStyle}>Backend Sync</h2>
            <div style={{
              backgroundColor: '#16213e',
              borderRadius: '16px',
              padding: '24px',
              border: '1px solid rgba(255,255,255,0.05)',
              display: 'flex',
              flexDirection: 'column',
              gap: '20px',
            }}>
              <div>
                <label style={labelStyle}>Backend WebSocket URL</label>
                <input
                  type="text"
                  value={backendWsUrl}
                  onChange={(e) => setBackendWsUrl(e.target.value)}
                  placeholder="ws://localhost:8000/ws/sync/"
                  style={inputStyle}
                />
              </div>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '12px',
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '12px 16px',
                  borderRadius: '10px',
                  backgroundColor: 'rgba(255,255,255,0.03)',
                }}>
                  <div style={{
                    width: '10px',
                    height: '10px',
                    borderRadius: '50%',
                    backgroundColor:
                      connectionStatus === 'connected'
                        ? '#22c55e'
                        : connectionStatus === 'connecting'
                        ? '#f59e0b'
                        : 'rgba(160,174,192,0.4)',
                  }} />
                  <span style={{ fontSize: '13px', color: '#a0aec0' }}>
                    {connectionStatus === 'connected'
                      ? 'Connected'
                      : connectionStatus === 'connecting'
                      ? 'Connecting…'
                      : 'Disconnected'}
                  </span>
                </div>
                <button
                  onClick={handleReconnectWs}
                  style={buttonSecondaryStyle}
                >
                  Reconnect
                </button>
              </div>
            </div>
          </section>

          {/* API INTEGRATION */}
          <section>
            <h2 style={sectionTitleStyle}>API Integration</h2>
            <div style={{
              backgroundColor: '#16213e',
              borderRadius: '16px',
              padding: '24px',
              border: '1px solid rgba(255,255,255,0.05)',
              display: 'flex',
              flexDirection: 'column',
              gap: '20px',
            }}>
              {/* API Token */}
              <div>
                <label style={labelStyle}>API Token</label>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <div style={{ position: 'relative', flex: 1 }}>
                    <input
                      type={showApiToken ? 'text' : 'password'}
                      value={apiToken}
                      onChange={(e) => setApiToken(e.target.value)}
                      placeholder="Paste your API token here"
                      style={inputStyle}
                    />
                  </div>
                  <button
                    onClick={() => setShowApiToken(!showApiToken)}
                    style={{
                      ...buttonSecondaryStyle,
                      backgroundColor: 'transparent',
                      border: '1px solid rgba(255,255,255,0.15)',
                      color: '#a0aec0',
                      minWidth: '80px',
                    }}
                  >
                    {showApiToken ? 'Hide' : 'Show'}
                  </button>
                  {apiToken && (
                    <button
                      onClick={() => {
                        setPendingTokenAction('clear')
                        setShowTokenWarning(true)
                      }}
                      style={{
                        ...buttonSecondaryStyle,
                        backgroundColor: 'transparent',
                        border: '1px solid rgba(239,68,68,0.3)',
                        color: '#ef4444',
                      }}
                    >
                      Clear
                    </button>
                  )}
                </div>
                <p style={{ fontSize: '12px', color: 'rgba(160,174,192,0.6)', marginTop: '8px', margin: '8px 0 0 0' }}>
                  This token connects Open Worship with an external app for syncing songs and schedules.
                </p>
              </div>

              {/* API Base URL */}
              <div>
                <label style={labelStyle}>API Base URL</label>
                <input
                  type="text"
                  value={apiBaseUrl}
                  onChange={(e) => setApiBaseUrl(e.target.value)}
                  placeholder="https://api.example.com"
                  style={inputStyle}
                />
              </div>

              {/* Song Endpoint */}
              <div>
                <label style={labelStyle}>Song Retrieval Endpoint</label>
                <input
                  type="text"
                  value={songEndpoint}
                  onChange={(e) => setSongEndpoint(e.target.value)}
                  placeholder="/api/songs"
                  style={inputStyle}
                />
              </div>

              {/* Schedule Endpoint */}
              <div>
                <label style={labelStyle}>Schedule Retrieval Endpoint</label>
                <input
                  type="text"
                  value={scheduleEndpoint}
                  onChange={(e) => setScheduleEndpoint(e.target.value)}
                  placeholder="/api/schedules"
                  style={inputStyle}
                />
              </div>

              {/* Heartbeat Endpoint */}
              <div>
                <label style={labelStyle}>Heartbeat Endpoint</label>
                <input
                  type="text"
                  value={heartbeatEndpoint}
                  onChange={(e) => setHeartbeatEndpoint(e.target.value)}
                  placeholder="/api/heartbeat"
                  style={inputStyle}
                />
                <p style={{ fontSize: '12px', color: 'rgba(160,174,192,0.6)', marginTop: '8px', margin: '8px 0 0 0' }}>
                  Checks for new songs or schedule changes at the interval below.
                </p>
              </div>

              {/* Heartbeat Interval */}
              <div>
                <label style={labelStyle}>Heartbeat Interval (minutes)</label>
                <input
                  type="number"
                  min="1"
                  max="1440"
                  value={heartbeatIntervalMinutes}
                  onChange={(e) => setHeartbeatIntervalMinutes(Math.max(1, parseInt(e.target.value) || 60))}
                  style={{ ...inputStyle, maxWidth: '150px' }}
                />
                <p style={{ fontSize: '12px', color: 'rgba(160,174,192,0.6)', marginTop: '8px', margin: '8px 0 0 0' }}>
                  Default: 60 minutes (1 hour)
                </p>
              </div>
            </div>
          </section>

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

          {/* NDI OUTPUT */}
          <section>
            <h2 style={sectionTitleStyle}>NDI Output</h2>
            <div style={{ 
              backgroundColor: '#16213e', 
              borderRadius: '16px', 
              padding: '24px',
              border: '1px solid rgba(255,255,255,0.05)',
              display: 'flex',
              flexDirection: 'column',
              gap: '20px',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontSize: '14px', color: '#ffffff', marginBottom: '4px' }}>Enable NDI Output</div>
                  <div style={{ fontSize: '13px', color: '#a0aec0' }}>
                    Stream lyrics to OBS via NDI with transparency
                  </div>
                </div>
                <button
                  onClick={() => setNdiEnabled(!ndiEnabled)}
                  style={{
                    width: '48px',
                    height: '26px',
                    borderRadius: '13px',
                    border: 'none',
                    cursor: 'pointer',
                    backgroundColor: ndiEnabled ? '#22c55e' : 'rgba(160,174,192,0.3)',
                    position: 'relative',
                    transition: 'background-color 0.2s',
                  }}
                >
                  <div style={{
                    width: '20px',
                    height: '20px',
                    borderRadius: '50%',
                    backgroundColor: '#ffffff',
                    position: 'absolute',
                    top: '3px',
                    left: ndiEnabled ? '25px' : '3px',
                    transition: 'left 0.2s',
                  }} />
                </button>
              </div>

              <div>
                <label style={labelStyle}>NDI Source Name</label>
                <input
                  type="text"
                  value={ndiSourceName}
                  onChange={(e) => setNdiSourceName(e.target.value)}
                  placeholder="Open Worship"
                  style={inputStyle}
                />
              </div>

              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '12px 16px',
                borderRadius: '10px',
                backgroundColor: 'rgba(255,255,255,0.03)',
              }}>
                <div style={{
                  width: '10px',
                  height: '10px',
                  borderRadius: '50%',
                  backgroundColor: !ndiAvailable
                    ? '#ef4444'
                    : ndiRunning
                    ? (ndiMockMode ? '#f59e0b' : '#22c55e')
                    : 'rgba(160,174,192,0.4)',
                }} />
                <span style={{ fontSize: '13px', color: '#a0aec0' }}>
                  {!ndiAvailable
                    ? 'NDI not available (install NDI SDK)'
                    : ndiRunning && ndiMockMode
                    ? `Mock mode — pipeline active as "${ndiSourceName}" (install NDI SDK for real output)`
                    : ndiRunning
                    ? `Broadcasting as "${ndiSourceName}"`
                    : 'NDI ready — enable to start'}
                </span>
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
                  min="8"
                  max="200"
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
                  <span>8px</span>
                  <span>200px</span>
                </div>
              </div>

              <div>
                <label style={labelStyle}>Font Weight: {fontWeight}</label>
                <input
                  type="range"
                  min="100"
                  max="900"
                  step="100"
                  value={fontWeight}
                  onChange={(e) => setFontWeight(Number(e.target.value))}
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
                  <span>100</span>
                  <span>900</span>
                </div>
              </div>

              <div>
                <label style={labelStyle}>Text Color</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <input
                    type="color"
                    value={textColor}
                    onChange={(e) => setTextColor(e.target.value)}
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
                    value={textColor}
                    onChange={(e) => setTextColor(e.target.value)}
                    style={{ ...inputStyle, flex: 1, fontFamily: 'monospace' }}
                  />
                </div>
              </div>

              {/* Font preview */}
              <div style={{
                padding: '32px',
                borderRadius: '12px',
                ...getBackgroundStyle(defaultBackground),
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                border: '1px solid rgba(255,255,255,0.05)',
                textAlign: 'center',
                color: textColor,
                fontFamily,
                fontWeight,
                fontSize: `${fontSizeSliderVal / 3}px`,
                textShadow: '2px 2px 4px rgba(0,0,0,0.8)',
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
              {/* Color presets */}
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

              {/* Uploaded background images */}
              {backgrounds.length > 0 && (
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(4, 1fr)',
                  gap: '12px',
                  marginBottom: '20px'
                }}>
                  {backgrounds.map((filename) => (
                    <div
                      key={filename}
                      style={{ position: 'relative' }}
                      onMouseEnter={() => setHoveredBg(filename)}
                      onMouseLeave={() => setHoveredBg(null)}
                    >
                      <button
                        onClick={() => setDefaultBackground(filename)}
                        style={{
                          width: '100%',
                          aspectRatio: '16/9',
                          borderRadius: '12px',
                          border: defaultBackground === filename
                            ? '3px solid #e94560'
                            : '2px solid rgba(255,255,255,0.1)',
                          backgroundImage: `url(app-bg:///${filename})`,
                          backgroundSize: 'cover',
                          backgroundPosition: 'center',
                          cursor: 'pointer',
                          transition: 'border-color 0.2s',
                        }}
                      />
                      {/* Default indicator */}
                      {defaultBackground === filename && (
                        <div style={{
                          position: 'absolute',
                          bottom: '6px',
                          left: '6px',
                          width: '20px',
                          height: '20px',
                          borderRadius: '50%',
                          backgroundColor: '#e94560',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}>
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        </div>
                      )}
                      {/* Delete button on hover */}
                      {hoveredBg === filename && (
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDeleteBackground(filename) }}
                          style={{
                            position: 'absolute',
                            top: '6px',
                            right: '6px',
                            width: '24px',
                            height: '24px',
                            borderRadius: '50%',
                            backgroundColor: 'rgba(239,68,68,0.9)',
                            border: 'none',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            padding: 0,
                          }}
                        >
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="18" y1="6" x2="6" y2="18" />
                            <line x1="6" y1="6" x2="18" y2="18" />
                          </svg>
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}

              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <input
                  type="color"
                  value={defaultBackground.startsWith('#') ? defaultBackground : '#000000'}
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
                  value={defaultBackground.startsWith('#') || defaultBackground.startsWith('rgb') ? defaultBackground : '(Background Image)'}
                  onChange={(e) => setDefaultBackground(e.target.value)}
                  readOnly={!defaultBackground.startsWith('#') && !defaultBackground.startsWith('rgb')}
                  style={{ ...inputStyle, flex: 1, fontFamily: 'monospace' }}
                />
                <button
                  onClick={handleAddBackground}
                  style={{
                    ...buttonSecondaryStyle,
                    backgroundColor: 'transparent',
                    border: '1px solid rgba(255,255,255,0.15)',
                    color: '#a0aec0',
                  }}
                >
                  Add Background
                </button>
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

          {/* DATA MANAGEMENT */}
          <section>
            <h2 style={sectionTitleStyle}>Data Management</h2>
            <div style={{ 
              backgroundColor: '#16213e', 
              borderRadius: '16px', 
              padding: '24px',
              border: '1px solid rgba(255,255,255,0.05)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
                <div>
                  <div style={{ fontSize: '14px', color: '#ffffff', marginBottom: '4px' }}>Library Stats</div>
                  <div style={{ fontSize: '13px', color: '#a0aec0' }}>
                    {songs.length} songs • {schedules.length} schedules
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  onClick={handleExportData}
                  style={buttonSecondaryStyle}
                >
                  Export Backup
                </button>
                <button
                  onClick={() => setShowClearConfirm(true)}
                  style={{
                    ...buttonSecondaryStyle,
                    backgroundColor: 'transparent',
                    border: '1px solid rgba(239,68,68,0.3)',
                    color: '#ef4444',
                  }}
                >
                  Clear All Data
                </button>
              </div>
            </div>
          </section>

          {/* ABOUT */}
          <section>
            <h2 style={sectionTitleStyle}>About</h2>
            <div style={{ 
              backgroundColor: '#16213e', 
              borderRadius: '16px', 
              padding: '24px',
              border: '1px solid rgba(255,255,255,0.05)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px' }}>
                <div style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '12px',
                  backgroundColor: '#e94560',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2">
                    <path d="M9 18V5l12-2v13" />
                    <circle cx="6" cy="18" r="3" />
                    <circle cx="18" cy="16" r="3" />
                  </svg>
                </div>
                <div>
                  <div style={{ fontSize: '18px', fontWeight: 700, color: '#ffffff' }}>Open Worship</div>
                  <div style={{ fontSize: '13px', color: '#a0aec0' }}>Version {APP_VERSION}</div>
                </div>
              </div>
              <p style={{ fontSize: '14px', color: '#a0aec0', lineHeight: 1.6, margin: 0 }}>
                A modern worship presentation software for churches. 
                Project lyrics on secondary displays, manage song libraries, 
                and create service schedules with ease.
              </p>
              <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                <a 
                  href="https://github.com/inno8/open-worship" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  style={{ fontSize: '13px', color: '#e94560', textDecoration: 'none' }}
                >
                  View on GitHub →
                </a>
              </div>
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

      {/* Toast notification */}
      {toast && (
        <div style={{ position: 'fixed', bottom: '32px', left: '50%', transform: 'translateX(-50%)', zIndex: 50 }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '12px', 
            padding: '14px 20px', 
            borderRadius: '10px', 
            border: '1px solid rgba(255,255,255,0.1)',
            backgroundColor: '#16213e', 
            boxShadow: '0 10px 25px rgba(0,0,0,0.3)' 
          }}>
            <div style={{ 
              width: '20px', 
              height: '20px', 
              borderRadius: '50%', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              backgroundColor: 'rgba(34,197,94,0.2)' 
            }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <span style={{ color: '#ffffff', fontWeight: 500, fontSize: '13px' }}>{toast}</span>
          </div>
        </div>
      )}

      {/* Clear data confirmation modal */}
      {showClearConfirm && (
        <div 
          style={{ 
            position: 'fixed', 
            inset: 0, 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            zIndex: 50,
            backgroundColor: 'rgba(0,0,0,0.75)' 
          }} 
          onClick={() => setShowClearConfirm(false)}
        >
          <div 
            style={{ 
              borderRadius: '20px',
              border: '1px solid rgba(255,255,255,0.1)',
              width: '400px',
              backgroundColor: '#16213e',
              boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ padding: '32px', textAlign: 'center' }}>
              <div style={{ 
                width: '64px', 
                height: '64px', 
                borderRadius: '50%', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                margin: '0 auto 20px',
                backgroundColor: 'rgba(239,68,68,0.15)',
              }}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                  <line x1="12" y1="9" x2="12" y2="13" />
                  <line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
              </div>
              <h3 style={{ fontSize: '20px', fontWeight: 700, color: '#ffffff', margin: '0 0 12px' }}>Clear All Data?</h3>
              <p style={{ fontSize: '14px', color: '#a0aec0', lineHeight: 1.6, margin: 0 }}>
                This will delete all songs, schedules, and settings. This action cannot be undone.
              </p>
            </div>
            <div style={{ display: 'flex', gap: '12px', padding: '0 24px 24px' }}>
              <button
                onClick={() => setShowClearConfirm(false)}
                style={{
                  flex: 1,
                  padding: '14px',
                  borderRadius: '12px',
                  border: '1px solid rgba(255,255,255,0.2)',
                  backgroundColor: 'transparent',
                  color: '#ffffff',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleClearData}
                style={{
                  flex: 1,
                  padding: '14px',
                  borderRadius: '12px',
                  border: 'none',
                  backgroundColor: '#ef4444',
                  color: '#ffffff',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Clear Data
              </button>
            </div>
          </div>
        </div>
      )}

      {/* API Token warning modal */}
      {showTokenWarning && (
        <div 
          style={{ 
            position: 'fixed', 
            inset: 0, 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            zIndex: 50,
            backgroundColor: 'rgba(0,0,0,0.75)' 
          }} 
          onClick={() => {
            setShowTokenWarning(false)
            setPendingTokenAction(null)
            setTempToken('')
          }}
        >
          <div 
            style={{ 
              borderRadius: '20px',
              border: '1px solid rgba(255,255,255,0.1)',
              width: '440px',
              backgroundColor: '#16213e',
              boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ padding: '32px', textAlign: 'center' }}>
              <div style={{ 
                width: '64px', 
                height: '64px', 
                borderRadius: '50%', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                margin: '0 auto 20px',
                backgroundColor: 'rgba(245,158,11,0.15)',
              }}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                  <line x1="12" y1="9" x2="12" y2="13" />
                  <line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
              </div>
              <h3 style={{ fontSize: '20px', fontWeight: 700, color: '#ffffff', margin: '0 0 12px' }}>
                {pendingTokenAction === 'clear' ? 'Remove API Token?' : 'Change API Token?'}
              </h3>
              <p style={{ fontSize: '14px', color: '#a0aec0', lineHeight: 1.6, margin: 0 }}>
                This token connects Open Worship with an external app where songs and schedules are synced. 
                {pendingTokenAction === 'clear' 
                  ? ' Removing it will disconnect the sync.'
                  : ' Changing it may affect your sync connection.'}
              </p>
            </div>
            <div style={{ display: 'flex', gap: '12px', padding: '0 24px 24px' }}>
              <button
                onClick={() => {
                  setShowTokenWarning(false)
                  setPendingTokenAction(null)
                  setTempToken('')
                }}
                style={{
                  flex: 1,
                  padding: '14px',
                  borderRadius: '12px',
                  border: '1px solid rgba(255,255,255,0.2)',
                  backgroundColor: 'transparent',
                  color: '#ffffff',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (pendingTokenAction === 'clear') {
                    setApiToken('')
                    showToast('API token removed')
                  } else if (pendingTokenAction === 'edit') {
                    setApiToken(tempToken)
                    showToast('API token updated')
                  }
                  setShowTokenWarning(false)
                  setPendingTokenAction(null)
                  setTempToken('')
                }}
                style={{
                  flex: 1,
                  padding: '14px',
                  borderRadius: '12px',
                  border: 'none',
                  backgroundColor: '#f59e0b',
                  color: '#ffffff',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                {pendingTokenAction === 'clear' ? 'Remove Token' : 'Continue'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
