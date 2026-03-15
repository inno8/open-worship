export {}

declare global {
  interface Window {
    electronAPI?: {
      getDisplays: () => Promise<Array<{
        id: number
        label: string
        size: { width: number; height: number }
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
