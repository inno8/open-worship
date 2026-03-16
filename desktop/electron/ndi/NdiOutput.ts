let grandiose: typeof import('grandiose') | null = null

try {
  grandiose = require('grandiose')
} catch {
  // grandiose not available — will use mock mode
}

export interface NdiFrameData {
  data: Buffer
  width: number
  height: number
}

/**
 * NDI output sender. When grandiose is available it sends real NDI frames.
 * When not available, operates in mock mode so the rest of the pipeline
 * (Settings UI, frame capture, IPC) can be developed and tested.
 *
 * To swap in the real implementation later, just ensure `grandiose` loads
 * successfully — the class adapts automatically.
 */
export class NdiOutput {
  private sender: unknown = null
  private sourceName: string
  private width: number
  private height: number
  private running = false
  private mockMode = false
  private frameCount = 0
  private lastFrameTime = 0

  constructor(sourceName = 'Open Worship', width = 1920, height = 1080) {
    this.sourceName = sourceName
    this.width = width
    this.height = height
  }

  get isAvailable(): boolean {
    // Available in both real and mock mode so the UI pipeline works
    return true
  }

  get isNativeAvailable(): boolean {
    return grandiose !== null
  }

  get isRunning(): boolean {
    return this.running
  }

  async start(): Promise<boolean> {
    if (this.running) return true

    if (grandiose) {
      try {
        const send = grandiose.send as unknown as (opts: Record<string, unknown>) => unknown
        this.sender = send({
          name: this.sourceName,
          clockVideo: false,
          clockAudio: false,
        })
        this.running = true
        this.mockMode = false
        console.log(`NDI sender started (native): "${this.sourceName}"`)
        return true
      } catch (err) {
        console.error('Failed to start native NDI sender:', err)
        console.log('Falling back to mock mode')
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
        const s = this.sender as { dispose?: () => void; destroy?: () => void }
        if (typeof s.dispose === 'function') s.dispose()
        else if (typeof s.destroy === 'function') s.destroy()
      } catch (err) {
        console.warn('Error disposing NDI sender:', err)
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
    try {
      const sender = this.sender as { video: (frame: Record<string, unknown>) => void }
      sender.video({
        xres: frameData.width,
        yres: frameData.height,
        fourCC: (grandiose as Record<string, unknown>).FOURCC_RGBA ?? 'RGBA',
        frameRateN: 30000,
        frameRateD: 1001,
        lineStrideBytes: frameData.width * 4,
        data: frameData.data,
      })
    } catch (err) {
      console.error('Failed to send NDI frame:', err)
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
