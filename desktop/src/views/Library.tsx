import { useState, useCallback } from 'react'
import { useSongStore, parseLyrics, Song } from '../stores/songStore'
import { useScheduleStore } from '../stores/scheduleStore'

export default function Library() {
  const {
    songs,
    selectedSong,
    searchQuery,
    addSong,
    deleteSong,
    selectSong,
    setSearchQuery,
  } = useSongStore()

  const { activeSchedule, addItem } = useScheduleStore()

  const [showAddModal, setShowAddModal] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [editingSongId, setEditingSongId] = useState<string | null>(null)

  // Add modal fields
  const [newTitle, setNewTitle] = useState('')
  const [newAuthor, setNewAuthor] = useState('')
  const [newLyrics, setNewLyrics] = useState('')
  const [newTags, setNewTags] = useState('')

  const showToast = useCallback((message: string) => {
    setToast(message)
    setTimeout(() => setToast(null), 3000)
  }, [])

  const filteredSongs = songs.filter((song) => {
    const q = searchQuery.toLowerCase()
    return (
      song.title.toLowerCase().includes(q) ||
      song.author.toLowerCase().includes(q) ||
      song.tags.some((t) => t.toLowerCase().includes(q))
    )
  })

  const sections = selectedSong ? parseLyrics(selectedSong.lyrics) : []

  function openAddModal() {
    setIsEditing(false)
    setEditingSongId(null)
    setNewTitle('')
    setNewAuthor('')
    setNewLyrics('')
    setNewTags('')
    setShowAddModal(true)
  }

  async function handleSaveNew() {
    if (!newTitle.trim()) return
    const now = new Date().toISOString()
    
    if (isEditing && editingSongId) {
      // Update existing song
      const { updateSong } = useSongStore.getState()
      await updateSong(editingSongId, {
        title: newTitle.trim(),
        author: newAuthor.trim(),
        lyrics: newLyrics || '[Verse 1]\nEnter lyrics here',
        tags: newTags.split(',').map((t) => t.trim()).filter(Boolean),
        updatedAt: now,
      })
      showToast('Song updated successfully')
    } else {
      // Create new song
      const newSong: Song = {
        id: crypto.randomUUID(),
        title: newTitle.trim(),
        author: newAuthor.trim(),
        lyrics: newLyrics || '[Verse 1]\nEnter lyrics here',
        tags: newTags.split(',').map((t) => t.trim()).filter(Boolean),
        createdAt: now,
        updatedAt: now,
      }
      await addSong(newSong)
      selectSong(newSong)
      showToast('Song added successfully')
    }
    
    setShowAddModal(false)
    setIsEditing(false)
    setEditingSongId(null)
  }

  async function handleDelete() {
    if (!selectedSong) return
    await deleteSong(selectedSong.id)
    setShowDeleteDialog(false)
    showToast('Song deleted successfully')
  }

  async function handleAddToSchedule() {
    if (!selectedSong || !activeSchedule) return
    await addItem(activeSchedule.id, {
      id: crypto.randomUUID(),
      order: activeSchedule.items.length,
      type: 'song',
      song: selectedSong,
    })
    showToast('Added to schedule')
  }

  function startEdit(song: Song) {
    setIsEditing(true)
    setEditingSongId(song.id)
    setNewTitle(song.title)
    setNewAuthor(song.author)
    setNewLyrics(song.lyrics)
    setNewTags(song.tags.join(', '))
    setShowAddModal(true)
  }

  // Empty state
  if (songs.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center h-full" style={{ backgroundColor: '#1a1a2e' }}>
        <div className="text-center">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full flex items-center justify-center" style={{ backgroundColor: '#e94560', opacity: 0.15 }}>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#e94560" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 18V5l12-2v13" />
              <circle cx="6" cy="18" r="3" />
              <circle cx="18" cy="16" r="3" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">No Songs Yet</h2>
          <p className="text-[#a0aec0] mb-8">Add your first worship song to get started</p>
          <div className="flex gap-4 justify-center">
            <button
              onClick={openAddModal}
              className="px-6 py-3 rounded-lg text-white font-semibold transition-all hover:opacity-90"
              style={{ backgroundColor: '#e94560' }}
            >
              + Add Song
            </button>
            <button 
              className="px-6 py-3 rounded-lg border text-white font-semibold transition-all hover:bg-white/5"
              style={{ borderColor: 'rgba(255,255,255,0.2)' }}
            >
              Import from File
            </button>
          </div>
        </div>

        {/* Add Modal */}
        {showAddModal && <AddSongModal />}
      </div>
    )
  }

  function AddSongModal() {
    const inputStyle: React.CSSProperties = {
      width: '100%',
      padding: '16px 20px',
      borderRadius: '14px',
      backgroundColor: '#1a1a2e',
      color: '#ffffff',
      border: '1px solid rgba(255,255,255,0.1)',
      fontSize: '15px',
      outline: 'none',
    }

    const labelStyle: React.CSSProperties = {
      display: 'block',
      fontSize: '14px',
      fontWeight: 600,
      color: '#a0aec0',
      marginBottom: '12px',
    }

    return (
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
        onClick={() => setShowAddModal(false)}
      >
        <div 
          style={{ 
            borderRadius: '20px',
            border: '1px solid rgba(255,255,255,0.1)',
            width: '640px',
            maxHeight: '85vh',
            display: 'flex',
            flexDirection: 'column',
            backgroundColor: '#16213e',
            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between', 
            padding: '28px 32px',
            borderBottom: '1px solid rgba(255,255,255,0.1)',
          }}>
            <h3 style={{ fontSize: '22px', fontWeight: 700, color: '#ffffff', margin: 0 }}>{isEditing ? 'Edit Song' : 'Add New Song'}</h3>
            <button 
              onClick={() => setShowAddModal(false)} 
              style={{ 
                background: 'none',
                border: 'none',
                color: '#a0aec0',
                cursor: 'pointer',
                padding: '10px',
                borderRadius: '10px',
              }}
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          {/* Body */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '32px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div>
              <label style={labelStyle}>Title</label>
              <input
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="Song title"
                style={inputStyle}
                onFocus={(e) => e.target.style.borderColor = '#e94560'}
                onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
                autoFocus
              />
            </div>
            <div>
              <label style={labelStyle}>Author</label>
              <input
                type="text"
                value={newAuthor}
                onChange={(e) => setNewAuthor(e.target.value)}
                placeholder="Author/Artist"
                style={inputStyle}
                onFocus={(e) => e.target.style.borderColor = '#e94560'}
                onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
              />
            </div>
            <div>
              <label style={labelStyle}>Lyrics</label>
              <textarea
                value={newLyrics}
                onChange={(e) => setNewLyrics(e.target.value)}
                placeholder="[Verse 1]&#10;Enter lyrics with section markers..."
                rows={10}
                style={{ 
                  ...inputStyle, 
                  fontFamily: 'monospace', 
                  fontSize: '14px',
                  resize: 'none',
                  lineHeight: 1.6,
                }}
                onFocus={(e) => e.target.style.borderColor = '#e94560'}
                onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
              />
            </div>
            <div>
              <label style={labelStyle}>Tags</label>
              <input
                type="text"
                value={newTags}
                onChange={(e) => setNewTags(e.target.value)}
                placeholder="worship, hymn, contemporary (comma-separated)"
                style={inputStyle}
                onFocus={(e) => e.target.style.borderColor = '#e94560'}
                onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
              />
            </div>

            <div style={{ display: 'flex', gap: '12px', paddingTop: '8px' }}>
              <button style={{ 
                padding: '14px 20px', 
                borderRadius: '12px', 
                border: '1px solid rgba(255,255,255,0.1)',
                backgroundColor: 'transparent',
                color: '#a0aec0',
                fontSize: '14px',
                fontWeight: 500,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
              }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                Import from File
              </button>
              <button style={{ 
                padding: '14px 20px', 
                borderRadius: '12px', 
                border: '1px solid rgba(255,255,255,0.1)',
                backgroundColor: 'transparent',
                color: '#a0aec0',
                fontSize: '14px',
                fontWeight: 500,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
              }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/></svg>
                Import from Google Drive
              </button>
            </div>
          </div>

          {/* Footer */}
          <div style={{ 
            display: 'flex', 
            justifyContent: 'flex-end', 
            gap: '12px', 
            padding: '24px 32px',
            borderTop: '1px solid rgba(255,255,255,0.1)',
          }}>
            <button
              onClick={() => setShowAddModal(false)}
              style={{
                padding: '16px 28px',
                borderRadius: '12px',
                border: '1px solid rgba(255,255,255,0.2)',
                backgroundColor: 'transparent',
                color: '#ffffff',
                fontSize: '15px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleSaveNew}
              style={{
                padding: '16px 28px',
                borderRadius: '12px',
                border: 'none',
                backgroundColor: '#e94560',
                color: '#ffffff',
                fontSize: '15px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              {isEditing ? 'Update Song' : 'Save Song'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  function DeleteDialog() {
    return (
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
        onClick={() => setShowDeleteDialog(false)}
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
          <div style={{ padding: '40px 36px 32px', textAlign: 'center' }}>
            {/* Warning icon */}
            <div style={{ 
              width: '72px', 
              height: '72px', 
              borderRadius: '50%', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              margin: '0 auto 24px',
              backgroundColor: 'rgba(239,68,68,0.15)',
            }}>
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                <line x1="12" y1="9" x2="12" y2="13" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
            </div>
            <h3 style={{ fontSize: '22px', fontWeight: 700, color: '#ffffff', margin: '0 0 16px' }}>Delete Song?</h3>
            <p style={{ fontSize: '15px', color: '#a0aec0', lineHeight: 1.6, margin: 0 }}>
              Are you sure you want to delete <span style={{ color: '#ffffff', fontWeight: 600 }}>"{selectedSong?.title}"</span>? This action cannot be undone.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '12px', padding: '0 32px 32px' }}>
            <button
              onClick={() => setShowDeleteDialog(false)}
              style={{
                flex: 1,
                padding: '16px',
                borderRadius: '12px',
                border: '1px solid rgba(255,255,255,0.2)',
                backgroundColor: 'transparent',
                color: '#ffffff',
                fontSize: '15px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleDelete}
              style={{
                flex: 1,
                padding: '16px',
                borderRadius: '12px',
                border: 'none',
                backgroundColor: '#ef4444',
                color: '#ffffff',
                fontSize: '15px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-full" style={{ backgroundColor: '#1a1a2e' }}>
      {/* Song list */}
      <div
        style={{ 
          width: 360, 
          minWidth: 360, 
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: '#16213e', 
          borderRight: '1px solid rgba(255,255,255,0.08)' 
        }}
      >
        <div style={{ padding: '24px' }}>
          <div style={{ position: 'relative' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#a0aec0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ position: 'absolute', left: '18px', top: '50%', transform: 'translateY(-50%)' }}>
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              placeholder="Search songs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '16px 18px 16px 52px',
                borderRadius: '14px',
                backgroundColor: '#1a1a2e',
                color: '#ffffff',
                border: '1px solid rgba(255,255,255,0.1)',
                fontSize: '14px',
                outline: 'none',
              }}
              onFocus={(e) => e.target.style.borderColor = '#e94560'}
              onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
            />
          </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '0 20px 20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {filteredSongs.map((song) => (
            <button
              key={song.id}
              onClick={() => selectSong(song)}
              style={{
                width: '100%',
                textAlign: 'left',
                padding: '20px',
                borderRadius: '14px',
                border: 'none',
                borderLeft: selectedSong?.id === song.id ? '4px solid #e94560' : '4px solid transparent',
                backgroundColor: selectedSong?.id === song.id ? '#1a1a2e' : 'transparent',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                if (selectedSong?.id !== song.id) {
                  e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.03)'
                }
              }}
              onMouseLeave={(e) => {
                if (selectedSong?.id !== song.id) {
                  e.currentTarget.style.backgroundColor = 'transparent'
                }
              }}
            >
              <div style={{ fontWeight: 600, color: '#ffffff', fontSize: '15px', marginBottom: '6px' }}>
                {song.title}
              </div>
              <div style={{ fontSize: '14px', color: '#a0aec0', marginBottom: '12px' }}>
                {song.author}
              </div>
              {song.tags.length > 0 && (
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {song.tags.map((tag) => (
                    <span
                      key={tag}
                      style={{ 
                        fontSize: '11px', 
                        padding: '6px 12px', 
                        borderRadius: '20px', 
                        fontWeight: 500,
                        backgroundColor: 'rgba(233,69,96,0.15)', 
                        color: '#e94560' 
                      }}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </button>
          ))}
        </div>

        <div style={{ padding: '20px 24px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
          <button
            onClick={openAddModal}
            style={{
              width: '100%',
              padding: '16px',
              borderRadius: '14px',
              backgroundColor: '#e94560',
              color: '#ffffff',
              fontWeight: 600,
              fontSize: '14px',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            + Add Song
          </button>
        </div>
      </div>

      {/* Song detail */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {selectedSong ? (
          <>
            <div style={{ padding: '32px 40px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                <div>
                  <h2 style={{ fontSize: '32px', fontWeight: 700, color: '#ffffff', margin: '0 0 8px' }}>
                    {selectedSong.title}
                  </h2>
                  <p style={{ fontSize: '18px', color: '#a0aec0', margin: 0 }}>
                    {selectedSong.author}
                  </p>
                  {selectedSong.tags.length > 0 && (
                    <div style={{ display: 'flex', gap: '10px', marginTop: '20px', flexWrap: 'wrap' }}>
                      {selectedSong.tags.map((tag) => (
                        <span
                          key={tag}
                          style={{ 
                            fontSize: '13px', 
                            padding: '8px 18px', 
                            borderRadius: '20px', 
                            fontWeight: 500,
                            backgroundColor: '#0f3460', 
                            color: '#a0aec0' 
                          }}
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <div style={{ display: 'flex', gap: '12px', marginLeft: '32px', flexShrink: 0 }}>
                  <button
                    onClick={() => startEdit(selectedSong)}
                    style={{
                      padding: '14px 24px',
                      borderRadius: '12px',
                      backgroundColor: '#0f3460',
                      color: '#ffffff',
                      fontSize: '14px',
                      fontWeight: 600,
                      border: 'none',
                      cursor: 'pointer',
                    }}
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => setShowDeleteDialog(true)}
                    style={{
                      padding: '14px 24px',
                      borderRadius: '12px',
                      backgroundColor: 'rgba(239,68,68,0.15)',
                      color: '#ef4444',
                      fontSize: '14px',
                      fontWeight: 600,
                      border: 'none',
                      cursor: 'pointer',
                    }}
                  >
                    Delete
                  </button>
                  <button
                    onClick={handleAddToSchedule}
                    style={{
                      padding: '14px 24px',
                      borderRadius: '12px',
                      backgroundColor: '#e94560',
                      color: '#ffffff',
                      fontSize: '14px',
                      fontWeight: 600,
                      border: 'none',
                      cursor: 'pointer',
                    }}
                  >
                    Add to Schedule
                  </button>
                </div>
              </div>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '32px 40px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '36px' }}>
                {sections.map((section, idx) => (
                  <div key={idx}>
                    <div 
                      style={{ 
                        fontSize: '11px', 
                        fontWeight: 700, 
                        textTransform: 'uppercase', 
                        letterSpacing: '0.1em',
                        marginBottom: '16px', 
                        padding: '8px 16px', 
                        borderRadius: '8px', 
                        display: 'inline-block',
                        backgroundColor: 'rgba(233,69,96,0.1)', 
                        color: '#e94560' 
                      }}
                    >
                      {section.type}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {section.lines.map((line, lineIdx) => (
                        <p
                          key={lineIdx}
                          style={{ 
                            color: 'rgba(255,255,255,0.9)', 
                            fontSize: '18px', 
                            lineHeight: 1.7,
                            margin: 0,
                          }}
                        >
                          {line}
                        </p>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        ) : (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ 
                width: '80px', 
                height: '80px', 
                margin: '0 auto 20px', 
                borderRadius: '20px', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                backgroundColor: 'rgba(160,174,192,0.1)' 
              }}>
                <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#a0aec0" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.5 }}>
                  <path d="M9 18V5l12-2v13" />
                  <circle cx="6" cy="18" r="3" />
                  <circle cx="18" cy="16" r="3" />
                </svg>
              </div>
              <p style={{ color: '#a0aec0', fontSize: '18px', margin: 0 }}>Select a song to view details</p>
            </div>
          </div>
        )}
      </div>

      {/* Add Song Modal */}
      {showAddModal && <AddSongModal />}

      {/* Delete Dialog */}
      {showDeleteDialog && <DeleteDialog />}

      {/* Success Toast */}
      {toast && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 animate-[slideUp_0.3s_ease-out]">
          <div 
            className="flex items-center gap-3 px-6 py-4 rounded-xl border shadow-2xl"
            style={{ backgroundColor: '#16213e', borderColor: 'rgba(255,255,255,0.1)' }}
          >
            <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ backgroundColor: 'rgba(34,197,94,0.2)' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <span className="text-white font-medium">{toast}</span>
          </div>
        </div>
      )}
    </div>
  )
}
