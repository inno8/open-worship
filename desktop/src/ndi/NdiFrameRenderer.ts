import { SlideData, TextPosition } from '../stores/presentationStore'

// Full screen mode: 1920x1080
export const NDI_FRAME_WIDTH_FULL = 1920
export const NDI_FRAME_HEIGHT_FULL = 1080

// Lower third mode: 1920x360 (1/3 of 1080)
export const NDI_FRAME_WIDTH_LOWER_THIRD = 1920
export const NDI_FRAME_HEIGHT_LOWER_THIRD = 360

// Default export for compatibility
export const NDI_FRAME_WIDTH = NDI_FRAME_WIDTH_FULL
export const NDI_FRAME_HEIGHT = NDI_FRAME_HEIGHT_FULL

export interface RenderedFrame {
  data: Uint8Array
  width: number
  height: number
}

const imageCache = new Map<string, HTMLImageElement>()

function loadBackgroundImage(filename: string): Promise<HTMLImageElement> {
  const cached = imageCache.get(filename)
  if (cached && cached.complete) return Promise.resolve(cached)
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      imageCache.set(filename, img)
      resolve(img)
    }
    img.onerror = () => reject(new Error(`Failed to load background: ${filename}`))
    // Use app-bg protocol so Electron serves from backgrounds dir
    img.src = `app-bg:///${filename}`
  })
}

function extractBackgroundFilename(backgroundImage?: string, useLowerThird = false): string | null {
  if (!backgroundImage) return null
  const m = backgroundImage.match(/app-bg:\/\/\/?([^)]+)/)
  if (!m) return null
  
  let filename = m[1].trim()
  
  // For lower-third mode, use the _lower version of the background
  if (useLowerThird && filename) {
    // Replace extension with _lower.png (new imports) or _lower.jpg (old imports)
    // Try .png first as that's what new imports use
    const ext = filename.match(/\.(jpg|jpeg|png|webp)$/i)?.[1] || 'png'
    const lowerFilename = filename.replace(/\.(jpg|jpeg|png|webp)$/i, '_lower.png')
    return lowerFilename
  }
  
  return filename
}

export class NdiFrameRenderer {
  private canvas: OffscreenCanvas
  private ctx: OffscreenCanvasRenderingContext2D
  private width: number
  private height: number
  private lastSlideJson = ''
  private cachedFrame: RenderedFrame | null = null
  private didLogFrameDimensions = false
  private currentMode: TextPosition = 'lower-third'

  constructor() {
    // Start with lower-third mode as default
    this.width = NDI_FRAME_WIDTH_LOWER_THIRD
    this.height = NDI_FRAME_HEIGHT_LOWER_THIRD
    this.canvas = new OffscreenCanvas(this.width, this.height)
    this.ctx = this.canvas.getContext('2d', { willReadFrequently: true })!
    console.log('[NdiFrameRenderer] OffscreenCanvas created:', {
      mode: this.currentMode,
      width: this.width,
      height: this.height,
    })
  }

  // Update canvas size based on text position mode
  private updateCanvasSize(textPosition: TextPosition): void {
    if (textPosition === this.currentMode) return

    this.currentMode = textPosition
    if (textPosition === 'lower-third') {
      this.width = NDI_FRAME_WIDTH_LOWER_THIRD
      this.height = NDI_FRAME_HEIGHT_LOWER_THIRD
    } else {
      this.width = NDI_FRAME_WIDTH_FULL
      this.height = NDI_FRAME_HEIGHT_FULL
    }

    // Recreate canvas with new dimensions
    this.canvas = new OffscreenCanvas(this.width, this.height)
    this.ctx = this.canvas.getContext('2d', { willReadFrequently: true })!
    this.cachedFrame = null
    this.lastSlideJson = ''

    console.log('[NdiFrameRenderer] Canvas resized:', {
      mode: textPosition,
      width: this.width,
      height: this.height,
    })
  }

