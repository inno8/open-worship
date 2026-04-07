import Database from 'better-sqlite3'
import { app } from 'electron'
import path from 'path'
import fs from 'fs'

let db: Database.Database | null = null

export interface Song {
  id: string
  title: string
  author: string
  lyrics: string
  tags: string // JSON array
  defaultBackground: string | null
  createdAt: string
  updatedAt: string
}

export interface Schedule {
  id: string
  name: string
  date: string
  notes: string
  createdAt: string
  updatedAt: string
}

export interface Announcement {
  id: string
  type: 'image' | 'text' | 'video'  // image = lower-third images, video = full-screen videos, text = text announcements
  name: string
  content: string | null        // text content for text announcements
  filePath: string | null       // data URL for images/videos, or background image for text
  formatting: string            // JSON: { bold, italic, underline, fontSize, textAlign, textColor, displayMode }
  createdAt: string
  updatedAt: string
}

export interface ScheduleItem {
  id: string
  scheduleId: string
  order: number
  type: 'song' | 'blank' | 'custom'
  songId: string | null
  customTitle: string | null
  customText: string | null
}

export function initDatabase(): void {
  const userDataPath = app.getPath('userData')
  const dbPath = path.join(userDataPath, 'open-worship.db')
  
  // Ensure directory exists
  if (!fs.existsSync(userDataPath)) {
    fs.mkdirSync(userDataPath, { recursive: true })
  }

  db = new Database(dbPath)
  db.pragma('journal_mode = WAL')

  // Create tables
  db.exec(`
    CREATE TABLE IF NOT EXISTS songs (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      author TEXT DEFAULT '',
      lyrics TEXT DEFAULT '',
      tags TEXT DEFAULT '[]',
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS schedules (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      date TEXT NOT NULL,
      notes TEXT DEFAULT '',
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS schedule_items (
      id TEXT PRIMARY KEY,
      scheduleId TEXT NOT NULL,
      "order" INTEGER NOT NULL,
      type TEXT NOT NULL CHECK (type IN ('song', 'blank', 'custom')),
      songId TEXT,
      customTitle TEXT,
      customText TEXT,
      FOREIGN KEY (scheduleId) REFERENCES schedules(id) ON DELETE CASCADE,
      FOREIGN KEY (songId) REFERENCES songs(id) ON DELETE SET NULL
    );

    CREATE INDEX IF NOT EXISTS idx_schedule_items_schedule ON schedule_items(scheduleId);
    CREATE INDEX IF NOT EXISTS idx_songs_title ON songs(title);

    CREATE TABLE IF NOT EXISTS announcements (
      id TEXT PRIMARY KEY,
      type TEXT NOT NULL CHECK (type IN ('image', 'text', 'video')),
      name TEXT NOT NULL,
      content TEXT,
      filePath TEXT,
      formatting TEXT DEFAULT '{}',
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    );
  `)

  // Migration: add defaultBackground column to songs if missing
  const columns = db.prepare("PRAGMA table_info(songs)").all() as { name: string }[]
  if (!columns.some(c => c.name === 'defaultBackground')) {
    db.exec("ALTER TABLE songs ADD COLUMN defaultBackground TEXT DEFAULT NULL")
  }

  console.log('Database initialized at:', dbPath)
}

export function closeDatabase(): void {
  if (db) {
    db.close()
    db = null
  }
}

// ============ SONGS ============

export function getAllSongs(): Song[] {
  if (!db) return []
  return db.prepare('SELECT * FROM songs ORDER BY title').all() as Song[]
}

export function getSongById(id: string): Song | undefined {
  if (!db) return undefined
  return db.prepare('SELECT * FROM songs WHERE id = ?').get(id) as Song | undefined
}

export function createSong(song: Song): Song {
  if (!db) throw new Error('Database not initialized')
  
  const stmt = db.prepare(`
    INSERT INTO songs (id, title, author, lyrics, tags, defaultBackground, createdAt, updatedAt)
    VALUES (@id, @title, @author, @lyrics, @tags, @defaultBackground, @createdAt, @updatedAt)
  `)
  stmt.run(song)
  return song
}

export function updateSong(id: string, updates: Partial<Song>): Song | undefined {
  if (!db) return undefined
  
  const existing = getSongById(id)
  if (!existing) return undefined

  const updated = { ...existing, ...updates, updatedAt: new Date().toISOString() }
  
  const stmt = db.prepare(`
    UPDATE songs
    SET title = @title, author = @author, lyrics = @lyrics, tags = @tags, defaultBackground = @defaultBackground, updatedAt = @updatedAt
    WHERE id = @id
  `)
  stmt.run(updated)
  return updated
}

export function deleteSong(id: string): boolean {
  if (!db) return false
  const result = db.prepare('DELETE FROM songs WHERE id = ?').run(id)
  return result.changes > 0
}

// ============ SCHEDULES ============

export function getAllSchedules(): Schedule[] {
  if (!db) return []
  return db.prepare('SELECT * FROM schedules ORDER BY date DESC').all() as Schedule[]
}

