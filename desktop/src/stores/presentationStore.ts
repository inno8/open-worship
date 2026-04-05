import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { Section } from './songStore'

export type TextPosition = 'center' | 'lower-third'

export interface SlideData {
  text: string
  sectionType: string
  backgroundColor?: string
  backgroundImage?: string
  fontSize?: string
  fontFamily?: string
  fontWeight?: number
  textColor?: string
  textPosition?: TextPosition
  shadowBlur?: number
  shadowOffsetX?: number
  shadowOffsetY?: number
  shadowColor?: string
  lowerThirdOpacity?: number
}

// Convert a background value (color string or filename) to CSS properties
export function getBackgroundStyle(bg: string): { backgroundColor?: string; backgroundImage?: string } {
  if (!bg || bg.startsWith('#') || bg.startsWith('rgb')) {
    return { backgroundColor: bg || '#000000' }
  }
  // It's a filename — use the custom protocol
  return {
    backgroundColor: '#000000',
    backgroundImage: `url(app-bg:///${bg})`,
  }
}

interface PresentationState {
  isLive: boolean
  currentSlide: SlideData | null
  sections: Section[]
  currentSectionIndex: number
  currentLineIndex: number
  displayId: number | null
  isBlacked: boolean
  slideBeforeBlack: SlideData | null

  // Settings
  fontSize: string
  fontFamily: string
  fontWeight: number
  textColor: string
  defaultBackground: string
  backgrounds: string[]
  textPosition: TextPosition
  shadowBlur: number
  shadowOffsetX: number
  shadowOffsetY: number
  shadowColor: string
  lowerThirdOpacity: number

  // NDI
  ndiEnabled: boolean
  ndiSourceName: string
  ndiRunning: boolean
  ndiAvailable: boolean
  ndiMockMode: boolean

  // Actions
  setLive: (live: boolean) => void
  setSections: (sections: Section[]) => void
  setCurrentSlide: (slide: SlideData | null) => void
  goToSection: (index: number) => void
  goToLine: (sectionIndex: number, lineIndex: number) => void
  nextSlide: () => void
  prevSlide: () => void
  showBlank: () => void
  setDisplayId: (id: number | null) => void
  setFontSize: (size: string) => void
  setFontFamily: (family: string) => void
  setFontWeight: (weight: number) => void
  setTextColor: (color: string) => void
  setDefaultBackground: (bg: string) => void
  setTextPosition: (position: TextPosition) => void
  setShadowBlur: (blur: number) => void
  setShadowOffsetX: (offsetX: number) => void
  setShadowOffsetY: (offsetY: number) => void
  setShadowColor: (color: string) => void
  setLowerThirdOpacity: (opacity: number) => void
  loadBackgrounds: () => Promise<void>
  addBackgrounds: () => Promise<string[]>
  removeBackground: (filename: string) => Promise<void>
  setNdiEnabled: (enabled: boolean) => void
  setNdiSourceName: (name: string) => void
  refreshNdiStatus: () => Promise<void>
}

