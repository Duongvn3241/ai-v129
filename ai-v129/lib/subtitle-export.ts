import { Platform } from "react-native";
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import type { SubtitleCue } from "@/constants/studio";
import { buildSubtitleFile, type SubtitleFormat } from "@/lib/subtitle-formats";
export type { SubtitleFormat } from "@/lib/subtitle-formats";

function safeFileName(title: string, format: SubtitleFormat) {
  const slug = title.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-zA-Z0-9_-]+/g, "-").replace(/^-+|-+$/g, "").toLowerCase();
  return `${slug || "phu-de"}.${format.toLowerCase()}`;
}

function mimeType(format: SubtitleFormat) {
  if (format === "VTT") return "text/vtt";
  if (format === "JSON") return "application/json";
  return "text/plain";
}

export type ExportResult = { status: "saved" | "cancelled"; location?: string };

/** Xuất tệp thật: trình duyệt tải trực tiếp; Android chọn thư mục đích; iOS mở bảng chia sẻ. */
export async function exportSubtitleFile(title: string, cues: SubtitleCue[], format: SubtitleFormat): Promise<ExportResult> {
  if (cues.length === 0) throw new Error("Chưa có cue phụ đề để xuất.");
  const fileName = safeFileName(title, format);
  const text = buildSubtitleFile(cues, format);

  if (Platform.OS === "web") {
    const blob = new Blob([text], { type: `${mimeType(format)};charset=utf-8` });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = fileName;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    return { status: "saved", location: "Thư mục tải xuống của trình duyệt" };
  }

  if (Platform.OS === "android" && FileSystem.StorageAccessFramework) {
    const permission = await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync();
    if (!permission.granted) return { status: "cancelled" };
    const fileUri = await FileSystem.StorageAccessFramework.createFileAsync(permission.directoryUri, fileName, mimeType(format));
    await FileSystem.writeAsStringAsync(fileUri, text, { encoding: FileSystem.EncodingType.UTF8 });
    return { status: "saved", location: "Thư mục bạn đã chọn" };
  }

  const baseDirectory = FileSystem.documentDirectory;
  if (!baseDirectory) throw new Error("Thiết bị không cung cấp thư mục lưu tệp.");
  const fileUri = `${baseDirectory}${fileName}`;
  await FileSystem.writeAsStringAsync(fileUri, text, { encoding: FileSystem.EncodingType.UTF8 });
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(fileUri, { mimeType: mimeType(format), UTI: format === "JSON" ? "public.json" : "public.plain-text", dialogTitle: `Chia sẻ ${fileName}` });
  }
  return { status: "saved", location: "Tệp ứng dụng đã tạo" };
}