export function getScheduleById(id: string): Schedule | undefined {
  if (!db) return undefined
  return db.prepare('SELECT * FROM schedules WHERE id = ?').get(id) as Schedule | undefined
}

export function createSchedule(schedule: Schedule): Schedule {
  if (!db) throw new Error('Database not initialized')
  
  const stmt = db.prepare(`
    INSERT INTO schedules (id, name, date, notes, createdAt, updatedAt)
    VALUES (@id, @name, @date, @notes, @createdAt, @updatedAt)
  `)
  stmt.run(schedule)
  return schedule
}

export function updateSchedule(id: string, updates: Partial<Schedule>): Schedule | undefined {
  if (!db) return undefined
  
  const existing = getScheduleById(id)
  if (!existing) return undefined

  const updated = { ...existing, ...updates, updatedAt: new Date().toISOString() }
  
  const stmt = db.prepare(`
    UPDATE schedules 
    SET name = @name, date = @date, notes = @notes, updatedAt = @updatedAt
    WHERE id = @id
  `)
  stmt.run(updated)
  return updated
}

export function deleteSchedule(id: string): boolean {
  if (!db) return false
  // Items are deleted via CASCADE
  const result = db.prepare('DELETE FROM schedules WHERE id = ?').run(id)
  return result.changes > 0
}

// ============ SCHEDULE ITEMS ============

export function getScheduleItems(scheduleId: string): ScheduleItem[] {
  if (!db) return []
  return db.prepare('SELECT * FROM schedule_items WHERE scheduleId = ? ORDER BY "order"').all(scheduleId) as ScheduleItem[]
}

export function addScheduleItem(item: ScheduleItem): ScheduleItem {
  if (!db) throw new Error('Database not initialized')
  
  const stmt = db.prepare(`
    INSERT INTO schedule_items (id, scheduleId, "order", type, songId, customTitle, customText)
    VALUES (@id, @scheduleId, @order, @type, @songId, @customTitle, @customText)
  `)
  stmt.run(item)
  return item
}

export function updateScheduleItem(id: string, updates: Partial<ScheduleItem>): ScheduleItem | undefined {
  if (!db) return undefined
  
  const existing = db.prepare('SELECT * FROM schedule_items WHERE id = ?').get(id) as ScheduleItem | undefined
  if (!existing) return undefined

  const updated = { ...existing, ...updates }
  
  const stmt = db.prepare(`
    UPDATE schedule_items 
    SET "order" = @order, type = @type, songId = @songId, customTitle = @customTitle, customText = @customText
    WHERE id = @id
  `)
  stmt.run(updated)
  return updated
}

export function deleteScheduleItem(id: string): boolean {
  if (!db) return false
  const result = db.prepare('DELETE FROM schedule_items WHERE id = ?').run(id)
  return result.changes > 0
}

export function reorderScheduleItems(scheduleId: string, itemIds: string[]): void {
  if (!db) return
  
  const updateStmt = db.prepare('UPDATE schedule_items SET "order" = ? WHERE id = ? AND scheduleId = ?')
  
  const transaction = db.transaction(() => {
    itemIds.forEach((id, index) => {
      updateStmt.run(index, id, scheduleId)
    })
  })
  
  transaction()
}

export function clearScheduleItems(scheduleId: string): void {
  if (!db) return
  db.prepare('DELETE FROM schedule_items WHERE scheduleId = ?').run(scheduleId)
}

// ============ ANNOUNCEMENTS ============

export function getAllAnnouncements(): Announcement[] {
  if (!db) return []
  return db.prepare('SELECT * FROM announcements ORDER BY updatedAt DESC').all() as Announcement[]
}

export function getAnnouncementsByType(type: string): Announcement[] {
  if (!db) return []
  return db.prepare('SELECT * FROM announcements WHERE type = ? ORDER BY updatedAt DESC').all(type) as Announcement[]
}

export function createAnnouncement(announcement: Announcement): Announcement {
  if (!db) throw new Error('Database not initialized')
  const stmt = db.prepare(`
    INSERT INTO announcements (id, type, name, content, filePath, formatting, createdAt, updatedAt)
    VALUES (@id, @type, @name, @content, @filePath, @formatting, @createdAt, @updatedAt)
  `)
  stmt.run(announcement)
  return announcement
}

export function updateAnnouncement(id: string, updates: Partial<Announcement>): Announcement | undefined {
  if (!db) return undefined
  const existing = db.prepare('SELECT * FROM announcements WHERE id = ?').get(id) as Announcement | undefined
  if (!existing) return undefined
  const updated = { ...existing, ...updates, updatedAt: new Date().toISOString() }
  db.prepare(`
    UPDATE announcements
    SET type = @type, name = @name, content = @content, filePath = @filePath, formatting = @formatting, updatedAt = @updatedAt
    WHERE id = @id
  `).run(updated)
  return updated
}

export function deleteAnnouncement(id: string): boolean {
  if (!db) return false
  return db.prepare('DELETE FROM announcements WHERE id = ?').run(id).changes > 0
}
