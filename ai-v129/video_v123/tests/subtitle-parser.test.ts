import { describe, expect, it } from "vitest";
import { parseSubtitleText, secondsToSrtTime } from "../lib/subtitle-parser";

describe("parseSubtitleText", () => {
  it("đọc SRT, giữ ID/timeline và ghép dòng lời thoại", () => {
    const cues = parseSubtitleText("\uFEFF1\r\n00:00:01,200 --> 00:00:02,400\r\nHello\r\nworld\r\n\r\n42\r\n00:00:02,500 --> 00:00:03,000\r\nGoodbye");
    expect(cues).toHaveLength(2);
    expect(cues[0]).toEqual({ id: "1", start: "00:00:01,200", end: "00:00:02,400", source: "Hello world", translated: "" });
    expect(cues[1].id).toBe("42");
  });

  it("đọc WebVTT, bỏ header/markup và chuyển timestamp mm:ss sang SRT", () => {
    const cues = parseSubtitleText("WEBVTT\n\ncaption-A\n00:01.250 --> 00:03.500 align:start\n<c>Hello</c> there");
    expect(cues[0]).toEqual({ id: "caption-A", start: "00:00:01,250", end: "00:00:03,500", source: "Hello there", translated: "" });
  });

  it("bỏ block không có timecode và báo lỗi nếu không có cue", () => {
    expect(() => parseSubtitleText("chỉ là văn bản thường")).toThrow(/Không tìm thấy cue/);
  });
});

describe("secondsToSrtTime", () => {
  it("chuyển số giây thành timecode SRT có làm tròn mili giây", () => {
    expect(secondsToSrtTime(61.2346)).toBe("00:01:01,235");
  });
});