  async renderSlide(slide: SlideData | null): Promise<RenderedFrame | null> {
    // Update canvas size based on text position mode
    const textPosition = slide?.textPosition ?? 'lower-third'
    this.updateCanvasSize(textPosition)

    // Cache: if slide hasn't changed, return the same frame data
    const slideJson = slide ? JSON.stringify(slide) : ''
    if (slideJson === this.lastSlideJson && this.cachedFrame) {
      return this.cachedFrame
    }
    this.lastSlideJson = slideJson

    const { ctx, width, height } = this

    ctx.clearRect(0, 0, width, height)

    // If slide is null (offline) or blank (blacked), return fully transparent frame
    // This ensures OBS shows nothing instead of a black rectangle
    if (!slide || slide.sectionType === 'blank') {
      // Canvas is already cleared to transparent by clearRect
      this.cachedFrame = this.extractFrame()
      return this.cachedFrame
    }

    // Use lower-third version of background when in lower-third mode
    const useLowerThird = this.currentMode === 'lower-third'
    const bgFilename = extractBackgroundFilename(slide?.backgroundImage, useLowerThird)
    
    // Apply opacity for lower-third mode
    const opacity = useLowerThird ? (slide?.lowerThirdOpacity ?? 1) : 1
    ctx.globalAlpha = opacity
    
    let backgroundDrawn = false
    
    if (bgFilename) {
      try {
        const img = await loadBackgroundImage(bgFilename)
        ctx.drawImage(img, 0, 0, width, height)
        backgroundDrawn = true
      } catch {
        // Try full-size fallback if lower-third version doesn't exist
        if (useLowerThird) {
          const fullFilename = extractBackgroundFilename(slide?.backgroundImage, false)
          if (fullFilename) {
            try {
              const imgFull = await loadBackgroundImage(fullFilename)
              ctx.drawImage(imgFull, 0, 0, width, height)
              backgroundDrawn = true
            } catch {
              // Will fall back to solid color below
            }
          }
        }
      }
    }
    
    // Only fill with solid color if no background image was drawn
    // This prevents black showing through/above the background
    if (!backgroundDrawn) {
      const bgColor = slide?.backgroundColor ?? '#000000'
      ctx.fillStyle = bgColor
      ctx.fillRect(0, 0, width, height)
    }
    
    // Reset opacity for text rendering
    ctx.globalAlpha = 1

    if (!slide.text) {
      this.cachedFrame = this.extractFrame()
      return this.cachedFrame
    }

    const fontSize = this.parseFontSize(slide.fontSize)
    const fontFamily = slide.fontFamily && slide.fontFamily !== 'inherit'
      ? slide.fontFamily
      : 'sans-serif'
    const fontWeight = slide.fontWeight ?? 400
    // Canvas font format: [ [ font-style || font-variant || font-weight ]? font-size [ / line-height ]? font-family ]
    ctx.font = `normal normal ${fontWeight} ${fontSize}px ${fontFamily}`
    ctx.fillStyle = slide.textColor ?? '#ffffff'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'

    ctx.shadowBlur = slide.shadowBlur ?? 8
    ctx.shadowOffsetX = slide.shadowOffsetX ?? 2
    ctx.shadowOffsetY = slide.shadowOffsetY ?? 2
    ctx.shadowColor = slide.shadowColor ?? 'rgba(0,0,0,0.8)'

    const lines = slide.text.split('\n').filter(l => l.trim())
    const lineHeight = fontSize * 1.4
    const totalHeight = lines.length * lineHeight
    
    // In lower-third mode, position text lower (57% down from top = 26px below center)
    // In center mode, center the text vertically
    const verticalOffset = this.currentMode === 'lower-third' 
      ? height * 0.57 - totalHeight / 2 + lineHeight / 2  // ~26px below center
      : (height - totalHeight) / 2 + lineHeight / 2       // centered
    const startY = verticalOffset

    for (let i = 0; i < lines.length; i++) {
      const y = startY + i * lineHeight
      this.drawWrappedLine(lines[i], width / 2, y, width * 0.9, fontSize)
    }

    ctx.shadowColor = 'transparent'
    ctx.shadowBlur = 0
    ctx.shadowOffsetX = 0
    ctx.shadowOffsetY = 0

    this.cachedFrame = this.extractFrame()
    return this.cachedFrame
  }

