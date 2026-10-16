import type { SubtitleCue } from "../constants/studio";

export type SubtitleFormat = "SRT" | "VTT" | "TXT" | "JSON";

function timestampForVtt(value: string) {
  return value.replace(",", ".");
}

export function buildSubtitleFile(cues: SubtitleCue[], format: SubtitleFormat): string {
  if (format === "SRT") {
    return cues.map((cue, index) => `${index + 1}\n${cue.start} --> ${cue.end}\n${cue.translated.trim()}\n`).join("\n");
  }
  if (format === "VTT") {
    const blocks = cues.map((cue, index) => `${index + 1}\n${timestampForVtt(cue.start)} --> ${timestampForVtt(cue.end)}\n${cue.translated.trim()}`);
    return `WEBVTT\n\n${blocks.join("\n\n")}\n`;
  }
  if (format === "TXT") {
    return cues.map((cue) => cue.translated.trim()).filter(Boolean).join("\n\n");
  }
  return JSON.stringify(cues.map((cue, index) => ({
    number: index + 1,
    id: cue.id,
    start: cue.start,
    end: cue.end,
    source: cue.source,
    text: cue.translated,
  })), null, 2);
}
