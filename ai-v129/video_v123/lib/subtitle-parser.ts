import type { SubtitleCue } from "@/constants/studio";

const TIMESTAMP = "(?:\\d{1,2}:)?\\d{2}:\\d{2}[,.]\\d{3}";
const TIMING_LINE = new RegExp(`^(${TIMESTAMP})\\s*-->\\s*(${TIMESTAMP})`);

function normalizeTimestamp(value: string): string {
  const normalized = value.replace(".", ",");
  return normalized.length === 9 ? `00:${normalized}` : normalized;
}

/** Parse SRT or WebVTT into editable cues, keeping their original IDs and times. */
export function parseSubtitleText(input: string): SubtitleCue[] {
  const text = input.replace(/^\uFEFF/, "").replace(/\r/g, "");
  const blocks = text.split(/\n\s*\n+/).map((block) => block.trim()).filter(Boolean);
  const cues: SubtitleCue[] = [];

  for (const block of blocks) {
    const lines = block.split("\n").map((line) => line.trim()).filter(Boolean);
    const timingIndex = lines.findIndex((line) => TIMING_LINE.test(line));
    if (timingIndex < 0) continue;

    const timingMatch = lines[timingIndex].match(TIMING_LINE);
    if (!timingMatch) continue;
    const cueText = lines.slice(timingIndex + 1).join(" ").replace(/<[^>]*>/g, "").trim();
    if (!cueText) continue;

    const rawId = timingIndex > 0 ? lines[timingIndex - 1] : String(cues.length + 1);
    cues.push({
      id: rawId.slice(0, 80),
      start: normalizeTimestamp(timingMatch[1]),
      end: normalizeTimestamp(timingMatch[2]),
      source: cueText,
      translated: "",
    });
  }

  if (cues.length === 0) {
    throw new Error("Không tìm thấy cue phụ đề hợp lệ. Hãy chọn tệp .srt hoặc .vtt.");
  }
  return cues;
}

export function secondsToSrtTime(seconds: number): string {
  const safeMs = Math.max(0, Math.round(seconds * 1000));
  const hours = Math.floor(safeMs / 3_600_000);
  const minutes = Math.floor((safeMs % 3_600_000) / 60_000);
  const secs = Math.floor((safeMs % 60_000) / 1000);
  const millis = safeMs % 1000;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")},${String(millis).padStart(3, "0")}`;
}