  private drawWrappedLine(text: string, x: number, y: number, maxWidth: number, fontSize: number): void {
    const { ctx } = this
    const measured = ctx.measureText(text)

    if (measured.width <= maxWidth) {
      ctx.fillText(text, x, y)
      return
    }

    const words = text.split(' ')
    let currentLine = ''
    const wrappedLines: string[] = []

    for (const word of words) {
      const testLine = currentLine ? `${currentLine} ${word}` : word
      if (ctx.measureText(testLine).width > maxWidth && currentLine) {
        wrappedLines.push(currentLine)
        currentLine = word
      } else {
        currentLine = testLine
      }
    }
    if (currentLine) wrappedLines.push(currentLine)

    const lineHeight = fontSize * 1.4
    const offsetY = -((wrappedLines.length - 1) * lineHeight) / 2

    for (let i = 0; i < wrappedLines.length; i++) {
      ctx.fillText(wrappedLines[i], x, y + offsetY + i * lineHeight)
    }
  }

  // Font size defaults - lower third needs smaller default since frame is 360px tall
  private static readonly NDI_FONT_SIZE_DEFAULT_FULL = 96
  private static readonly NDI_FONT_SIZE_DEFAULT_LOWER_THIRD = 64
  private static readonly NDI_FONT_SIZE_SCALE = 1.5

  private parseFontSize(fontSize?: string): number {
    const defaultSize = this.currentMode === 'lower-third' 
      ? NdiFrameRenderer.NDI_FONT_SIZE_DEFAULT_LOWER_THIRD 
      : NdiFrameRenderer.NDI_FONT_SIZE_DEFAULT_FULL

    if (!fontSize) return defaultSize
    const match = fontSize.match(/([\d.]+)(rem|px|em)/)
    if (!match) return defaultSize
    const value = parseFloat(match[1])
    const unit = match[2]
    let px: number
    if (unit === 'rem' || unit === 'em') {
      px = value * 16
    } else {
      px = value
    }
    
    // Scale factor for lower-third mode (smaller frame = need proportionally smaller text)
    const scale = this.currentMode === 'lower-third' 
      ? NdiFrameRenderer.NDI_FONT_SIZE_SCALE * 0.7 
      : NdiFrameRenderer.NDI_FONT_SIZE_SCALE
    
    const scaled = Math.round(px * scale)
    return Math.max(scaled, defaultSize * 0.5) // Allow smaller minimum for lower third
  }

  private extractFrame(): RenderedFrame {
    const imageData = this.ctx.getImageData(0, 0, this.width, this.height)
    const expectedBytes = this.width * this.height * 4
    // Use exact slice: getImageData may share a larger buffer (causes garbled strip if we send extra bytes)
    const data = new Uint8Array(
      imageData.data.buffer,
      imageData.data.byteOffset,
      imageData.data.byteLength
    )
    if (data.byteLength !== expectedBytes) {
      console.warn('[NdiFrameRenderer] getImageData size mismatch:', {
        width: this.width,
        height: this.height,
        expectedBytes,
        actualBytes: data.byteLength,
      })
    } else if (!this.didLogFrameDimensions) {
      this.didLogFrameDimensions = true
      console.log('[NdiFrameRenderer] getImageData OK:', {
        width: this.width,
        height: this.height,
        bytes: data.byteLength,
      })
    }
    return {
      data,
      width: this.width,
      height: this.height,
    }
  }
}
