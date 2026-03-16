"use strict";
const electron = require("electron");
electron.contextBridge.exposeInMainWorld("electronAPI", {
  // Display management
  getDisplays: () => electron.ipcRenderer.invoke("get-displays"),
  // Presentation window
  openPresentation: (displayId) => electron.ipcRenderer.invoke("open-presentation", displayId),
  closePresentation: () => electron.ipcRenderer.invoke("close-presentation"),
  updatePresentation: (slideData) => electron.ipcRenderer.invoke("update-presentation", slideData),
  isPresentationOpen: () => electron.ipcRenderer.invoke("is-presentation-open"),
  // Listen for slide updates (in presentation window)
  onSlideUpdate: (callback) => {
    electron.ipcRenderer.on("slide-update", (_event, data) => callback(data));
  },
  // Remove listener
  removeSlideUpdateListener: () => {
    electron.ipcRenderer.removeAllListeners("slide-update");
  },
  // ============ SONGS ============
  songs: {
    getAll: () => electron.ipcRenderer.invoke("songs:getAll"),
    getById: (id) => electron.ipcRenderer.invoke("songs:getById", id),
    create: (song) => electron.ipcRenderer.invoke("songs:create", song),
    update: (id, updates) => electron.ipcRenderer.invoke("songs:update", id, updates),
    delete: (id) => electron.ipcRenderer.invoke("songs:delete", id)
  },
  // ============ SCHEDULES ============
  schedules: {
    getAll: () => electron.ipcRenderer.invoke("schedules:getAll"),
    getById: (id) => electron.ipcRenderer.invoke("schedules:getById", id),
    create: (schedule) => electron.ipcRenderer.invoke("schedules:create", schedule),
    update: (id, updates) => electron.ipcRenderer.invoke("schedules:update", id, updates),
    delete: (id) => electron.ipcRenderer.invoke("schedules:delete", id)
  },
  // ============ SCHEDULE ITEMS ============
  scheduleItems: {
    add: (item) => electron.ipcRenderer.invoke("scheduleItems:add", item),
    update: (id, updates) => electron.ipcRenderer.invoke("scheduleItems:update", id, updates),
    delete: (id) => electron.ipcRenderer.invoke("scheduleItems:delete", id),
    reorder: (scheduleId, itemIds) => electron.ipcRenderer.invoke("scheduleItems:reorder", scheduleId, itemIds)
  },
  // ============ BACKGROUNDS ============
  backgrounds: {
    list: () => electron.ipcRenderer.invoke("backgrounds:list"),
    import: () => electron.ipcRenderer.invoke("backgrounds:import"),
    remove: (filename) => electron.ipcRenderer.invoke("backgrounds:remove", filename)
  },
  // ============ NDI ============
  ndi: {
    getStatus: () => electron.ipcRenderer.invoke("ndi:getStatus"),
    start: (sourceName) => electron.ipcRenderer.invoke("ndi:start", sourceName),
    stop: () => electron.ipcRenderer.invoke("ndi:stop"),
    sendFrame: (frameData) => electron.ipcRenderer.invoke("ndi:sendFrame", frameData),
    setSourceName: (name) => electron.ipcRenderer.invoke("ndi:setSourceName", name)
  }
});
