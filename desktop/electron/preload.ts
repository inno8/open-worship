import { contextBridge, ipcRenderer } from 'electron'

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // Display management
  getDisplays: () => ipcRenderer.invoke('get-displays'),
  
  // Presentation window
  openPresentation: (displayId?: number) => ipcRenderer.invoke('open-presentation', displayId),
  closePresentation: () => ipcRenderer.invoke('close-presentation'),
  updatePresentation: (slideData: any) => ipcRenderer.invoke('update-presentation', slideData),
  isPresentationOpen: () => ipcRenderer.invoke('is-presentation-open'),
  
  // Listen for slide updates (in presentation window)
  onSlideUpdate: (callback: (data: any) => void) => {
    ipcRenderer.on('slide-update', (_event, data) => callback(data))
  },
  
  // Remove listener
  removeSlideUpdateListener: () => {
    ipcRenderer.removeAllListeners('slide-update')
  },
})

// Type definitions for the exposed API
declare global {
  interface Window {
    electronAPI: {
      getDisplays: () => Promise<Array<{
        id: number
        label: string
        width: number
        height: number
        isPrimary: boolean
      }>>
      openPresentation: (displayId?: number) => Promise<{ success: boolean; alreadyOpen?: boolean }>
      closePresentation: () => Promise<{ success: boolean; reason?: string }>
      updatePresentation: (slideData: any) => Promise<{ success: boolean; reason?: string }>
      isPresentationOpen: () => Promise<boolean>
      onSlideUpdate: (callback: (data: any) => void) => void
      removeSlideUpdateListener: () => void
    }
  }
}
