import { create } from 'zustand'
import { Section } from './songStore'

interface SlideData {
  text: string
  sectionType: string
  backgroundColor?: string
  backgroundImage?: string
  fontSize?: string
  fontFamily?: string
}

interface PresentationState {
  isLive: boolean
  currentSlide: SlideData | null
  sections: Section[]
  currentSectionIndex: number
  currentLineIndex: number
  displayId: number | null
  
  // Settings
  fontSize: string
  fontFamily: string
  defaultBackground: string
  
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
  setDefaultBackground: (bg: string) => void
}

export const usePresentationStore = create<PresentationState>((set, get) => ({
  isLive: false,
  currentSlide: null,
  sections: [],
  currentSectionIndex: 0,
  currentLineIndex: 0,
  displayId: null,
  fontSize: '4rem',
  fontFamily: 'inherit',
  defaultBackground: '#000000',

  setLive: (isLive) => set({ isLive }),
  
  setSections: (sections) => set({ 
    sections, 
    currentSectionIndex: 0, 
    currentLineIndex: 0 
  }),
  
  setCurrentSlide: (currentSlide) => set({ currentSlide }),
  
  goToSection: (index) => {
    const { sections, fontSize, fontFamily, defaultBackground } = get()
    if (index >= 0 && index < sections.length) {
      const section = sections[index]
      // Show first line of the section, not all lines
      const text = section.lines[0] || ''
      
      set({
        currentSectionIndex: index,
        currentLineIndex: 0,
        currentSlide: {
          text,
          sectionType: section.type,
          fontSize,
          fontFamily,
          backgroundColor: defaultBackground,
        },
      })
      
      // Update presentation window if open
      updatePresentationWindow(get().currentSlide)
    }
  },
  
  goToLine: (sectionIndex, lineIndex) => {
    const { sections, fontSize, fontFamily, defaultBackground } = get()
    if (sectionIndex >= 0 && sectionIndex < sections.length) {
      const section = sections[sectionIndex]
      if (lineIndex >= 0 && lineIndex < section.lines.length) {
        set({
          currentSectionIndex: sectionIndex,
          currentLineIndex: lineIndex,
          currentSlide: {
            text: section.lines[lineIndex],
            sectionType: section.type,
            fontSize,
            fontFamily,
            backgroundColor: defaultBackground,
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
    set({
      currentSlide: {
        text: '',
        sectionType: 'blank',
        backgroundColor: '#000000',
      },
    })
    updatePresentationWindow(get().currentSlide)
  },
  
  setDisplayId: (displayId) => set({ displayId }),
  setFontSize: (fontSize) => set({ fontSize }),
  setFontFamily: (fontFamily) => set({ fontFamily }),
  setDefaultBackground: (defaultBackground) => set({ defaultBackground }),
}))

// Helper to update presentation window
function updatePresentationWindow(slideData: SlideData | null) {
  if (window.electronAPI && slideData) {
    window.electronAPI.updatePresentation(slideData)
  }
}
