import { describe, expect, it } from "vitest";
import { buildSubtitleFile } from "../lib/subtitle-formats";
import type { SubtitleCue } from "../constants/studio";

const cues: SubtitleCue[] = [
  { id: "01", start: "00:00:02,120", end: "00:00:04,380", source: "Hello", translated: "Xin chào." },
  { id: "02", start: "00:00:04,620", end: "00:00:06,900", source: "Goodbye", translated: "Tạm biệt." },
];

describe("buildSubtitleFile", () => {
  it("xuất SRT đúng số thứ tự, thời gian và nội dung", () => {
    expect(buildSubtitleFile(cues, "SRT")).toBe(
      "1\n00:00:02,120 --> 00:00:04,380\nXin chào.\n\n2\n00:00:04,620 --> 00:00:06,900\nTạm biệt.\n",
    );
  });

  it("xuất WebVTT với header và dấu chấm mili giây", () => {
    expect(buildSubtitleFile(cues, "VTT")).toBe(
      "WEBVTT\n\n1\n00:00:02.120 --> 00:00:04.380\nXin chào.\n\n2\n00:00:04.620 --> 00:00:06.900\nTạm biệt.\n",
    );
  });

  it("xuất TXT chỉ chứa lời phụ đề", () => {
    expect(buildSubtitleFile(cues, "TXT")).toBe("Xin chào.\n\nTạm biệt.");
  });

  it("xuất JSON có số thứ tự, ID, nội dung nguồn và timeline", () => {
    const result = JSON.parse(buildSubtitleFile(cues, "JSON"));
    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({ number: 1, id: "01", start: cues[0].start, end: cues[0].end, source: "Hello", text: "Xin chào." });
  });
});
