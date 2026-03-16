import { SlideData } from '../stores/presentationStore'

const DEFAULT_WIDTH = 1920
const DEFAULT_HEIGHT = 1080

export interface RenderedFrame {
  data: Uint8Array
  width: number
  height: number
}

export class NdiFrameRenderer {
  private canvas: OffscreenCanvas
  private ctx: OffscreenCanvasRenderingContext2D
  private width: number
  private height: number
  private lastSlideJson = ''
  private cachedFrame: RenderedFrame | null = null

  constructor(width = DEFAULT_WIDTH, height = DEFAULT_HEIGHT) {
    this.width = width
    this.height = height
    this.canvas = new OffscreenCanvas(width, height)
    this.ctx = this.canvas.getContext('2d', { willReadFrequently: true })!
  }

  renderSlide(slide: SlideData | null): RenderedFrame | null {
    // Cache: if slide hasn't changed, return the same frame data
    const slideJson = slide ? JSON.stringify(slide) : ''
    if (slideJson === this.lastSlideJson && this.cachedFrame) {
      return this.cachedFrame
    }
    this.lastSlideJson = slideJson

    const { ctx, width, height } = this

    ctx.clearRect(0, 0, width, height)

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
    return {
      data: new Uint8Array(imageData.data.buffer),
      width: this.width,
      height: this.height,
    }
  }
}