export const usePresentationStore = create<PresentationState>()(
  persist(
    (set, get) => ({
      isLive: false,
      currentSlide: null,
      sections: [],
      currentSectionIndex: 0,
      currentLineIndex: 0,
      displayId: null,
      isBlacked: false,
      slideBeforeBlack: null,
      fontSize: '4rem',
      fontFamily: 'inherit',
      fontWeight: 400,
      textColor: '#ffffff',
      defaultBackground: '#000000',
      backgrounds: [],
      textPosition: 'lower-third' as TextPosition,
      shadowBlur: 8,
      shadowOffsetX: 2,
      shadowOffsetY: 2,
      shadowColor: 'rgba(0,0,0,0.8)',
      lowerThirdOpacity: 1,
      ndiEnabled: true,
      ndiSourceName: 'Open Worship',
      ndiRunning: false,
      ndiAvailable: false,
      ndiMockMode: false,

  setLive: (isLive) => set({ isLive }),
  
  setSections: (sections) => set({ 
    sections, 
    currentSectionIndex: 0, 
    currentLineIndex: 0 
  }),
  
  setCurrentSlide: (currentSlide) => set({ currentSlide }),
  
  goToSection: (index) => {
    const { sections, fontSize, fontFamily, fontWeight, textColor, defaultBackground, textPosition, shadowBlur, shadowOffsetX, shadowOffsetY, shadowColor, lowerThirdOpacity } = get()
    if (index >= 0 && index < sections.length) {
      const section = sections[index]
      const text = section.lines[0] || ''
      const bgStyle = getBackgroundStyle(defaultBackground)

      set({
        currentSectionIndex: index,
        currentLineIndex: 0,
        isBlacked: false,
        slideBeforeBlack: null,
        currentSlide: {
          text,
          sectionType: section.type,
          fontSize,
          fontFamily,
          fontWeight,
          textColor,
          textPosition,
          shadowBlur,
          shadowOffsetX,
          shadowOffsetY,
          shadowColor,
          lowerThirdOpacity,
          ...bgStyle,
        },
      })

      updatePresentationWindow(get().currentSlide)
    }
  },

  goToLine: (sectionIndex, lineIndex) => {
    const { sections, fontSize, fontFamily, fontWeight, textColor, defaultBackground, textPosition, shadowBlur, shadowOffsetX, shadowOffsetY, shadowColor, lowerThirdOpacity } = get()
    if (sectionIndex >= 0 && sectionIndex < sections.length) {
      const section = sections[sectionIndex]
      if (lineIndex >= 0 && lineIndex < section.lines.length) {
        const bgStyle = getBackgroundStyle(defaultBackground)
        set({
          currentSectionIndex: sectionIndex,
          currentLineIndex: lineIndex,
          isBlacked: false,
          slideBeforeBlack: null,
          currentSlide: {
            text: section.lines[lineIndex],
            sectionType: section.type,
            fontSize,
            fontFamily,
            fontWeight,
            textColor,
            textPosition,
            shadowBlur,
            shadowOffsetX,
            shadowOffsetY,
            shadowColor,
            lowerThirdOpacity,
            ...bgStyle,
          },
        })

        updatePresentationWindow(get().currentSlide)
      }
    }
  },
  
  nextSlide: () => {
    const { sections, currentSectionIndex, currentLineIndex } = get()
    const currentSection = sections[currentSectionIndex]
    
    if (!currentSection) return
    
    // Try next line in current section
    if (currentLineIndex < currentSection.lines.length - 1) {
      get().goToLine(currentSectionIndex, currentLineIndex + 1)
    }
    // Try next section
    else if (currentSectionIndex < sections.length - 1) {
      get().goToSection(currentSectionIndex + 1)
    }
  },
  
  prevSlide: () => {
    const { sections, currentSectionIndex, currentLineIndex } = get()
    
    // Try previous line in current section
    if (currentLineIndex > 0) {
      get().goToLine(currentSectionIndex, currentLineIndex - 1)
    }
    // Try previous section
    else if (currentSectionIndex > 0) {
      const prevSection = sections[currentSectionIndex - 1]
      get().goToLine(currentSectionIndex - 1, prevSection.lines.length - 1)
    }
  },
  
  showBlank: () => {
    const { isBlacked, slideBeforeBlack, currentSlide } = get()
    if (isBlacked && slideBeforeBlack) {
      // Restore previous slide
      set({
        isBlacked: false,
        currentSlide: slideBeforeBlack,
        slideBeforeBlack: null,
      })
      updatePresentationWindow(get().currentSlide)
    } else {
      // Go black, save current slide
      set({
        isBlacked: true,
        slideBeforeBlack: currentSlide,
        currentSlide: {
          text: '',
          sectionType: 'blank',
          backgroundColor: '#000000',
        },
      })
      updatePresentationWindow(get().currentSlide)
    }
  },
  
      setDisplayId: (displayId) => set({ displayId }),
      setFontSize: (fontSize) => set({ fontSize }),
      setFontFamily: (fontFamily) => set({ fontFamily }),
      setFontWeight: (fontWeight) => set({ fontWeight }),
      setTextColor: (textColor) => set({ textColor }),
      setDefaultBackground: (defaultBackground) => set({ defaultBackground }),
      setTextPosition: (textPosition) => set({ textPosition }),
      setShadowBlur: (shadowBlur) => set({ shadowBlur }),
      setShadowOffsetX: (shadowOffsetX) => set({ shadowOffsetX }),
      setShadowOffsetY: (shadowOffsetY) => set({ shadowOffsetY }),
      setShadowColor: (shadowColor) => set({ shadowColor }),
      setLowerThirdOpacity: (lowerThirdOpacity) => set({ lowerThirdOpacity }),

      loadBackgrounds: async () => {
        if (window.electronAPI?.backgrounds) {
          const files = await window.electronAPI.backgrounds.list()
          set({ backgrounds: files })
        }
      },

      addBackgrounds: async () => {
        if (window.electronAPI?.backgrounds) {
          const imported = await window.electronAPI.backgrounds.import()
          if (imported.length > 0) {
            set((state) => ({ backgrounds: [...state.backgrounds, ...imported] }))
            // Sync from main so UI always matches disk (handles any serialization/state edge cases)
            const files = await window.electronAPI.backgrounds.list()
            set({ backgrounds: files })
          }
          return imported
        }
        return []
      },

      removeBackground: async (filename) => {
        if (window.electronAPI?.backgrounds) {
          await window.electronAPI.backgrounds.remove(filename)
          set((state) => {
            const backgrounds = state.backgrounds.filter(f => f !== filename)
            const updates: Partial<PresentationState> = { backgrounds }
            if (state.defaultBackground === filename) {
              updates.defaultBackground = '#000000'
            }
            return updates
          })
        }
      },

      setNdiEnabled: (ndiEnabled) => {
        set({ ndiEnabled })
        if (window.electronAPI?.ndi) {
          if (ndiEnabled) {
            const { ndiSourceName } = get()
            window.electronAPI.ndi.start(ndiSourceName).then((result) => {
              set({
                ndiRunning: result.success,
                ndiMockMode: result.status?.mockMode ?? false,
              })
            })
          } else {
            window.electronAPI.ndi.stop().then(() => {
              set({ ndiRunning: false, ndiMockMode: false })
            })
          }
        }
      },

      setNdiSourceName: (ndiSourceName) => {
        set({ ndiSourceName })
        if (window.electronAPI?.ndi) {
          window.electronAPI.ndi.setSourceName(ndiSourceName)
        }
      },

      refreshNdiStatus: async () => {
        if (window.electronAPI?.ndi) {
          const status = await window.electronAPI.ndi.getStatus()
          set({
            ndiAvailable: status.available,
            ndiRunning: status.running,
            ndiMockMode: status.mockMode ?? false,
          })
        }
      },
    }),
    {
      name: 'open-worship-presentation',
      partialize: (state) => ({
        fontSize: state.fontSize,
        fontFamily: state.fontFamily,
        fontWeight: state.fontWeight,
        textColor: state.textColor,
        defaultBackground: state.defaultBackground,
        displayId: state.displayId,
        ndiEnabled: state.ndiEnabled,
        ndiSourceName: state.ndiSourceName,
        textPosition: state.textPosition,
        shadowBlur: state.shadowBlur,
        shadowOffsetX: state.shadowOffsetX,
        shadowOffsetY: state.shadowOffsetY,
        shadowColor: state.shadowColor,
        lowerThirdOpacity: state.lowerThirdOpacity,
      }),
    }
  )
)

// Helper to update presentation window
function updatePresentationWindow(slideData: SlideData | null) {
  if (window.electronAPI && slideData) {
    window.electronAPI.updatePresentation(slideData)
  }
}
