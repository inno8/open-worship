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
      <div className="flex-1 flex items-center justify-center h-full">
        <div className="text-center">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#a0aec0" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="mx-auto mb-4 opacity-40">
            <path d="M9 18V5l12-2v13" />
            <circle cx="6" cy="18" r="3" />
            <circle cx="18" cy="16" r="3" />
          </svg>
          <h2 className="text-xl font-bold text-white mb-2">No Songs Yet</h2>
          <p className="text-[#a0aec0] mb-6">Add your first worship song</p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={openAddModal}
              className="px-5 py-2.5 rounded-lg bg-[#e94560] hover:bg-[#ff6b6b] text-white font-medium transition-colors"
            >
              + Add Song
            </button>
            <button className="px-5 py-2.5 rounded-lg border border-white/20 hover:border-white/40 text-white font-medium transition-colors">
              Import
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
      <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={() => setShowAddModal(false)}>
        <div className="bg-[#1a1a2e] rounded-xl border border-white/10 w-[600px] max-h-[85vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
            <h3 className="text-lg font-bold text-white">Add New Song</h3>
            <button onClick={() => setShowAddModal(false)} className="text-[#a0aec0] hover:text-white transition-colors p-1">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#a0aec0] mb-1.5">Title</label>
              <input
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="Song title"
                className="w-full px-3 py-2.5 rounded-lg bg-[#16213e] text-white placeholder-[#a0aec0]/50 border border-white/10 focus:border-[#e94560] focus:outline-none"
                autoFocus
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#a0aec0] mb-1.5">Author</label>
              <input
                type="text"
                value={newAuthor}
                onChange={(e) => setNewAuthor(e.target.value)}
                placeholder="Song author"
                className="w-full px-3 py-2.5 rounded-lg bg-[#16213e] text-white placeholder-[#a0aec0]/50 border border-white/10 focus:border-[#e94560] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#a0aec0] mb-1.5">Lyrics</label>
              <textarea
                value={newLyrics}
                onChange={(e) => setNewLyrics(e.target.value)}
                placeholder="[Verse 1]&#10;Enter lyrics here..."
                rows={10}
                className="w-full px-3 py-2.5 rounded-lg bg-[#16213e] text-white placeholder-[#a0aec0]/50 border border-white/10 focus:border-[#e94560] focus:outline-none resize-none font-mono text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#a0aec0] mb-1.5">Tags</label>
              <input
                type="text"
                value={newTags}
                onChange={(e) => setNewTags(e.target.value)}
                placeholder="hymn, worship, classic (comma-separated)"
                className="w-full px-3 py-2.5 rounded-lg bg-[#16213e] text-white placeholder-[#a0aec0]/50 border border-white/10 focus:border-[#e94560] focus:outline-none"
              />
            </div>

            <div className="flex gap-2">
              <button className="px-4 py-2 rounded-lg border border-white/10 hover:border-white/30 text-[#a0aec0] hover:text-white text-sm transition-colors">
                Import from File
              </button>
              <button className="px-4 py-2 rounded-lg border border-white/10 hover:border-white/30 text-[#a0aec0] hover:text-white text-sm transition-colors">
                Import from Google Drive
              </button>
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-3 px-6 py-4 border-t border-white/10">
            <button
              onClick={() => setShowAddModal(false)}
              className="px-5 py-2.5 rounded-lg border border-white/20 hover:border-white/40 text-white font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveNew}
              className="px-5 py-2.5 rounded-lg bg-[#e94560] hover:bg-[#ff6b6b] text-white font-medium transition-colors"
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
      <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={() => setShowDeleteDialog(false)}>
        <div className="bg-[#1a1a2e] rounded-xl border border-white/10 w-[400px]" onClick={(e) => e.stopPropagation()}>
          <div className="p-6 text-center">
            {/* Warning icon */}
            <div className="w-12 h-12 rounded-full bg-[#ef4444]/20 flex items-center justify-center mx-auto mb-4">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                <line x1="12" y1="9" x2="12" y2="13" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Delete Song?</h3>
            <p className="text-[#a0aec0] text-sm">
              Are you sure you want to delete <span className="text-white font-medium">"{selectedSong?.title}"</span>? This action cannot be undone.
            </p>
          </div>
          <div className="flex gap-3 px-6 pb-6">
            <button
              onClick={() => setShowDeleteDialog(false)}
              className="flex-1 py-2.5 rounded-lg border border-white/20 hover:border-white/40 text-white font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleDelete}
              className="flex-1 py-2.5 rounded-lg bg-[#ef4444] hover:bg-[#ef4444]/80 text-white font-medium transition-colors"
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-full">
      {/* Song list */}
      <div
        className="flex flex-col border-r border-white/10"
        style={{ width: 320, minWidth: 320 }}
      >
        <div className="p-3">
          <div className="relative">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#a0aec0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="absolute left-3 top-1/2 -translate-y-1/2">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              placeholder="Search songs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2.5 rounded-lg bg-[#16213e] text-white placeholder-[#a0aec0]/50 border border-white/10 focus:border-[#e94560] focus:outline-none text-sm"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-3 pb-3 space-y-1.5">
          {filteredSongs.map((song) => (
            <button
              key={song.id}
              onClick={() => selectSong(song)}
              className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
                selectedSong?.id === song.id
                  ? 'bg-[#16213e] border-l-[3px] border-[#e94560]'
                  : 'bg-[#16213e]/50 hover:bg-[#16213e] border-l-[3px] border-transparent'
              }`}
            >
              <div className="font-medium text-white truncate text-sm">
                {song.title}
              </div>
              <div className="text-xs text-[#a0aec0] truncate mt-0.5">
                {song.author}
              </div>
              {song.tags.length > 0 && (
                <div className="flex gap-1 mt-1.5 flex-wrap">
                  {song.tags.map((tag) => (
                    <span
                      key={tag}
                      className="text-[10px] px-2 py-0.5 rounded-full bg-[#e94560]/15 text-[#e94560]"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </button>
          ))}
        </div>

        <div className="p-3 border-t border-white/10">
          <button
            onClick={openAddModal}
            className="w-full py-2.5 rounded-lg bg-[#e94560] hover:bg-[#ff6b6b] text-white font-medium transition-colors text-sm"
          >
            + Add Song
          </button>
        </div>
      </div>

      {/* Song detail */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {selectedSong ? (
          <>
            <div className="px-6 py-5 border-b border-white/10">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-white" style={{ fontSize: 24 }}>
                    {selectedSong.title}
                  </h2>
                  <p className="text-sm text-[#a0aec0] mt-1">
                    {selectedSong.author}
                  </p>
                  {selectedSong.tags.length > 0 && (
                    <div className="flex gap-1.5 mt-3 flex-wrap">
                      {selectedSong.tags.map((tag) => (
                        <span
                          key={tag}
                          className="text-xs px-3 py-1 rounded-full bg-[#0f3460] text-[#a0aec0]"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex gap-2 ml-4 shrink-0">
                  <button
                    onClick={() => startEdit(selectedSong)}
                    className="px-4 py-2 rounded-lg bg-[#0f3460] hover:bg-[#0f3460]/80 text-white text-sm font-medium transition-colors"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => setShowDeleteDialog(true)}
                    className="px-4 py-2 rounded-lg bg-[#ef4444]/15 hover:bg-[#ef4444]/25 text-[#ef4444] text-sm font-medium transition-colors"
                  >
                    Delete
                  </button>
                  <button
                    onClick={handleAddToSchedule}
                    className="px-4 py-2 rounded-lg bg-[#e94560] hover:bg-[#ff6b6b] text-white text-sm font-medium transition-colors"
                  >
                    Add to Schedule
                  </button>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-5">
              <div className="space-y-6">
                {sections.map((section, idx) => (
                  <div key={idx}>
                    <div className="text-xs font-bold uppercase tracking-widest text-[#e94560] mb-2 px-2 py-1 bg-[#e94560]/10 rounded inline-block">
                      {section.type}
                    </div>
                    {section.lines.map((line, lineIdx) => (
                      <p
                        key={lineIdx}
                        className="text-white/90 leading-relaxed text-[15px]"
                      >
                        {line}
                      </p>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#a0aec0" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="mx-auto mb-3 opacity-30">
                <path d="M9 18V5l12-2v13" />
                <circle cx="6" cy="18" r="3" />
                <circle cx="18" cy="16" r="3" />
              </svg>
              <p className="text-[#a0aec0]">Select a song to view details</p>
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
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-[slideUp_0.3s_ease-out]">
          <div className="flex items-center gap-2 px-5 py-3 rounded-lg bg-[#16213e] border border-white/10 shadow-xl">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
            <span className="text-white text-sm font-medium">{toast}</span>
          </div>
        </div>
      )}
    </div>
  )
}
