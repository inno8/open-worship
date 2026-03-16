import { SlideData } from '../stores/presentationStore'

// Fixed 1920x1080 so OBS can scale the source without stretching text pixels
export const NDI_FRAME_WIDTH = 1920
export const NDI_FRAME_HEIGHT = 1080

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

function extractBackgroundFilename(backgroundImage?: string): string | null {
  if (!backgroundImage) return null
  const m = backgroundImage.match(/app-bg:\/\/\/?([^)]+)/)
  return m ? m[1].trim() : null
}

export class NdiFrameRenderer {
  private canvas: OffscreenCanvas
  private ctx: OffscreenCanvasRenderingContext2D
  private readonly width = NDI_FRAME_WIDTH
  private readonly height = NDI_FRAME_HEIGHT
  private lastSlideJson = ''
  private cachedFrame: RenderedFrame | null = null
  private didLogFrameDimensions = false

  constructor() {
    this.canvas = new OffscreenCanvas(NDI_FRAME_WIDTH, NDI_FRAME_HEIGHT)
    this.ctx = this.canvas.getContext('2d', { willReadFrequently: true })!
    // Verify OffscreenCanvas actual dimensions (debug NDI garbled output)
    console.log('[NdiFrameRenderer] OffscreenCanvas created:', {
      requested: `${NDI_FRAME_WIDTH}x${NDI_FRAME_HEIGHT}`,
      actualWidth: this.canvas.width,
      actualHeight: this.canvas.height,
    })
  }

  async renderSlide(slide: SlideData | null): Promise<RenderedFrame | null> {
    // Cache: if slide hasn't changed, return the same frame data
    const slideJson = slide ? JSON.stringify(slide) : ''
    if (slideJson === this.lastSlideJson && this.cachedFrame) {
      return this.cachedFrame
    }
    this.lastSlideJson = slideJson

    const { ctx, width, height } = this

    ctx.clearRect(0, 0, width, height)

    // 1. Draw background (color then image) so NDI frame is not transparent
    const bgColor = slide?.backgroundColor ?? '#000000'
    ctx.fillStyle = bgColor
    ctx.fillRect(0, 0, width, height)

    const bgFilename = extractBackgroundFilename(slide?.backgroundImage)
    if (bgFilename) {
      try {
        const img = await loadBackgroundImage(bgFilename)
        ctx.drawImage(img, 0, 0, width, height)
      } catch {
        // Keep solid color if image fails to load
      }
    }

    if (!slide || !slide.text || slide.sectionType === 'blank') {
      this.cachedFrame = this.extractFrame()
      return this.cachedFrame
    }

    const fontSize = this.parseFontSize(slide.fontSize)
    const fontFamily = slide.fontFamily && slide.fontFamily !== 'inherit'
      ? slide.fontFamily
      : 'sans-serif'

    ctx.font = `bold ${fontSize}px ${fontFamily}`
    ctx.fillStyle = '#ffffff'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'

    ctx.shadowColor = 'rgba(0, 0, 0, 0.8)'
    ctx.shadowBlur = 8
    ctx.shadowOffsetX = 2
    ctx.shadowOffsetY = 2

    const lines = slide.text.split('\n').filter(l => l.trim())
    const lineHeight = fontSize * 1.4
    const totalHeight = lines.length * lineHeight
    const startY = (height - totalHeight) / 2 + lineHeight / 2

    for (let i = 0; i < lines.length; i++) {
      const y = startY + i * lineHeight
      this.drawWrappedLine(lines[i], width / 2, y, width * 0.85, fontSize)
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

  private parseFontSize(fontSize?: string): number {
    if (!fontSize) return 64
    const match = fontSize.match(/([\d.]+)(rem|px|em)/)
    if (!match) return 64
    const value = parseFloat(match[1])
    const unit = match[2]
    if (unit === 'rem' || unit === 'em') return value * 16
    return value
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
