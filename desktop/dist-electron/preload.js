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
  }
});
