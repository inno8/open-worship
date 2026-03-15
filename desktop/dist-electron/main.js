"use strict";
const electron = require("electron");
const path = require("path");
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
    width: display.bounds.width,
    height: display.bounds.height,
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
electron.app.whenReady().then(createMainWindow);
electron.app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    electron.app.quit();
  }
});
electron.app.on("activate", () => {
  if (mainWindow === null) {
    createMainWindow();
  }
});
