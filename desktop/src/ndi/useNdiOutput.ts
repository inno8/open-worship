import { useEffect, useRef, useCallback } from 'react'
import { usePresentationStore, SlideData } from '../stores/presentationStore'
import { NdiFrameRenderer } from './NdiFrameRenderer'

const TARGET_FPS = 30
const FRAME_INTERVAL = 1000 / TARGET_FPS

/**
 * Hook that drives the NDI frame-send loop.
 * Renders the current slide to an offscreen canvas and sends raw RGBA
 * data to the main process via IPC. Frames are cached when the slide
 * hasn't changed, so repeated sends are cheap.
 */
export function useNdiOutput() {
  const { isLive, currentSlide, ndiEnabled, ndiRunning } = usePresentationStore()
  const rendererRef = useRef<NdiFrameRenderer | null>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const lastSlideRef = useRef<SlideData | null>(null)

  const getRenderer = useCallback(() => {
    if (!rendererRef.current) {
      rendererRef.current = new NdiFrameRenderer()
    }
    return rendererRef.current
  }, [])

  const sendCurrentFrame = useCallback(async () => {
    if (!window.electronAPI?.ndi) return

    const slide = lastSlideRef.current
    const renderer = getRenderer()
    const frame = await renderer.renderSlide(slide)

    if (frame) {
      // Electron's structured clone handles Uint8Array efficiently
      // (binary transfer, no JSON serialization of millions of numbers)
      window.electronAPI.ndi.sendFrame({
        data: frame.data,
        width: frame.width,
        height: frame.height,
      })
    }
  }, [getRenderer])

  // Track current slide
  useEffect(() => {
    lastSlideRef.current = currentSlide
  }, [currentSlide])

  // Start/stop the frame send loop
  useEffect(() => {
    const shouldStream = isLive && ndiEnabled && ndiRunning

    if (shouldStream) {
      if (!intervalRef.current) {
        void sendCurrentFrame()
        intervalRef.current = setInterval(() => void sendCurrentFrame(), FRAME_INTERVAL)
      }
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }

      // When going off-air but NDI is still running, send one frame (black/no slide)
      if (ndiEnabled && ndiRunning && !isLive) {
        void getRenderer().renderSlide(null).then((emptyFrame) => {
          if (emptyFrame && window.electronAPI?.ndi) {
            window.electronAPI.ndi.sendFrame({
              data: emptyFrame.data,
              width: emptyFrame.width,
              height: emptyFrame.height,
            })
          }
        })
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [isLive, ndiEnabled, ndiRunning, sendCurrentFrame, getRenderer])
}
