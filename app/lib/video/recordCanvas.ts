export type RecordCanvasOptions = {
  canvas: HTMLCanvasElement
  fps: number
  mimeTypePreference?: string[]
  onProgress?: (elapsedMs: number, totalMs: number) => void
}

function pickMimeType(preference: string[] | undefined): { mimeType: string; bitrate?: number } | undefined {
  const prefs =
    preference ??
    [
      "video/webm;codecs=vp9",
      "video/webm;codecs=vp8",
      "video/webm",
    ]

  for (const t of prefs) {
    if (typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported(t)) {
      // VP9 supports higher bitrates better; VP8 is more compatible but needs less bitrate
      const bitrate = t.includes("vp9") ? 10_000_000 : t.includes("vp8") ? 8_000_000 : undefined
      return { mimeType: t, bitrate }
    }
  }
  return undefined
}

export async function recordCanvasToWebm(opts: RecordCanvasOptions & { durationMs: number }) {
  const stream = opts.canvas.captureStream(opts.fps)
  const codecInfo = pickMimeType(opts.mimeTypePreference)

  const recorderOptions: MediaRecorderOptions | undefined = codecInfo
    ? {
        mimeType: codecInfo.mimeType,
        ...(codecInfo.bitrate ? { videoBitsPerSecond: codecInfo.bitrate } : {}),
      }
    : undefined

  const recorder = new MediaRecorder(stream, recorderOptions)
  const chunks: BlobPart[] = []

  recorder.ondataavailable = (e) => {
    if (e.data && e.data.size > 0) chunks.push(e.data)
  }

  const startedAt = performance.now()

  const done = new Promise<Blob>((resolve, reject) => {
    recorder.onerror = () => reject(new Error("Recording failed"))
    recorder.onstop = () => {
      const blob = new Blob(chunks, { type: recorder.mimeType || "video/webm" })
      resolve(blob)
    }
  })

  recorder.start(250)

  // Stop after duration, but give it a tiny buffer to flush the last chunk.
  const stopAt = startedAt + opts.durationMs
  await new Promise<void>((resolve) => {
    const tick = () => {
      const now = performance.now()
      opts.onProgress?.(Math.min(opts.durationMs, now - startedAt), opts.durationMs)
      if (now >= stopAt) {
        recorder.stop()
        resolve()
        return
      }
      requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
  })

  return await done
}


