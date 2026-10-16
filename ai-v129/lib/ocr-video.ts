import type { Roi } from "@/components/subtitle/VideoRoiPicker";
import { Platform } from "react-native";
import type { SubtitleCue } from "@/constants/studio";
import { secondsToSrtTime } from "@/lib/subtitle-parser";

export type OcrProgress = { frame: number; maxFrames: number; timestamp: number };
export type OcrVideoResult = { cues: SubtitleCue[]; framesRead: number; reachedFrameLimit: boolean };

function normalizeText(value: string): string {
  return value.replace(/\s+/g, " ").replace(/[|_]{2,}/g, " ").trim();
}

export function subtitleTextFromResult(result: { text?: string; blocks?: Array<{ text?: string; frame?: { x?: number; y?: number; width?: number; height?: number } }> }, imageHeight: number, imageWidth: number, roi: Roi): string {
  const blocks = result.blocks ?? [];
  const lowerFrameText = blocks
    .filter((block) => { const f = block.frame; if (typeof f?.y !== "number" || typeof f?.x !== "number") return false; const cx = (f.x + (f.width ?? 0) / 2) / imageWidth; const cy = (f.y + (f.height ?? 0) / 2) / imageHeight; return cx >= roi.x && cx <= roi.x + roi.width && cy >= roi.y && cy <= roi.y + roi.height; })
    .map((block) => block.text ?? "")
    .join(" ");
  return normalizeText(lowerFrameText);
}

/** Samples up to roughly 10 minutes of video at 1.5s intervals and OCRs lower-frame text. Native build required. */
export async function recognizeVideoSubtitles(
  videoUri: string,
  onProgress?: (progress: OcrProgress) => void,
  roi: Roi = { x: 0.08, y: 0.67, width: 0.84, height: 0.27 },
): Promise<OcrVideoResult> {
  if (Platform.OS === "web") throw new Error("OCR video cần bản Android/iOS đã build native; trang web không có ML Kit.");

  const [{ getThumbnailAsync }, { default: TextRecognition }] = await Promise.all([
    import("expo-video-thumbnails"),
    import("@react-native-ml-kit/text-recognition"),
  ]);

  // 400 samples cover roughly 10 minutes at 1.5-second intervals. This is a
  // deliberate safety cap: OCR is CPU-intensive and should not freeze a phone.
  const stepSeconds = 1.5;
  const maxFrames = 400;
  const activeCues: Array<{ startSeconds: number; endSeconds: number; text: string }> = [];
  let currentText = "";
  let currentStart = 0;
  let framesRead = 0;
  let reachedFrameLimit = false;

  for (let index = 0; index < maxFrames; index += 1) {
    const timestamp = index * stepSeconds;
    let image: { uri: string; width: number; height: number };
    try {
      image = await getThumbnailAsync(videoUri, { time: Math.round(timestamp * 1000), quality: 0.72 });
    } catch (error) {
      if (framesRead === 0) throw error;
      // Thumbnail extraction commonly fails once the requested time is past EOF.
      onProgress?.({ frame: index + 1, maxFrames, timestamp });
      break;
    }

    framesRead += 1;
    // Do not swallow OCR/model errors as if the video had ended: show them to the user.
    const result = await TextRecognition.recognize(image.uri);
    const text = subtitleTextFromResult(result, image.height, image.width, roi);
    onProgress?.({ frame: index + 1, maxFrames, timestamp });

    if (text === currentText) {
      if (text && activeCues.length) activeCues[activeCues.length - 1].endSeconds = timestamp + stepSeconds;
      continue;
    }
    if (currentText && activeCues.length) activeCues[activeCues.length - 1].endSeconds = timestamp;
    currentText = text;
    currentStart = timestamp;
    if (text) activeCues.push({ startSeconds: currentStart, endSeconds: timestamp + stepSeconds, text });
    if (index === maxFrames - 1) reachedFrameLimit = true;
  }

  const cues: SubtitleCue[] = activeCues
    .filter((cue) => cue.text.length > 0)
    .map((cue, index) => ({
      id: String(index + 1).padStart(2, "0"),
      start: secondsToSrtTime(cue.startSeconds),
      end: secondsToSrtTime(Math.max(cue.endSeconds, cue.startSeconds + 0.75)),
      source: cue.text,
      translated: "",
    }));

  return { cues, framesRead, reachedFrameLimit };
}
