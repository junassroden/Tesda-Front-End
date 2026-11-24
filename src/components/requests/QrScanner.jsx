import { useCallback, useEffect, useRef, useState } from 'react'
import Icon from '../Icon/Icon.jsx'

const CAMERA_ERRORS = {
  NotAllowedError: 'Camera access was blocked. Allow the camera for this site in your browser settings, or enter the reference number below.',
  SecurityError: 'Camera access was blocked. Allow the camera for this site in your browser settings, or enter the reference number below.',
  NotFoundError: 'No camera was found on this device. Enter the delivery reference number below.',
  OverconstrainedError: 'No suitable camera was found on this device. Enter the delivery reference number below.',
  NotReadableError: 'The camera is being used by another app. Close it and try again, or enter the reference number below.',
}

/**
 * Camera QR scanner. Frames are decoded in the browser with jsQR (works on
 * phones without the BarcodeDetector API). onResult(text) fires once per
 * code; scanning pauses until `paused` turns false again.
 */
export default function QrScanner({ onResult, paused = false }) {
  const video = useRef(null)
  const canvas = useRef(null)
  const stream = useRef(null)
  const frame = useRef(0)
  const last = useRef('')
  // Keep the latest callback without restarting the camera.
  const onResultRef = useRef(onResult)
  useEffect(() => {
    onResultRef.current = onResult
  }, [onResult])
  const [state, setState] = useState('idle') // idle | starting | live | error
  const [error, setError] = useState('')

  const stop = useCallback(() => {
    cancelAnimationFrame(frame.current)
    stream.current?.getTracks().forEach((t) => t.stop())
    stream.current = null
  }, [])

  const start = useCallback(async () => {
    setError('')
    if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia) {
      setState('error')
      setError('This browser cannot open the camera here. The camera needs HTTPS (or localhost). Enter the delivery reference number below.')
      return
    }
    setState('starting')
    try {
      const [jsQR, media] = await Promise.all([
        import('jsqr').then((m) => m.default),
        navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' } }, audio: false }),
      ])
      stream.current = media
      video.current.srcObject = media
      await video.current.play()
      setState('live')
      last.current = ''
      const tick = () => {
        const v = video.current
        const c = canvas.current
        if (v && c && v.readyState >= 2) {
          const w = v.videoWidth
          const h = v.videoHeight
          c.width = w
          c.height = h
          const ctx = c.getContext('2d', { willReadFrequently: true })
          ctx.drawImage(v, 0, 0, w, h)
          const code = jsQR(ctx.getImageData(0, 0, w, h).data, w, h, { inversionAttempts: 'dontInvert' })
          if (code?.data && code.data !== last.current) {
            last.current = code.data
            navigator.vibrate?.(60)
            onResultRef.current(code.data)
          }
        }
        frame.current = requestAnimationFrame(tick)
      }
      frame.current = requestAnimationFrame(tick)
    } catch (err) {
      stop()
      setState('error')
      setError(CAMERA_ERRORS[err?.name] ?? 'The camera could not be started. Enter the delivery reference number below.')
    }
  }, [stop])

  // Pause decoding while a result is shown; allow the same code again afterwards.
  useEffect(() => {
    if (!paused) last.current = ''
  }, [paused])

  useEffect(() => stop, [stop])

  return (
    <div className="qr-scanner">
      <div className={`qr-stage is-${state}`}>
        <video ref={video} playsInline muted aria-label="Camera preview" />
        <canvas ref={canvas} hidden />
        {state === 'live' && <span className="qr-guide" aria-hidden="true" />}
        {state !== 'live' && (
          <div className="qr-stage-msg">
            <Icon name="camera" size={28} />
            {state === 'starting' ? <span>Starting the camera…</span> : state === 'error' ? <span>{error}</span> : <span>Point the camera at the delivery&apos;s QR code.</span>}
            {state !== 'starting' && (
              <button type="button" className="btn btn-primary" onClick={start}>
                {state === 'error' ? 'Try again' : 'Open camera'}
              </button>
            )}
          </div>
        )}
        {state === 'live' && paused && <div className="qr-stage-pause">Code read. Check the details below.</div>}
      </div>
      {state === 'live' && (
        <div className="qr-scanner-bar">
          <span className="muted">Hold the QR code inside the frame.</span>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => {
              stop()
              setState('idle')
            }}
          >
            Stop camera
          </button>
        </div>
      )}
    </div>
  )
}
