import { useState, useEffect } from 'react'
import { useSongStore } from '../stores/songStore'
import { useScheduleStore } from '../stores/scheduleStore'
import { usePresentationStore } from '../stores/presentationStore'
import { registerSyncHandlers } from '../services/registerSyncHandlers'
import { wsSync } from '../services/WebSocketSync'
import { startHeartbeat, requestNotificationPermission } from '../services/heartbeatService'

interface SplashScreenProps {
  onComplete: () => void
}

export default function SplashScreen({ onComplete }: SplashScreenProps) {
  const [status, setStatus] = useState('Starting…')
  const loadSongs = useSongStore((s) => s.loadSongs)
  const loadSchedules = useScheduleStore((s) => s.loadSchedules)
  const setNdiEnabled = usePresentationStore((s) => s.setNdiEnabled)

  useEffect(() => {
    let cancelled = false

    async function runPreChecks() {
      const steps: Array<{ msg: string; fn: () => void | Promise<void> }> = [
        { msg: 'Loading library…', fn: () => loadSongs() },
        {
          msg: "Loading today's schedule…",
          fn: async () => {
            await loadSchedules()
            const { schedules, setActiveSchedule } = useScheduleStore.getState()
            const today = new Date().toISOString().slice(0, 10)
            const todaysSchedule = schedules.find((s) => s.date === today)
            if (todaysSchedule) setActiveSchedule(todaysSchedule)
          },
        },
        { msg: 'Enabling NDI output…', fn: () => setNdiEnabled(true) },
        {
          msg: 'Connecting to backend…',
          fn: () => {
            registerSyncHandlers()
            wsSync.connect()
          },
        },
        {
          msg: 'Starting heartbeat…',
          fn: () => {
            requestNotificationPermission()
            startHeartbeat()
          },
        },
      ]

      for (const step of steps) {
        if (cancelled) return
        setStatus(step.msg)
        await Promise.resolve(step.fn())
      }

      if (cancelled) return
      setStatus('Ready')
      await new Promise((r) => setTimeout(r, 400))
      if (!cancelled) onComplete()
    }

    runPreChecks()
    return () => {
      cancelled = true
    }
  }, [loadSongs, loadSchedules, setNdiEnabled, onComplete])

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: '#1a1a2e',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
      }}
    >
      {/* Stylized logo */}
      <h1
        style={{
          margin: 0,
          fontSize: 'clamp(2rem, 6vw, 3.5rem)',
          fontWeight: 700,
          letterSpacing: '-0.02em',
          background: 'linear-gradient(135deg, #e94560 0%, #ff6b6b 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          textShadow: '0 0 40px rgba(233,69,96,0.2)',
        }}
      >
        Open Worship
      </h1>

      {/* Spinner */}
      <div
        style={{
          marginTop: 48,
          width: 40,
          height: 40,
          border: '3px solid rgba(255,255,255,0.1)',
          borderTopColor: '#e94560',
          borderRadius: '50%',
          animation: 'splash-spin 0.9s linear infinite',
        }}
      />

      {/* Status */}
      <p
        style={{
          marginTop: 24,
          color: 'rgba(255,255,255,0.7)',
          fontSize: 15,
          fontWeight: 500,
        }}
      >
        {status}
      </p>

      <style>{`
        @keyframes splash-spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}
