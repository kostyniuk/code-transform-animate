import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile, toBlobURL } from "@ffmpeg/util";

let ffmpeg: FFmpeg | null = null;

export async function convertWebmToMp4(
  webmBlob: Blob,
  onProgress?: (progress: number) => void,
  totalDurationMs?: number,
): Promise<Blob> {
  // Lazy init
  if (!ffmpeg) {
    ffmpeg = new FFmpeg();

    // Load core from CDN
    const baseURL = "https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm";
    try {
      await ffmpeg.load({
        coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, "text/javascript"),
        wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, "application/wasm"),
      });
    } catch (e) {
      throw new Error(`Failed to load FFmpeg: ${e}`);
    }
  }

  const inputName = "input.webm";
  const outputName = "output.mp4";

  const progressHandler = ({ progress, time }: { progress: number; time: number }) => {
    let p = progress;
    // If progress is garbage (can happen with MediaRecorder WebM), fallback to time-based
    if (typeof p !== "number" || p < 0 || p > 1) {
      if (totalDurationMs && totalDurationMs > 0) {
        p = time / 1000 / totalDurationMs;
      } else {
        p = 0;
      }
    }
    onProgress?.(Math.max(0, Math.min(1, p)));
  };

  ffmpeg.on("progress", progressHandler);

  try {
    // Write input (use fetchFile for memory efficiency)
    await ffmpeg.writeFile(inputName, await fetchFile(webmBlob));

    // Convert with H.264
    await ffmpeg.exec([
      "-i",
      inputName,
      "-c:v",
      "libx264",
      "-preset",
      "medium",
      "-crf",
      "18", // High quality (lower = better, 18 is visually lossless)
      "-pix_fmt",
      "yuv420p", // Ensures compatibility with most players
      "-an", // No audio
      outputName,
    ]);

    // Read output
    const data = await ffmpeg.readFile(outputName);

    // Cleanup
    await ffmpeg.deleteFile(inputName);
    await ffmpeg.deleteFile(outputName);

    // Convert FileData to BlobPart
    // FFmpeg's readFile returns Uint8Array, but we need to ensure it's compatible with Blob
    let uint8Array: Uint8Array;
    if (data instanceof Uint8Array) {
      // Create a new Uint8Array from the buffer to ensure ArrayBuffer compatibility
      uint8Array = new Uint8Array(data.buffer.slice(0));
    } else if (typeof data === "string") {
      // If it's a string (base64), convert it
      const binaryString = atob(data);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      uint8Array = bytes;
    } else {
      // Fallback: try to convert to Uint8Array
      uint8Array = new Uint8Array(data as ArrayLike<number>);
    }
    // Type assertion needed because FFmpeg's Uint8Array has ArrayBufferLike, but Blob accepts it at runtime
    return new Blob([uint8Array as BlobPart], { type: "video/mp4" });
  } catch (error) {
    // Cleanup on error
    try {
      await ffmpeg.deleteFile(inputName);
      await ffmpeg.deleteFile(outputName);
    } catch {}
    throw new Error(`MP4 conversion failed: ${error}`);
  } finally {
    if (ffmpeg) {
      ffmpeg.off("progress", progressHandler);
    }
  }
}

export async function terminateFFmpeg() {
  if (ffmpeg) {
    await ffmpeg.terminate();
    ffmpeg = null;
  }
}
