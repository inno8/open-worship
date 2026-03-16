"use strict";
var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
const electron = require("electron");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");
const url = require("url");
const Database = require("better-sqlite3");
let db = null;
function initDatabase() {
  const userDataPath = electron.app.getPath("userData");
  const dbPath = path.join(userDataPath, "open-worship.db");
  if (!fs.existsSync(userDataPath)) {
    fs.mkdirSync(userDataPath, { recursive: true });
  }
  db = new Database(dbPath);
  db.pragma("journal_mode = WAL");
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
  `);
  const columns = db.prepare("PRAGMA table_info(songs)").all();
  if (!columns.some((c) => c.name === "defaultBackground")) {
    db.exec("ALTER TABLE songs ADD COLUMN defaultBackground TEXT DEFAULT NULL");
  }
  console.log("Database initialized at:", dbPath);
}
function closeDatabase() {
  if (db) {
    db.close();
    db = null;
  }
}
function getAllSongs() {
  if (!db) return [];
  return db.prepare("SELECT * FROM songs ORDER BY title").all();
}
function getSongById(id) {
  if (!db) return void 0;
  return db.prepare("SELECT * FROM songs WHERE id = ?").get(id);
}
function createSong(song) {
  if (!db) throw new Error("Database not initialized");
  const stmt = db.prepare(`
    INSERT INTO songs (id, title, author, lyrics, tags, defaultBackground, createdAt, updatedAt)
    VALUES (@id, @title, @author, @lyrics, @tags, @defaultBackground, @createdAt, @updatedAt)
  `);
  stmt.run(song);
  return song;
}
function updateSong(id, updates) {
  if (!db) return void 0;
  const existing = getSongById(id);
  if (!existing) return void 0;
  const updated = { ...existing, ...updates, updatedAt: (/* @__PURE__ */ new Date()).toISOString() };
  const stmt = db.prepare(`
    UPDATE songs
    SET title = @title, author = @author, lyrics = @lyrics, tags = @tags, defaultBackground = @defaultBackground, updatedAt = @updatedAt
    WHERE id = @id
  `);
  stmt.run(updated);
  return updated;
}
function deleteSong(id) {
  if (!db) return false;
  const result = db.prepare("DELETE FROM songs WHERE id = ?").run(id);
  return result.changes > 0;
}
function getAllSchedules() {
  if (!db) return [];
  return db.prepare("SELECT * FROM schedules ORDER BY date DESC").all();
}
function getScheduleById(id) {
  if (!db) return void 0;
  return db.prepare("SELECT * FROM schedules WHERE id = ?").get(id);
}
function createSchedule(schedule) {
  if (!db) throw new Error("Database not initialized");
  const stmt = db.prepare(`
    INSERT INTO schedules (id, name, date, notes, createdAt, updatedAt)
    VALUES (@id, @name, @date, @notes, @createdAt, @updatedAt)
  `);
  stmt.run(schedule);
  return schedule;
}
function updateSchedule(id, updates) {
  if (!db) return void 0;
  const existing = getScheduleById(id);
  if (!existing) return void 0;
  const updated = { ...existing, ...updates, updatedAt: (/* @__PURE__ */ new Date()).toISOString() };
  const stmt = db.prepare(`
    UPDATE schedules 
    SET name = @name, date = @date, notes = @notes, updatedAt = @updatedAt
    WHERE id = @id
  `);
  stmt.run(updated);
  return updated;
}
function deleteSchedule(id) {
  if (!db) return false;
  const result = db.prepare("DELETE FROM schedules WHERE id = ?").run(id);
  return result.changes > 0;
}
function getScheduleItems(scheduleId) {
  if (!db) return [];
  return db.prepare('SELECT * FROM schedule_items WHERE scheduleId = ? ORDER BY "order"').all(scheduleId);
}
function addScheduleItem(item) {
  if (!db) throw new Error("Database not initialized");
  const stmt = db.prepare(`
    INSERT INTO schedule_items (id, scheduleId, "order", type, songId, customTitle, customText)
    VALUES (@id, @scheduleId, @order, @type, @songId, @customTitle, @customText)
  `);
  stmt.run(item);
  return item;
}
function updateScheduleItem(id, updates) {
  if (!db) return void 0;
  const existing = db.prepare("SELECT * FROM schedule_items WHERE id = ?").get(id);
  if (!existing) return void 0;
  const updated = { ...existing, ...updates };
  const stmt = db.prepare(`
    UPDATE schedule_items 
    SET "order" = @order, type = @type, songId = @songId, customTitle = @customTitle, customText = @customText
    WHERE id = @id
  `);
  stmt.run(updated);
  return updated;
}
function deleteScheduleItem(id) {
  if (!db) return false;
  const result = db.prepare("DELETE FROM schedule_items WHERE id = ?").run(id);
  return result.changes > 0;
}
function reorderScheduleItems(scheduleId, itemIds) {
  if (!db) return;
  const updateStmt = db.prepare('UPDATE schedule_items SET "order" = ? WHERE id = ? AND scheduleId = ?');
  const transaction = db.transaction(() => {
    itemIds.forEach((id, index) => {
      updateStmt.run(index, id, scheduleId);
    });
  });
  transaction();
}
let grandiose = null;
const ndiModuleNames = ["grandiose", "ndi"];
for (const name of ndiModuleNames) {
  try {
    grandiose = require(name);
    if (grandiose && typeof grandiose.send === "function") {
      console.log(`NDI native module loaded: ${name}`);
      break;
    }
    grandiose = null;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (name === "grandiose") {
      console.warn("Grandiose not available:", msg);
    }
    grandiose = null;
  }
}
if (!grandiose) {
  console.log("NDI: using mock mode (no native module). Install grandiose + NDI SDK for real output.");
}
class NdiOutput {
  constructor(sourceName = "Open Worship", width = 1920, height = 1080) {
    __publicField(this, "sender", null);
    __publicField(this, "sourceName");
    __publicField(this, "width");
    __publicField(this, "height");
    __publicField(this, "running", false);
    __publicField(this, "mockMode", false);
    __publicField(this, "frameCount", 0);
    __publicField(this, "lastFrameTime", 0);
    this.sourceName = sourceName;
    this.width = width;
    this.height = height;
  }
  get isAvailable() {
    return true;
  }
  get isNativeAvailable() {
    return grandiose !== null;
  }
  get isRunning() {
    return this.running;
  }
  async start() {
    if (this.running) return true;
    if (grandiose) {
      try {
        this.sender = grandiose.send({
          name: this.sourceName,
          clockVideo: false,
          clockAudio: false
        });
        this.running = true;
        this.mockMode = false;
        console.log(`NDI sender started (native): "${this.sourceName}"`);
        return true;
      } catch (err) {
        console.error("Failed to start native NDI sender:", err);
        console.log("Falling back to mock mode");
      }
    }
    this.running = true;
    this.mockMode = true;
    this.frameCount = 0;
    console.log(`NDI sender started (mock): "${this.sourceName}"`);
    return true;
  }
  stop() {
    if (this.sender) {
      try {
        const s = this.sender;
        if (typeof s.dispose === "function") s.dispose();
        else if (typeof s.destroy === "function") s.destroy();
      } catch (err) {
        console.warn("Error disposing NDI sender:", err);
      }
      this.sender = null;
    }
    if (this.running) {
      console.log(`NDI sender stopped (${this.mockMode ? "mock" : "native"}, ${this.frameCount} frames sent)`);
    }
    this.running = false;
    this.mockMode = false;
    this.frameCount = 0;
    this.lastFrameTime = 0;
  }
  sendFrame(frameData) {
    if (!this.running) return;
    this.frameCount++;
    const now = Date.now();
    if (this.mockMode) {
      if (now - this.lastFrameTime > 5e3) {
        console.log(
          `NDI mock: frame #${this.frameCount}, ${frameData.width}x${frameData.height}, ${(frameData.data.length / 1024).toFixed(0)}KB`
        );
        this.lastFrameTime = now;
      }
      return;
    }
    try {
      const sender = this.sender;
      sender.video({
        xres: frameData.width,
        yres: frameData.height,
        fourCC: grandiose.FOURCC_RGBA ?? "RGBA",
        frameRateN: 3e4,
        frameRateD: 1001,
        lineStrideBytes: frameData.width * 4,
        data: frameData.data
      });
    } catch (err) {
      console.error("Failed to send NDI frame:", err);
    }
  }
  setSourceName(name) {
    const wasRunning = this.running;
    if (wasRunning) this.stop();
    this.sourceName = name;
    if (wasRunning) this.start();
  }
  setResolution(width, height) {
    this.width = width;
    this.height = height;
  }
  getStatus() {
    return {
      available: this.isAvailable,
      nativeAvailable: this.isNativeAvailable,
      running: this.running,
      mockMode: this.mockMode,
      sourceName: this.sourceName,
      resolution: { width: this.width, height: this.height },
      frameCount: this.frameCount
    };
  }
}
let instance = null;
function getNdiOutput() {
  if (!instance) {
    instance = new NdiOutput();
  }
  return instance;
}
const backgroundsDir = path.join(electron.app.getPath("userData"), "backgrounds");
electron.protocol.registerSchemesAsPrivileged([{
  scheme: "app-bg",
  privileges: { standard: true, secure: true, supportFetchAPI: true, corsEnabled: true }
}]);
let mainWindow = null;
let presentationWindow = null;
const isDev = process.env.NODE_ENV === "development";
function createMainWindow() {
  mainWindow = new electron.BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1e3,
    minHeight: 700,
    title: "Open Worship",
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, "preload.js")
    }
  });
  if (isDev) {
    mainWindow.loadURL("http://localhost:5173");
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, "../dist/index.html"));
  }
  mainWindow.on("closed", () => {
    mainWindow = null;
    if (presentationWindow) {
      presentationWindow.close();
    }
  });
}
function createPresentationWindow(displayId) {
  const displays = electron.screen.getAllDisplays();
  let targetDisplay = displays.find((d) => d.id === displayId);
  if (!targetDisplay) {
    const primaryDisplay = electron.screen.getPrimaryDisplay();
    targetDisplay = displays.find((d) => d.id !== primaryDisplay.id) || primaryDisplay;
  }
  const { x, y, width, height } = targetDisplay.bounds;
  presentationWindow = new electron.BrowserWindow({
    x,
    y,
    width,
    height,
    frame: false,
    fullscreen: true,
    alwaysOnTop: true,
    skipTaskbar: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, "preload.js")
    }
  });
  if (isDev) {
    presentationWindow.loadURL("http://localhost:5173/#/presentation");
  } else {
    presentationWindow.loadFile(path.join(__dirname, "../dist/index.html"), {
      hash: "/presentation"
    });
  }
  presentationWindow.on("closed", () => {
    presentationWindow = null;
  });
  return presentationWindow;
}
electron.ipcMain.handle("get-displays", () => {
  const displays = electron.screen.getAllDisplays();
  const primary = electron.screen.getPrimaryDisplay();
  return displays.map((display) => ({
    id: display.id,
    label: display.label || `Display ${display.id}`,
    size: { width: display.bounds.width, height: display.bounds.height },
    isPrimary: display.id === primary.id
  }));
});
electron.ipcMain.handle("open-presentation", (_event, displayId) => {
  if (presentationWindow) {
    presentationWindow.focus();
    return { success: true, alreadyOpen: true };
  }
  createPresentationWindow(displayId);
  return { success: true, alreadyOpen: false };
});
electron.ipcMain.handle("close-presentation", () => {
  if (presentationWindow) {
    presentationWindow.close();
    return { success: true };
  }
  return { success: false, reason: "No presentation window open" };
});
electron.ipcMain.handle("update-presentation", (_event, slideData) => {
  if (presentationWindow) {
    presentationWindow.webContents.send("slide-update", slideData);
    return { success: true };
  }
  return { success: false, reason: "No presentation window open" };
});
electron.ipcMain.handle("is-presentation-open", () => {
  return presentationWindow !== null;
});
electron.ipcMain.handle("songs:getAll", () => {
  const songs = getAllSongs();
  return songs.map((song) => ({
    ...song,
    tags: JSON.parse(song.tags || "[]")
  }));
});
electron.ipcMain.handle("songs:getById", (_event, id) => {
  const song = getSongById(id);
  if (song) {
    return { ...song, tags: JSON.parse(song.tags || "[]") };
  }
  return null;
});
electron.ipcMain.handle("songs:create", (_event, song) => {
  const dbSong = { ...song, tags: JSON.stringify(song.tags) };
  const created = createSong(dbSong);
  return { ...created, tags: song.tags };
});
electron.ipcMain.handle("songs:update", (_event, id, updates) => {
  const dbUpdates = { ...updates };
  if (updates.tags) {
    dbUpdates.tags = JSON.stringify(updates.tags);
  }
  const updated = updateSong(id, dbUpdates);
  if (updated) {
    return { ...updated, tags: JSON.parse(updated.tags || "[]") };
  }
  return null;
});
electron.ipcMain.handle("songs:delete", (_event, id) => {
  return deleteSong(id);
});
electron.ipcMain.handle("schedules:getAll", () => {
  const schedules = getAllSchedules();
  return schedules.map((schedule) => ({
    ...schedule,
    items: getScheduleItems(schedule.id).map((item) => {
      if (item.songId) {
        const song = getSongById(item.songId);
        return {
          ...item,
          song: song ? { ...song, tags: JSON.parse(song.tags || "[]") } : null
        };
      }
      return item;
    })
  }));
});
electron.ipcMain.handle("schedules:getById", (_event, id) => {
  const schedule = getScheduleById(id);
  if (schedule) {
    const items = getScheduleItems(id).map((item) => {
      if (item.songId) {
        const song = getSongById(item.songId);
        return {
          ...item,
          song: song ? { ...song, tags: JSON.parse(song.tags || "[]") } : null
        };
      }
      return item;
    });
    return { ...schedule, items };
  }
  return null;
});
electron.ipcMain.handle("schedules:create", (_event, schedule) => {
  return createSchedule(schedule);
});
electron.ipcMain.handle("schedules:update", (_event, id, updates) => {
  return updateSchedule(id, updates);
});
electron.ipcMain.handle("schedules:delete", (_event, id) => {
  return deleteSchedule(id);
});
electron.ipcMain.handle("scheduleItems:add", (_event, item) => {
  return addScheduleItem(item);
});
electron.ipcMain.handle("scheduleItems:update", (_event, id, updates) => {
  return updateScheduleItem(id, updates);
});
electron.ipcMain.handle("scheduleItems:delete", (_event, id) => {
  return deleteScheduleItem(id);
});
electron.ipcMain.handle("scheduleItems:reorder", (_event, scheduleId, itemIds) => {
  reorderScheduleItems(scheduleId, itemIds);
  return true;
});
function ensureBackgroundsDir() {
  if (!fs.existsSync(backgroundsDir)) {
    fs.mkdirSync(backgroundsDir, { recursive: true });
  }
}
electron.ipcMain.handle("backgrounds:list", () => {
  ensureBackgroundsDir();
  return fs.readdirSync(backgroundsDir).filter((f) => /\.(jpg|jpeg|png|webp)$/i.test(f));
});
electron.ipcMain.handle("backgrounds:import", async () => {
  const result = await electron.dialog.showOpenDialog({
    properties: ["openFile", "multiSelections"],
    filters: [{ name: "Images", extensions: ["jpg", "jpeg", "png", "webp"] }]
  });
  if (result.canceled || result.filePaths.length === 0) return [];
  ensureBackgroundsDir();
  const imported = [];
  for (const filePath of result.filePaths) {
    const ext = path.extname(filePath);
    const filename = `${crypto.randomUUID()}${ext}`;
    fs.copyFileSync(filePath, path.join(backgroundsDir, filename));
    imported.push(filename);
  }
  return imported;
});
electron.ipcMain.handle("backgrounds:remove", (_event, filename) => {
  const safeName = path.basename(filename);
  const filePath = path.join(backgroundsDir, safeName);
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
  return true;
});
electron.ipcMain.handle("ndi:getStatus", () => {
  return getNdiOutput().getStatus();
});
electron.ipcMain.handle("ndi:start", async (_event, sourceName) => {
  const ndi = getNdiOutput();
  if (sourceName) ndi.setSourceName(sourceName);
  const success = await ndi.start();
  const status = ndi.getStatus();
  return { success, status };
});
electron.ipcMain.handle("ndi:stop", () => {
  getNdiOutput().stop();
  return { success: true };
});
electron.ipcMain.handle("ndi:sendFrame", (_event, frameData) => {
  const ndi = getNdiOutput();
  if (!ndi.isRunning) return { success: false, reason: "NDI not running" };
  ndi.sendFrame({
    data: Buffer.from(frameData.data.buffer, frameData.data.byteOffset, frameData.data.byteLength),
    width: frameData.width,
    height: frameData.height
  });
  return { success: true };
});
electron.ipcMain.handle("ndi:setSourceName", (_event, name) => {
  getNdiOutput().setSourceName(name);
  return { success: true };
});
electron.app.whenReady().then(() => {
  electron.protocol.handle("app-bg", (request) => {
    const url$1 = new URL(request.url);
    const filename = decodeURIComponent(url$1.pathname).replace(/^\/+/, "");
    const safeName = path.basename(filename);
    const filePath = path.join(backgroundsDir, safeName);
    return electron.net.fetch(url.pathToFileURL(filePath).toString());
  });
  initDatabase();
  ensureBackgroundsDir();
  createMainWindow();
});
electron.app.on("window-all-closed", () => {
  getNdiOutput().stop();
  closeDatabase();
  if (process.platform !== "darwin") {
    electron.app.quit();
  }
});
electron.app.on("activate", () => {
  if (mainWindow === null) {
    createMainWindow();
  }
});
