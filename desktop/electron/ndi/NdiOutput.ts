import { NdiSender, isNdiAvailable } from './NdiKoffi'

export interface NdiFrameData {
  data: Buffer
  width: number
  height: number
}

/**
 * NDI output sender. Uses koffi to call NDI Runtime DLLs directly.
 * Falls back to mock mode if NDI Runtime is not installed.
 */
export class NdiOutput {
  private sender: NdiSender | null = null
  private sourceName: string
  private width: number
  private height: number
  private running = false
  private mockMode = false
  private frameCount = 0
  private lastFrameTime = 0
  private ndiAvailable: boolean

  constructor(sourceName = 'Open Worship', width = 1920, height = 1080) {
    this.sourceName = sourceName
    this.width = width
    this.height = height
    this.ndiAvailable = isNdiAvailable()
  }

  get isAvailable(): boolean {
    return true // Always available (mock mode as fallback)
  }

  get isNativeAvailable(): boolean {
    return this.ndiAvailable
  }

  get isRunning(): boolean {
    return this.running
  }

  async start(): Promise<boolean> {
    if (this.running) return true

    if (this.ndiAvailable) {
      try {
        this.sender = new NdiSender(this.sourceName)
        const started = this.sender.start()
        
        if (started) {
          this.running = true
          this.mockMode = false
          console.log(`NDI sender started (native): "${this.sourceName}"`)
          return true
        } else {
          console.log('Failed to start native NDI, falling back to mock mode')
          this.sender = null
        }
      } catch (err) {
        console.error('Error starting native NDI sender:', err)
        this.sender = null
      }
    }

    // Mock mode: no real NDI output, but the pipeline runs end-to-end
    this.running = true
    this.mockMode = true
    this.frameCount = 0
    console.log(`NDI sender started (mock): "${this.sourceName}"`)
    return true
  }

  stop(): void {
    if (this.sender) {
      try {
        this.sender.stop()
      } catch (err) {
        console.warn('Error stopping NDI sender:', err)
      }
      this.sender = null
    }

    if (this.running) {
      console.log(`NDI sender stopped (${this.mockMode ? 'mock' : 'native'}, ${this.frameCount} frames sent)`)
    }

    this.running = false
    this.mockMode = false
    this.frameCount = 0
    this.lastFrameTime = 0
  }

  sendFrame(frameData: NdiFrameData): void {
    if (!this.running) return

    this.frameCount++
    const now = Date.now()

    if (this.mockMode) {
      // In mock mode, log periodically so we can verify the pipeline works
      if (now - this.lastFrameTime > 5000) {
        console.log(
          `NDI mock: frame #${this.frameCount}, ` +
          `${frameData.width}x${frameData.height}, ` +
          `${(frameData.data.length / 1024).toFixed(0)}KB`
        )
        this.lastFrameTime = now
      }
      return
    }

    // Real NDI sender
    if (this.sender) {
      this.sender.sendFrame(frameData.data, frameData.width, frameData.height)
    }
  }

  setSourceName(name: string): void {
    const wasRunning = this.running
    if (wasRunning) this.stop()
    this.sourceName = name
    if (wasRunning) this.start()
  }

  setResolution(width: number, height: number): void {
    this.width = width
    this.height = height
  }

  getStatus() {
    return {
      available: this.isAvailable,
      nativeAvailable: this.isNativeAvailable,
      running: this.running,
      mockMode: this.mockMode,
      sourceName: this.sourceName,
      resolution: { width: this.width, height: this.height },
      frameCount: this.frameCount,
    }
  }
}

let instance: NdiOutput | null = null

export function getNdiOutput(): NdiOutput {
  if (!instance) {
    instance = new NdiOutput()
  }
  return instance
}
