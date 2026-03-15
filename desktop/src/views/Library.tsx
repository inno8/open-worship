import { useEffect, useState, useCallback } from 'react'
import { useSongStore, parseLyrics, Song } from '../stores/songStore'
import { useScheduleStore } from '../stores/scheduleStore'

const MOCK_SONGS: Song[] = [
  {
    id: '1',
    title: 'Amazing Grace',
    author: 'John Newton',
    tags: ['hymn', 'classic'],
    lyrics:
      '[Verse 1]\nAmazing grace how sweet the sound\nThat saved a wretch like me\nI once was lost but now am found\nWas blind but now I see\n\n[Verse 2]\nTwas grace that taught my heart to fear\nAnd grace my fears relieved\nHow precious did that grace appear\nThe hour I first believed\n\n[Chorus]\nMy chains are gone I\'ve been set free\nMy God my Savior has ransomed me\nAnd like a flood His mercy reigns\nUnending love amazing grace',
    createdAt: '2024-01-01',
    updatedAt: '2024-01-01',
  },
  {
    id: '2',
    title: '10,000 Reasons',
    author: 'Matt Redman',
    tags: ['contemporary', 'worship'],
    lyrics:
      '[Chorus]\nBless the Lord O my soul\nO my soul worship His holy name\nSing like never before\nO my soul I\'ll worship Your holy name\n\n[Verse 1]\nThe sun comes up it\'s a new day dawning\nIt\'s time to sing Your song again\nWhatever may pass and whatever lies before me\nLet me be singing when the evening comes',
    createdAt: '2024-01-02',
    updatedAt: '2024-01-02',
  },
  {
    id: '3',
    title: 'How Great Is Our God',
    author: 'Chris Tomlin',
    tags: ['contemporary', 'praise'],
    lyrics:
      '[Verse 1]\nThe splendor of the King\nClothed in majesty\nLet all the earth rejoice\nAll the earth rejoice\n\n[Chorus]\nHow great is our God\nSing with me how great is our God\nAnd all will see how great\nHow great is our God\n\n[Bridge]\nName above all names\nWorthy of all praise\nMy heart will sing\nHow great is our God',
    createdAt: '2024-01-03',
    updatedAt: '2024-01-03',
  },
]

