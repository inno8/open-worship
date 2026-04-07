import { useState, useCallback, useRef, useEffect } from 'react'
import { usePresentationStore } from '../stores/presentationStore'

// Types for announcements
interface ImageItem {
  id: string
  name: string
  imagePath: string
}

interface TextAnnouncement {
  id: string
  name: string
  content: string
  backgroundImage: string | null
  displayMode: 'lower-third' | 'full-screen'
  formatting: {
    bold?: boolean
    italic?: boolean
    underline?: boolean
    fontSize?: number
    textAlign?: 'left' | 'center' | 'right'
    textColor?: string
  }
}

interface VideoItem {
  id: string
  name: string
  imagePath: string
}

type TabType = 'images' | 'text' | 'videos'

export default function Announcements() {
  const {
    isLive,
    setLive,
    setCurrentSlide,
    backgrounds,
    loadBackgrounds,
  } = usePresentationStore()

  // State
  const [activeTab, setActiveTab] = useState<TabType>('images')
  const [imageItems, setImageItems] = useState<ImageItem[]>([])
  const [textAnnouncements, setTextAnnouncements] = useState<TextAnnouncement[]>([])
  const [videoItems, setVideoItems] = useState<VideoItem[]>([])
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null)
  const [previewContent, setPreviewContent] = useState<{
    type: TabType
    data: ImageItem | TextAnnouncement | VideoItem
  } | null>(null)
  const [liveContent, setLiveContent] = useState<typeof previewContent>(null)
  const [toast, setToast] = useState<string | null>(null)
  
  // Text announcement dialog state
  const [showTextDialog, setShowTextDialog] = useState(false)
  const [editingText, setEditingText] = useState<TextAnnouncement | null>(null)
  const [textForm, setTextForm] = useState({
    name: '',
    content: '',
    backgroundImage: null as string | null,
    displayMode: 'full-screen' as 'lower-third' | 'full-screen',
    formatting: {
      bold: false,
      italic: false,
      underline: false,
      fontSize: 48,
      textAlign: 'center' as 'left' | 'center' | 'right',
      textColor: '#ffffff',
    }
  })
  
  // Background picker state
  const [showBgPicker, setShowBgPicker] = useState(false)

  // File input refs
  const imageInputRef = useRef<HTMLInputElement>(null)
  const videoInputRef = useRef<HTMLInputElement>(null)
  const textBgInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => { loadBackgrounds() }, [])

  // Load announcements from DB on mount
  useEffect(() => {
    async function loadFromDb() {
      if (!window.electronAPI?.announcements) return
      const all = await window.electronAPI.announcements.getAll()
      const images: ImageItem[] = []
      const texts: TextAnnouncement[] = []
      const videos: VideoItem[] = []
      for (const row of all) {
        if (row.type === 'image') {
          images.push({ id: row.id, name: row.name, imagePath: row.filePath || '' })
        } else if (row.type === 'text') {
          const fmt = JSON.parse(row.formatting || '{}')
          texts.push({
            id: row.id,
            name: row.name,
            content: row.content || '',
            backgroundImage: row.filePath || null,
            displayMode: fmt.displayMode || 'full-screen',
            formatting: {
              bold: fmt.bold ?? false,
              italic: fmt.italic ?? false,
              underline: fmt.underline ?? false,
              fontSize: fmt.fontSize ?? 48,
              textAlign: fmt.textAlign ?? 'center',
              textColor: fmt.textColor ?? '#ffffff',
            }
          })
        } else if (row.type === 'video') {
          videos.push({ id: row.id, name: row.name, imagePath: row.filePath || '' })
        }
      }
      setImageItems(images)
      setTextAnnouncements(texts)
      setVideoItems(videos)
    }
    loadFromDb()
  }, [])

  const showToast = useCallback((message: string) => {
    setToast(message)
    setTimeout(() => setToast(null), 3000)
  }, [])

  // Helper to save announcement to DB
  const saveToDb = async (type: 'image' | 'text' | 'video', id: string, name: string, content: string | null, filePath: string | null, formatting: Record<string, unknown> = {}) => {
    if (!window.electronAPI?.announcements) return
    const now = new Date().toISOString()
    await window.electronAPI.announcements.create({
      id, type, name, content, filePath,
      formatting: JSON.stringify(formatting),
      createdAt: now, updatedAt: now,
    })
  }

  // Import handlers
  const handleImportImages = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return

    for (const file of Array.from(files)) {
      const id = crypto.randomUUID()
      const name = file.name.replace(/\.[^/.]+$/, '')

      const reader = new FileReader()
      reader.onload = async () => {
        const imagePath = reader.result as string
        setImageItems(prev => [...prev, { id, name, imagePath }])
        await saveToDb('image', id, name, null, imagePath)
        showToast(`Imported "${name}"`)
      }
      reader.readAsDataURL(file)
    }
    e.target.value = ''
  }

  const handleImportVideos = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return

    for (const file of Array.from(files)) {
      const id = crypto.randomUUID()
      const name = file.name.replace(/\.[^/.]+$/, '')

      const reader = new FileReader()
      reader.onload = async () => {
        const imagePath = reader.result as string
        setVideoItems(prev => [...prev, { id, name, imagePath }])
        await saveToDb('video', id, name, null, imagePath)
        showToast(`Imported "${name}"`)
      }
      reader.readAsDataURL(file)
    }
    e.target.value = ''
  }

  const handleImportTextBackground = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    
    const reader = new FileReader()
    reader.onload = () => {
      setTextForm(prev => ({ ...prev, backgroundImage: reader.result as string }))
    }
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  // Text announcement handlers
  const handleNewTextAnnouncement = () => {
    setEditingText(null)
    setTextForm({
      name: '',
      content: '',
      backgroundImage: null,
      displayMode: 'full-screen',
      formatting: {
        bold: false,
        italic: false,
        underline: false,
        fontSize: 48,
        textAlign: 'center',
        textColor: '#ffffff',
      }
    })
    setShowTextDialog(true)
  }

  const handleEditTextAnnouncement = (item: TextAnnouncement) => {
    setEditingText(item)
    setTextForm({
      name: item.name,
      content: item.content,
      backgroundImage: item.backgroundImage,
      displayMode: item.displayMode || 'full-screen',
      formatting: {
        bold: item.formatting.bold ?? false,
        italic: item.formatting.italic ?? false,
        underline: item.formatting.underline ?? false,
        fontSize: item.formatting.fontSize ?? 48,
        textAlign: item.formatting.textAlign ?? 'center',
        textColor: item.formatting.textColor ?? '#ffffff',
      }
    })
    setShowTextDialog(true)
  }

  const handleSaveTextAnnouncement = async () => {
    if (!textForm.name.trim() || !textForm.content.trim()) {
      showToast('Please enter a name and content')
      return
    }

    const formatting = { ...textForm.formatting, displayMode: textForm.displayMode }

    if (editingText) {
      const updated = { ...editingText, ...textForm }
      setTextAnnouncements(prev => prev.map(item =>
        item.id === editingText.id ? updated : item
      ))
      if (window.electronAPI?.announcements) {
        await window.electronAPI.announcements.update(editingText.id, {
          name: textForm.name,
          content: textForm.content,
          filePath: textForm.backgroundImage,
          formatting: JSON.stringify(formatting),
        })
      }
      showToast('Announcement updated')
    } else {
      const id = crypto.randomUUID()
      const newItem: TextAnnouncement = { id, ...textForm }
      setTextAnnouncements(prev => [...prev, newItem])
      await saveToDb('text', id, textForm.name, textForm.content, textForm.backgroundImage, formatting)
      showToast('Announcement created')
    }
    setShowTextDialog(false)
  }

  // Delete handlers
  const handleDeleteItem = async (type: TabType, id: string) => {
    if (type === 'images') {
      setImageItems(prev => prev.filter(item => item.id !== id))
    } else if (type === 'text') {
      setTextAnnouncements(prev => prev.filter(item => item.id !== id))
    } else {
      setVideoItems(prev => prev.filter(item => item.id !== id))
    }
    if (selectedItemId === id) {
      setSelectedItemId(null)
      setPreviewContent(null)
    }
    if (window.electronAPI?.announcements) {
      await window.electronAPI.announcements.delete(id)
    }
    showToast('Item deleted')
  }

  // Preview handler
  const handlePreview = (type: TabType, item: LowerThirdItem | TextAnnouncement | FullScreenItem) => {
    setSelectedItemId(item.id)
    setPreviewContent({ type, data: item })
  }

  // Live handlers
  const handleToggleLive = () => {
    if (isLive) {
      setLive(false)
      setLiveContent(null)
    } else {
      setLive(true)
      if (previewContent) {
        setLiveContent(previewContent)
        // Also update the presentation store for NDI output
        updateNdiOutput(previewContent)
      }
    }
  }

  const handleBlackout = () => {
    if (isLive) {
      usePresentationStore.getState().showBlank()
      setLiveContent(null)
    }
  }

  const handlePushToLive = () => {
    if (previewContent) {
      setLiveContent(previewContent)
      updateNdiOutput(previewContent)
      if (!isLive) {
        setLive(true)
      }
    }
  }

  const updateNdiOutput = (content: NonNullable<typeof previewContent>) => {
    // Update NDI/presentation output based on content type
    if (content.type === 'images') {
      const item = content.data as ImageItem
      setCurrentSlide({
        text: '',
        sectionType: 'announcement',
        textPosition: 'lower-third',
        backgroundImage: item.imagePath,
      })
    } else if (content.type === 'text') {
      const item = content.data as TextAnnouncement
      const isLowerThird = item.displayMode === 'lower-third'
      setCurrentSlide({
        text: item.content,
        sectionType: 'announcement',
        textPosition: isLowerThird ? 'lower-third' : 'center',
        fontSize: `${isLowerThird ? Math.min(item.formatting.fontSize || 48, 32) : item.formatting.fontSize}px`,
        textColor: item.formatting.textColor,
        fontWeight: item.formatting.bold ? 700 : 400,
        backgroundImage: item.backgroundImage || undefined,
      })
    } else if (content.type === 'videos') {
      const item = content.data as VideoItem
      setCurrentSlide({
        text: '',
        sectionType: 'announcement',
        textPosition: 'center',
        backgroundImage: item.imagePath,
      })
    }
    
    if (window.electronAPI) {
      window.electronAPI.updatePresentation(usePresentationStore.getState().currentSlide)
    }
  }

  // Get items for current tab
  const getCurrentItems = () => {
    switch (activeTab) {
      case 'images':
        return imageItems
      case 'text':
        return textAnnouncements
      case 'videos':
        return videoItems
    }
  }

  // Render preview content
  const renderPreviewContent = (content: typeof previewContent, isLivePanel = false) => {
    if (!content) {
      return (
        <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '14px' }}>
          {isLivePanel ? (isLive ? 'Black screen' : 'Not live') : 'Select an item to preview'}
        </span>
      )
    }

    if (content.type === 'images' || content.type === 'videos') {
      const item = content.data as ImageItem | VideoItem
      return (
        <img
          src={item.imagePath}
          alt={item.name}
          style={{
            maxWidth: '100%',
            maxHeight: '100%',
            objectFit: 'contain',
          }}
        />
      )
    }

    if (content.type === 'text') {
      const item = content.data as TextAnnouncement
      return (
        <div style={{ 
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px',
          backgroundImage: item.backgroundImage ? `url(${item.backgroundImage})` : undefined,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}>
          <p style={{
            color: item.formatting.textColor,
            fontSize: `calc(${item.formatting.fontSize}px * 0.4)`,
            fontWeight: item.formatting.bold ? 700 : 400,
            fontStyle: item.formatting.italic ? 'italic' : 'normal',
            textDecoration: item.formatting.underline ? 'underline' : 'none',
            textAlign: item.formatting.textAlign,
            textShadow: '2px 2px 8px rgba(0,0,0,0.8)',
            whiteSpace: 'pre-line',
            margin: 0,
          }}>
            {item.content}
          </p>
        </div>
      )
    }

    return null
  }

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', backgroundColor: '#1a1a2e' }}>
      {/* Header with GO LIVE button */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between', 
        padding: '12px 20px',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
        backgroundColor: '#16213e',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <span style={{ fontSize: '15px', fontWeight: 700, color: '#ffffff' }}>Announcements</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: isLive ? '#22c55e' : 'rgba(160,174,192,0.3)',
                animation: isLive ? 'pulse 1.5s ease-in-out infinite' : 'none',
              }}
            />
            <span style={{ fontSize: '11px', fontWeight: 600, color: isLive ? '#22c55e' : '#a0aec0' }}>
              {isLive ? 'LIVE' : 'OFF AIR'}
            </span>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            onClick={handleBlackout}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              backgroundColor: '#000000',
              color: '#ffffff',
              border: '1px solid rgba(255,255,255,0.15)',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: 600,
            }}
          >
            Black
          </button>
          <button
            onClick={handleToggleLive}
            style={{
              padding: '8px 24px',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: 700,
              border: 'none',
              cursor: 'pointer',
              backgroundColor: isLive ? '#22c55e' : '#e94560',
              color: '#ffffff',
            }}
          >
            {isLive ? '● STOP' : 'GO LIVE'}
          </button>
        </div>
      </div>

      {/* Main content - 3 sections */}
      <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>
        
        {/* Section 1: Tabs Panel */}
        <div style={{ 
          width: '360px', 
          minWidth: '360px',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: '#16213e',
          borderRight: '1px solid rgba(255,255,255,0.08)',
        }}>
          {/* Tabs */}
          <div style={{ 
            display: 'flex',
            borderBottom: '1px solid rgba(255,255,255,0.08)',
          }}>
            {(['images', 'text', 'videos'] as TabType[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                style={{
                  flex: 1,
                  padding: '12px 8px',
                  backgroundColor: activeTab === tab ? 'rgba(233,69,96,0.15)' : 'transparent',
                  color: activeTab === tab ? '#e94560' : '#a0aec0',
                  border: 'none',
                  borderBottom: activeTab === tab ? '2px solid #e94560' : '2px solid transparent',
                  cursor: 'pointer',
                  fontSize: '11px',
                  fontWeight: 600,
                  textTransform: 'capitalize',
                }}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
            {/* Action buttons */}
            <div style={{ padding: '12px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              {activeTab === 'images' && (
                <>
                  <input
                    ref={imageInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImportImages}
                    style={{ display: 'none' }}
                  />
                  <button
                    onClick={() => imageInputRef.current?.click()}
                    style={{
                      width: '100%',
                      padding: '10px 16px',
                      borderRadius: '8px',
                      backgroundColor: '#0f3460',
                      color: '#ffffff',
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: '12px',
                      fontWeight: 600,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                    }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" />
                    </svg>
                    Import Images
                  </button>
                </>
              )}

              {activeTab === 'text' && (
                <button
                  onClick={handleNewTextAnnouncement}
                  style={{
                    width: '100%',
                    padding: '10px 16px',
                    borderRadius: '8px',
                    backgroundColor: '#0f3460',
                    color: '#ffffff',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '12px',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                  }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="12" y1="5" x2="12" y2="19" />
                    <line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                  New Text Announcement
                </button>
              )}

              {activeTab === 'videos' && (
                <>
                  <input
                    ref={videoInputRef}
                    type="file"
                    accept="image/*,video/*"
                    multiple
                    onChange={handleImportVideos}
                    style={{ display: 'none' }}
                  />
                  <button
                    onClick={() => videoInputRef.current?.click()}
                    style={{
                      width: '100%',
                      padding: '10px 16px',
                      borderRadius: '8px',
                      backgroundColor: '#0f3460',
                      color: '#ffffff',
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: '12px',
                      fontWeight: 600,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                    }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" />
                    </svg>
                    Import Videos
                  </button>
                </>
              )}
            </div>

            {/* Items list */}
            <div style={{ flex: 1, overflowY: 'auto' }}>
              {getCurrentItems().length === 0 ? (
                <div style={{ padding: '40px 20px', textAlign: 'center', color: '#a0aec0', fontSize: '13px' }}>
                  {activeTab === 'images' && 'Import images to get started'}
                  {activeTab === 'text' && 'Create text announcements to display'}
                  {activeTab === 'videos' && 'Import videos to get started'}
                </div>
              ) : (
                getCurrentItems().map((item) => (
                  <div
                    key={item.id}
                    onClick={() => handlePreview(activeTab, item)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '12px 16px',
                      cursor: 'pointer',
                      backgroundColor: selectedItemId === item.id ? 'rgba(233,69,96,0.15)' : 'transparent',
                      borderLeft: selectedItemId === item.id ? '3px solid #e94560' : '3px solid transparent',
                    }}
                  >
                    {/* Thumbnail */}
                    <div style={{
                      width: '60px',
                      height: '34px',
                      borderRadius: '4px',
                      overflow: 'hidden',
                      backgroundColor: '#1a1a2e',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}>
                      {activeTab === 'text' ? (
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#a0aec0" strokeWidth="2">
                          <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                          <polyline points="14 2 14 8 20 8" />
                          <line x1="16" y1="13" x2="8" y2="13" />
                          <line x1="16" y1="17" x2="8" y2="17" />
                        </svg>
                      ) : (
                        <img
                          src={(item as ImageItem | VideoItem).imagePath}
                          alt={item.name}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      )}
                    </div>
                    
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ 
                        fontSize: '13px', 
                        color: '#ffffff',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}>
                        {item.name}
                      </div>
                      {activeTab === 'text' && (
                        <div style={{ 
                          fontSize: '11px', 
                          color: '#a0aec0',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}>
                          {(item as TextAnnouncement).content.slice(0, 50)}...
                        </div>
                      )}
                    </div>

                    <div style={{ display: 'flex', gap: '4px' }}>
                      {activeTab === 'text' && (
                        <button
                          onClick={(e) => { e.stopPropagation(); handleEditTextAnnouncement(item as TextAnnouncement) }}
                          title="Edit"
                          style={{
                            padding: '6px',
                            borderRadius: '4px',
                            backgroundColor: 'rgba(255,255,255,0.05)',
                            color: '#a0aec0',
                            border: 'none',
                            cursor: 'pointer',
                          }}
                        >
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                            <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                          </svg>
                        </button>
                      )}
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDeleteItem(activeTab, item.id) }}
                        title="Delete"
                        style={{
                          padding: '6px',
                          borderRadius: '4px',
                          backgroundColor: 'rgba(239,68,68,0.1)',
                          color: '#ef4444',
                          border: 'none',
                          cursor: 'pointer',
                        }}
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="3 6 5 6 21 6" />
                          <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Section 2 & 3: Preview and Live Outputs */}
        <div style={{ 
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          minWidth: '200px',
        }}>
          <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>
            {/* Preview Output */}
            <div style={{ 
              flex: 1, 
              display: 'flex',
              flexDirection: 'column',
              borderRight: '1px solid rgba(255,255,255,0.08)',
            }}>
              <div style={{
                padding: '12px 16px',
                borderBottom: '1px solid rgba(255,255,255,0.08)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}>
                <span style={{ fontSize: '11px', fontWeight: 700, color: '#a0aec0', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Preview
                </span>
                <button
                  onClick={handlePushToLive}
                  style={{
                    padding: '4px 10px',
                    borderRadius: '6px',
                    backgroundColor: '#e94560',
                    color: '#ffffff',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '10px',
                    fontWeight: 600,
                  }}
                >
                  → LIVE
                </button>
              </div>
              <div style={{
                flex: 1,
                backgroundColor: '#000000',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
              }}>
                {renderPreviewContent(previewContent)}
              </div>
            </div>

            {/* Live Output */}
            <div style={{ 
              flex: 1, 
              display: 'flex',
              flexDirection: 'column',
            }}>
              <div style={{ 
                padding: '12px 16px', 
                borderBottom: '1px solid rgba(255,255,255,0.08)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}>
                <div
                  style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    backgroundColor: isLive ? '#22c55e' : 'rgba(160,174,192,0.3)',
                    animation: isLive ? 'pulse 1.5s ease-in-out infinite' : 'none',
                  }}
                />
                <span style={{ fontSize: '11px', fontWeight: 700, color: isLive ? '#22c55e' : '#a0aec0', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Live
                </span>
              </div>
              <div style={{
                flex: 1,
                backgroundColor: '#000000',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
                border: isLive ? '2px solid #22c55e' : '2px solid transparent',
              }}>
                {renderPreviewContent(liveContent, true)}
              </div>
            </div>
          </div>

          {/* Keyboard hints */}
          <div style={{ 
            display: 'flex', 
            justifyContent: 'center',
            gap: '24px', 
            fontSize: '11px', 
            color: 'rgba(160,174,192,0.4)',
            padding: '10px',
            borderTop: '1px solid rgba(255,255,255,0.05)',
          }}>
            <span>Click to Preview</span>
            <span>→ LIVE to broadcast</span>
            <span>B Black</span>
          </div>
        </div>
      </div>

      {/* Text Announcement Dialog */}
      {showTextDialog && (
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
          onClick={() => setShowTextDialog(false)}
        >
          <div
            style={{
              borderRadius: '20px',
              border: '1px solid rgba(255,255,255,0.1)',
              width: '600px',
              maxHeight: '85vh',
              display: 'flex',
              flexDirection: 'column',
              backgroundColor: '#16213e',
              boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '20px 24px',
              borderBottom: '1px solid rgba(255,255,255,0.1)',
            }}>
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#ffffff', margin: 0 }}>
                {editingText ? 'Edit Announcement' : 'New Announcement'}
              </h3>
              <button
                onClick={() => setShowTextDialog(false)}
                style={{ background: 'none', border: 'none', color: '#a0aec0', cursor: 'pointer', padding: '6px' }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            
            <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
              {/* Name input */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#a0aec0', marginBottom: '8px' }}>
                  Announcement Name
                </label>
                <input
                  type="text"
                  value={textForm.name}
                  onChange={(e) => setTextForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., Welcome Message"
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    borderRadius: '10px',
                    backgroundColor: '#1a1a2e',
                    color: '#ffffff',
                    border: '1px solid rgba(255,255,255,0.1)',
                    fontSize: '14px',
                    outline: 'none',
                  }}
                />
              </div>

              {/* Display Mode */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#a0aec0', marginBottom: '8px' }}>
                  Display Mode
                </label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {(['lower-third', 'full-screen'] as const).map((mode) => (
                    <button
                      key={mode}
                      onClick={() => {
                        setTextForm(prev => ({
                          ...prev,
                          displayMode: mode,
                          formatting: {
                            ...prev.formatting,
                            fontSize: mode === 'lower-third' ? Math.min(prev.formatting.fontSize, 32) : prev.formatting.fontSize < 32 ? 48 : prev.formatting.fontSize,
                          }
                        }))
                      }}
                      style={{
                        flex: 1,
                        padding: '10px 16px',
                        borderRadius: '8px',
                        backgroundColor: textForm.displayMode === mode ? 'rgba(233,69,96,0.2)' : 'rgba(255,255,255,0.05)',
                        color: textForm.displayMode === mode ? '#e94560' : '#a0aec0',
                        border: textForm.displayMode === mode ? '1px solid #e94560' : '1px solid rgba(255,255,255,0.1)',
                        cursor: 'pointer',
                        fontSize: '12px',
                        fontWeight: 600,
                      }}
                    >
                      {mode === 'lower-third' ? 'Lower Third' : 'Full Screen'}
                    </button>
                  ))}
                </div>
                <div style={{ fontSize: '11px', color: 'rgba(160,174,192,0.5)', marginTop: '6px' }}>
                  {textForm.displayMode === 'lower-third'
                    ? 'Text appears in the bottom third of the screen (1920x360)'
                    : 'Text covers the full screen (1920x1080)'}
                </div>
              </div>

              {/* WYSIWYG Toolbar */}
              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#a0aec0', marginBottom: '8px' }}>
                  Announcement Text
                </label>
                <div style={{
                  display: 'flex',
                  gap: '8px',
                  padding: '8px 12px',
                  backgroundColor: '#1a1a2e',
                  borderRadius: '10px 10px 0 0',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderBottom: 'none',
                  flexWrap: 'wrap',
                }}>
                  {/* Bold */}
                  <button
                    onClick={() => setTextForm(prev => ({ 
                      ...prev, 
                      formatting: { ...prev.formatting, bold: !prev.formatting.bold } 
                    }))}
                    style={{
                      padding: '6px 10px',
                      borderRadius: '6px',
                      backgroundColor: textForm.formatting.bold ? 'rgba(233,69,96,0.3)' : 'rgba(255,255,255,0.05)',
                      color: textForm.formatting.bold ? '#e94560' : '#a0aec0',
                      border: 'none',
                      cursor: 'pointer',
                      fontWeight: 700,
                    }}
                  >
                    B
                  </button>
                  
                  {/* Italic */}
                  <button
                    onClick={() => setTextForm(prev => ({ 
                      ...prev, 
                      formatting: { ...prev.formatting, italic: !prev.formatting.italic } 
                    }))}
                    style={{
                      padding: '6px 10px',
                      borderRadius: '6px',
                      backgroundColor: textForm.formatting.italic ? 'rgba(233,69,96,0.3)' : 'rgba(255,255,255,0.05)',
                      color: textForm.formatting.italic ? '#e94560' : '#a0aec0',
                      border: 'none',
                      cursor: 'pointer',
                      fontStyle: 'italic',
                    }}
                  >
                    I
                  </button>
                  
                  {/* Underline */}
                  <button
                    onClick={() => setTextForm(prev => ({ 
                      ...prev, 
                      formatting: { ...prev.formatting, underline: !prev.formatting.underline } 
                    }))}
                    style={{
                      padding: '6px 10px',
                      borderRadius: '6px',
                      backgroundColor: textForm.formatting.underline ? 'rgba(233,69,96,0.3)' : 'rgba(255,255,255,0.05)',
                      color: textForm.formatting.underline ? '#e94560' : '#a0aec0',
                      border: 'none',
                      cursor: 'pointer',
                      textDecoration: 'underline',
                    }}
                  >
                    U
                  </button>
                  
                  <div style={{ width: '1px', backgroundColor: 'rgba(255,255,255,0.1)', margin: '0 4px' }} />
                  
                  {/* Text Align */}
                  {(['left', 'center', 'right'] as const).map((align) => (
                    <button
                      key={align}
                      onClick={() => setTextForm(prev => ({ 
                        ...prev, 
                        formatting: { ...prev.formatting, textAlign: align } 
                      }))}
                      style={{
                        padding: '6px 10px',
                        borderRadius: '6px',
                        backgroundColor: textForm.formatting.textAlign === align ? 'rgba(233,69,96,0.3)' : 'rgba(255,255,255,0.05)',
                        color: textForm.formatting.textAlign === align ? '#e94560' : '#a0aec0',
                        border: 'none',
                        cursor: 'pointer',
                      }}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        {align === 'left' && <><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="15" y2="12"/><line x1="3" y1="18" x2="18" y2="18"/></>}
                        {align === 'center' && <><line x1="3" y1="6" x2="21" y2="6"/><line x1="6" y1="12" x2="18" y2="12"/><line x1="4" y1="18" x2="20" y2="18"/></>}
                        {align === 'right' && <><line x1="3" y1="6" x2="21" y2="6"/><line x1="9" y1="12" x2="21" y2="12"/><line x1="6" y1="18" x2="21" y2="18"/></>}
                      </svg>
                    </button>
                  ))}
                  
                  <div style={{ width: '1px', backgroundColor: 'rgba(255,255,255,0.1)', margin: '0 4px' }} />
                  
                  {/* Font Size */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '11px', color: '#a0aec0' }}>Size:</span>
                    <input
                      type="number"
                      value={textForm.formatting.fontSize}
                      onChange={(e) => setTextForm(prev => ({ 
                        ...prev, 
                        formatting: { ...prev.formatting, fontSize: parseInt(e.target.value) || 48 } 
                      }))}
                      style={{
                        width: '60px',
                        padding: '4px 8px',
                        borderRadius: '6px',
                        backgroundColor: 'rgba(255,255,255,0.05)',
                        color: '#ffffff',
                        border: '1px solid rgba(255,255,255,0.1)',
                        fontSize: '12px',
                        outline: 'none',
                      }}
                    />
                  </div>
                  
                  {/* Text Color */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '11px', color: '#a0aec0' }}>Color:</span>
                    <input
                      type="color"
                      value={textForm.formatting.textColor}
                      onChange={(e) => setTextForm(prev => ({ 
                        ...prev, 
                        formatting: { ...prev.formatting, textColor: e.target.value } 
                      }))}
                      style={{
                        width: '32px',
                        height: '28px',
                        borderRadius: '6px',
                        border: '1px solid rgba(255,255,255,0.1)',
                        cursor: 'pointer',
                      }}
                    />
                  </div>
                </div>
                
                {/* Text area */}
                <textarea
                  value={textForm.content}
                  onChange={(e) => setTextForm(prev => ({ ...prev, content: e.target.value }))}
                  placeholder="Enter your announcement text here..."
                  rows={6}
                  style={{
                    width: '100%',
                    padding: '16px',
                    borderRadius: '0 0 10px 10px',
                    backgroundColor: '#1a1a2e',
                    color: '#ffffff',
                    border: '1px solid rgba(255,255,255,0.1)',
                    fontSize: '14px',
                    outline: 'none',
                    resize: 'vertical',
                    fontWeight: textForm.formatting.bold ? 700 : 400,
                    fontStyle: textForm.formatting.italic ? 'italic' : 'normal',
                    textDecoration: textForm.formatting.underline ? 'underline' : 'none',
                    textAlign: textForm.formatting.textAlign,
                  }}
                />
              </div>

              {/* Background Image */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#a0aec0', marginBottom: '8px' }}>
                  Background Image (Optional)
                </label>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <input
                    ref={textBgInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImportTextBackground}
                    style={{ display: 'none' }}
                  />
                  <button
                    onClick={() => textBgInputRef.current?.click()}
                    style={{
                      padding: '10px 16px',
                      borderRadius: '8px',
                      backgroundColor: 'rgba(255,255,255,0.05)',
                      color: '#ffffff',
                      border: '1px solid rgba(255,255,255,0.1)',
                      cursor: 'pointer',
                      fontSize: '12px',
                    }}
                  >
                    Import Image
                  </button>
                  <button
                    onClick={() => setShowBgPicker(true)}
                    style={{
                      padding: '10px 16px',
                      borderRadius: '8px',
                      backgroundColor: 'rgba(255,255,255,0.05)',
                      color: '#ffffff',
                      border: '1px solid rgba(255,255,255,0.1)',
                      cursor: 'pointer',
                      fontSize: '12px',
                    }}
                  >
                    Choose from Library
                  </button>
                  {textForm.backgroundImage && (
                    <button
                      onClick={() => setTextForm(prev => ({ ...prev, backgroundImage: null }))}
                      style={{
                        padding: '10px 16px',
                        borderRadius: '8px',
                        backgroundColor: 'rgba(239,68,68,0.1)',
                        color: '#ef4444',
                        border: '1px solid rgba(239,68,68,0.2)',
                        cursor: 'pointer',
                        fontSize: '12px',
                      }}
                    >
                      Clear
                    </button>
                  )}
                </div>
                {textForm.backgroundImage && (
                  <div style={{
                    marginTop: '12px',
                    width: '160px',
                    height: '90px',
                    borderRadius: '8px',
                    overflow: 'hidden',
                    border: '1px solid rgba(255,255,255,0.1)',
                  }}>
                    <img
                      src={textForm.backgroundImage}
                      alt="Background preview"
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  </div>
                )}
              </div>

              {/* Preview */}
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#a0aec0', marginBottom: '8px' }}>
                  Preview
                </label>
                <div style={{
                  width: '100%',
                  aspectRatio: textForm.displayMode === 'lower-third' ? '16/3' : '16/9',
                  borderRadius: '10px',
                  overflow: 'hidden',
                  border: '1px solid rgba(255,255,255,0.1)',
                  backgroundColor: '#000000',
                  backgroundImage: textForm.backgroundImage ? `url(${textForm.backgroundImage})` : undefined,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  display: 'flex',
                  alignItems: textForm.displayMode === 'lower-third' ? 'flex-end' : 'center',
                  justifyContent: 'center',
                  padding: textForm.displayMode === 'lower-third' ? '8px 16px' : '16px',
                }}>
                  <p style={{
                    color: textForm.formatting.textColor,
                    fontSize: `calc(${textForm.formatting.fontSize}px * 0.3)`,
                    fontWeight: textForm.formatting.bold ? 700 : 400,
                    fontStyle: textForm.formatting.italic ? 'italic' : 'normal',
                    textDecoration: textForm.formatting.underline ? 'underline' : 'none',
                    textAlign: textForm.formatting.textAlign,
                    textShadow: '2px 2px 8px rgba(0,0,0,0.8)',
                    whiteSpace: 'pre-line',
                    margin: 0,
                    width: '100%',
                  }}>
                    {textForm.content || 'Preview text will appear here'}
                  </p>
                </div>
              </div>
            </div>

            <div style={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '12px',
              padding: '20px 24px',
              borderTop: '1px solid rgba(255,255,255,0.1)',
            }}>
              <button
                onClick={() => setShowTextDialog(false)}
                style={{
                  padding: '10px 20px',
                  borderRadius: '8px',
                  backgroundColor: 'rgba(255,255,255,0.05)',
                  color: '#a0aec0',
                  border: '1px solid rgba(255,255,255,0.1)',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: 600,
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleSaveTextAnnouncement}
                style={{
                  padding: '10px 20px',
                  borderRadius: '8px',
                  backgroundColor: '#e94560',
                  color: '#ffffff',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: 600,
                }}
              >
                {editingText ? 'Save Changes' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Background picker modal for text announcement */}
      {showBgPicker && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 60,
            backgroundColor: 'rgba(0,0,0,0.75)'
          }}
          onClick={() => setShowBgPicker(false)}
        >
          <div
            style={{
              borderRadius: '20px',
              border: '1px solid rgba(255,255,255,0.1)',
              width: '480px',
              maxHeight: '70vh',
              display: 'flex',
              flexDirection: 'column',
              backgroundColor: '#16213e',
              boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '20px 24px',
              borderBottom: '1px solid rgba(255,255,255,0.1)',
            }}>
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#ffffff', margin: 0 }}>Choose Background</h3>
              <button
                onClick={() => setShowBgPicker(false)}
                style={{ background: 'none', border: 'none', color: '#a0aec0', cursor: 'pointer', padding: '6px' }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>
              {backgrounds.length > 0 ? (
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: '10px',
                }}>
                  {backgrounds.map((filename) => (
                    <button
                      key={filename}
                      onClick={() => {
                        setTextForm(prev => ({ ...prev, backgroundImage: `app-bg:///${filename}` }))
                        setShowBgPicker(false)
                      }}
                      style={{
                        aspectRatio: '16/9',
                        borderRadius: '10px',
                        border: '2px solid rgba(255,255,255,0.1)',
                        backgroundImage: `url(app-bg:///${filename})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        cursor: 'pointer',
                      }}
                    />
                  ))}
                </div>
              ) : (
                <p style={{ color: '#a0aec0', fontSize: '13px', textAlign: 'center' }}>
                  No backgrounds available. Add them in Settings.
                </p>
              )}
            </div>
          </div>
        </div>
      )}

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
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="3">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <span style={{ color: '#ffffff', fontWeight: 500, fontSize: '13px' }}>{toast}</span>
          </div>
        </div>
      )}

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </div>
  )
}