export default function Library() {
  const {
    songs,
    selectedSong,
    searchQuery,
    setSongs,
    addSong,
    deleteSong,
    selectSong,
    setSearchQuery,
  } = useSongStore()

  const { activeSchedule, addItem } = useScheduleStore()

  const [showAddModal, setShowAddModal] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

  // Add modal fields
  const [newTitle, setNewTitle] = useState('')
  const [newAuthor, setNewAuthor] = useState('')
  const [newLyrics, setNewLyrics] = useState('')
  const [newTags, setNewTags] = useState('')

  useEffect(() => {
    if (songs.length === 0) {
      setSongs(MOCK_SONGS)
    }
  }, [])

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
    setNewTitle('')
    setNewAuthor('')
    setNewLyrics('')
    setNewTags('')
    setShowAddModal(true)
  }

  function handleSaveNew() {
    if (!newTitle.trim()) return
    const now = new Date().toISOString()
    const newSong: Song = {
      id: crypto.randomUUID(),
      title: newTitle.trim(),
      author: newAuthor.trim(),
      lyrics: newLyrics || '[Verse 1]\nEnter lyrics here',
      tags: newTags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean),
      createdAt: now,
      updatedAt: now,
    }
    addSong(newSong)
    selectSong(newSong)
    setShowAddModal(false)
    showToast('Song added successfully')
  }

  function handleDelete() {
    if (!selectedSong) return
    deleteSong(selectedSong.id)
    setShowDeleteDialog(false)
    showToast('Song deleted successfully')
  }

  function handleAddToSchedule() {
    if (!selectedSong || !activeSchedule) return
    addItem(activeSchedule.id, {
      id: crypto.randomUUID(),
      order: activeSchedule.items.length,
      type: 'song',
      song: selectedSong,
    })
    showToast('Added to schedule')
  }

  function startEdit(song: Song) {
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
    return (
      <div className="fixed inset-0 flex items-center justify-center z-50" style={{ backgroundColor: 'rgba(0,0,0,0.7)' }} onClick={() => setShowAddModal(false)}>
        <div 
          className="rounded-2xl border w-[600px] max-h-[85vh] flex flex-col shadow-2xl"
          style={{ backgroundColor: '#16213e', borderColor: 'rgba(255,255,255,0.1)' }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-5 border-b" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
            <h3 className="text-xl font-bold text-white">Add New Song</h3>
            <button onClick={() => setShowAddModal(false)} className="text-[#a0aec0] hover:text-white transition-colors p-2 rounded-lg hover:bg-white/10">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
            <div>
              <label className="block text-sm font-semibold text-[#a0aec0] mb-2">Title</label>
              <input
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="Song title"
                className="w-full px-4 py-3 rounded-xl text-white placeholder-[#a0aec0]/50 border focus:outline-none transition-colors"
                style={{ backgroundColor: '#1a1a2e', borderColor: 'rgba(255,255,255,0.1)' }}
                onFocus={(e) => e.target.style.borderColor = '#e94560'}
                onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
                autoFocus
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-[#a0aec0] mb-2">Author</label>
              <input
                type="text"
                value={newAuthor}
                onChange={(e) => setNewAuthor(e.target.value)}
                placeholder="Author/Artist"
                className="w-full px-4 py-3 rounded-xl text-white placeholder-[#a0aec0]/50 border focus:outline-none transition-colors"
                style={{ backgroundColor: '#1a1a2e', borderColor: 'rgba(255,255,255,0.1)' }}
                onFocus={(e) => e.target.style.borderColor = '#e94560'}
                onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-[#a0aec0] mb-2">Lyrics</label>
              <textarea
                value={newLyrics}
                onChange={(e) => setNewLyrics(e.target.value)}
                placeholder="[Verse 1]&#10;Enter lyrics with section markers..."
                rows={10}
                className="w-full px-4 py-3 rounded-xl text-white placeholder-[#a0aec0]/50 border focus:outline-none resize-none font-mono text-sm transition-colors"
                style={{ backgroundColor: '#1a1a2e', borderColor: 'rgba(255,255,255,0.1)' }}
                onFocus={(e) => e.target.style.borderColor = '#e94560'}
                onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-[#a0aec0] mb-2">Tags</label>
              <input
                type="text"
                value={newTags}
                onChange={(e) => setNewTags(e.target.value)}
                placeholder="worship, hymn, contemporary (comma-separated)"
                className="w-full px-4 py-3 rounded-xl text-white placeholder-[#a0aec0]/50 border focus:outline-none transition-colors"
                style={{ backgroundColor: '#1a1a2e', borderColor: 'rgba(255,255,255,0.1)' }}
                onFocus={(e) => e.target.style.borderColor = '#e94560'}
                onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button className="px-4 py-2.5 rounded-xl border text-[#a0aec0] hover:text-white text-sm font-medium transition-all hover:bg-white/5 flex items-center gap-2" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                Import from File
              </button>
              <button className="px-4 py-2.5 rounded-xl border text-[#a0aec0] hover:text-white text-sm font-medium transition-all hover:bg-white/5 flex items-center gap-2" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/></svg>
                Import from Google Drive
              </button>
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-3 px-6 py-5 border-t" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
            <button
              onClick={() => setShowAddModal(false)}
              className="px-6 py-3 rounded-xl border text-white font-semibold transition-all hover:bg-white/5"
              style={{ borderColor: 'rgba(255,255,255,0.2)' }}
            >
              Cancel
            </button>
            <button
              onClick={handleSaveNew}
              className="px-6 py-3 rounded-xl text-white font-semibold transition-all hover:opacity-90"
              style={{ backgroundColor: '#e94560' }}
            >
              Save Song
            </button>
          </div>
        </div>
      </div>
    )
  }

  function DeleteDialog() {
    return (
      <div className="fixed inset-0 flex items-center justify-center z-50" style={{ backgroundColor: 'rgba(0,0,0,0.7)' }} onClick={() => setShowDeleteDialog(false)}>
        <div 
          className="rounded-2xl border w-[420px] shadow-2xl"
          style={{ backgroundColor: '#16213e', borderColor: 'rgba(255,255,255,0.1)' }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="p-8 text-center">
            {/* Warning icon */}
            <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5" style={{ backgroundColor: 'rgba(239,68,68,0.15)' }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                <line x1="12" y1="9" x2="12" y2="13" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-white mb-3">Delete Song?</h3>
            <p className="text-[#a0aec0]">
              Are you sure you want to delete <span className="text-white font-semibold">"{selectedSong?.title}"</span>? This action cannot be undone.
            </p>
          </div>
          <div className="flex gap-3 px-6 pb-6">
            <button
              onClick={() => setShowDeleteDialog(false)}
              className="flex-1 py-3 rounded-xl border text-white font-semibold transition-all hover:bg-white/5"
              style={{ borderColor: 'rgba(255,255,255,0.2)' }}
            >
              Cancel
            </button>
            <button
              onClick={handleDelete}
              className="flex-1 py-3 rounded-xl text-white font-semibold transition-all hover:opacity-90"
              style={{ backgroundColor: '#ef4444' }}
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
        className="flex flex-col border-r"
        style={{ width: 340, minWidth: 340, backgroundColor: '#16213e', borderColor: 'rgba(255,255,255,0.08)' }}
      >
        <div className="p-4">
          <div className="relative">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#a0aec0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="absolute left-4 top-1/2 -translate-y-1/2">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              placeholder="Search songs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 rounded-xl text-white placeholder-[#a0aec0]/50 border focus:outline-none transition-colors"
              style={{ backgroundColor: '#1a1a2e', borderColor: 'rgba(255,255,255,0.1)' }}
              onFocus={(e) => e.target.style.borderColor = '#e94560'}
              onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-3 pb-3 space-y-2">
          {filteredSongs.map((song) => (
            <button
              key={song.id}
              onClick={() => selectSong(song)}
              className="w-full text-left p-4 rounded-xl transition-all border"
              style={{
                backgroundColor: selectedSong?.id === song.id ? '#1a1a2e' : 'transparent',
                borderColor: selectedSong?.id === song.id ? '#e94560' : 'transparent',
                borderLeftWidth: selectedSong?.id === song.id ? '3px' : '1px',
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
              <div className="font-semibold text-white text-[15px] mb-1">
                {song.title}
              </div>
              <div className="text-sm text-[#a0aec0] mb-2">
                {song.author}
              </div>
              {song.tags.length > 0 && (
                <div className="flex gap-1.5 flex-wrap">
                  {song.tags.map((tag) => (
                    <span
                      key={tag}
                      className="text-[11px] px-2.5 py-1 rounded-full font-medium"
                      style={{ backgroundColor: 'rgba(233,69,96,0.15)', color: '#e94560' }}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </button>
          ))}
        </div>

        <div className="p-4 border-t" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
          <button
            onClick={openAddModal}
            className="w-full py-3 rounded-xl text-white font-semibold transition-all hover:opacity-90"
            style={{ backgroundColor: '#e94560' }}
          >
            + Add Song
          </button>
        </div>
      </div>

      {/* Song detail */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {selectedSong ? (
          <>
            <div className="px-8 py-6 border-b" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-3xl font-bold text-white mb-1">
                    {selectedSong.title}
                  </h2>
                  <p className="text-[#a0aec0] text-lg">
                    {selectedSong.author}
                  </p>
                  {selectedSong.tags.length > 0 && (
                    <div className="flex gap-2 mt-4 flex-wrap">
                      {selectedSong.tags.map((tag) => (
                        <span
                          key={tag}
                          className="text-sm px-4 py-1.5 rounded-full font-medium"
                          style={{ backgroundColor: '#0f3460', color: '#a0aec0' }}
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex gap-3 ml-6 shrink-0">
                  <button
                    onClick={() => startEdit(selectedSong)}
                    className="px-5 py-2.5 rounded-xl text-white text-sm font-semibold transition-all hover:opacity-80"
                    style={{ backgroundColor: '#0f3460' }}
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => setShowDeleteDialog(true)}
                    className="px-5 py-2.5 rounded-xl text-sm font-semibold transition-all hover:opacity-80"
                    style={{ backgroundColor: 'rgba(239,68,68,0.15)', color: '#ef4444' }}
                  >
                    Delete
                  </button>
                  <button
                    onClick={handleAddToSchedule}
                    className="px-5 py-2.5 rounded-xl text-white text-sm font-semibold transition-all hover:opacity-90"
                    style={{ backgroundColor: '#e94560' }}
                  >
                    Add to Schedule
                  </button>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-8 py-6">
              <div className="space-y-8">
                {sections.map((section, idx) => (
                  <div key={idx}>
                    <div 
                      className="text-xs font-bold uppercase tracking-widest mb-3 px-3 py-1.5 rounded-lg inline-block"
                      style={{ backgroundColor: 'rgba(233,69,96,0.1)', color: '#e94560' }}
                    >
                      {section.type}
                    </div>
                    <div className="space-y-1">
                      {section.lines.map((line, lineIdx) => (
                        <p
                          key={lineIdx}
                          className="text-white/90 text-lg leading-relaxed"
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
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center" style={{ backgroundColor: 'rgba(160,174,192,0.1)' }}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#a0aec0" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="opacity-50">
                  <path d="M9 18V5l12-2v13" />
                  <circle cx="6" cy="18" r="3" />
                  <circle cx="18" cy="16" r="3" />
                </svg>
              </div>
              <p className="text-[#a0aec0] text-lg">Select a song to view details</p>
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
