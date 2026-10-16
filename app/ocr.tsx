import { VideoRoiPicker, DEFAULT_ROI, type Roi } from "@/components/subtitle/VideoRoiPicker";
import { Ionicons } from "@expo/vector-icons";
import * as DocumentPicker from "expo-document-picker";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { useLocalSearchParams } from "expo-router";
import { ActivityIndicator, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { AppScreen, Eyebrow, Notice, PageScroll, PrimaryButton, ProgressTrack, SurfaceCard, Tag } from "@/components/subtitle/StudioUI";
import { studioColors as C } from "@/constants/studio";
import { exportSubtitleFile } from "@/lib/subtitle-export";
import { recognizeVideoSubtitles } from "@/lib/ocr-video";
import type { SubtitleCue } from "@/constants/studio";

type PickedVideo = { name: string; size?: number; uri: string };
type ScanStatus = "idle" | "processing" | "done" | "error";

export default function OcrScreen() {
  const params = useLocalSearchParams<{ uri?: string; name?: string; size?: string; roi?: string }>();
  const [roi, setRoi] = useState<Roi>(DEFAULT_ROI);
  const [video, setVideo] = useState<PickedVideo | null>(null);
  const [status, setStatus] = useState<ScanStatus>("idle");
  const [progress, setProgress] = useState(0);
  const [frameLabel, setFrameLabel] = useState("");
  const [cues, setCues] = useState<SubtitleCue[]>([]);
  const [reachedLimit, setReachedLimit] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    if (!params.uri) return;
    try { if (params.roi) setRoi(JSON.parse(params.roi)); } catch {}
    setVideo({ uri: params.uri, name: params.name || "video-da-chon.mp4", size: params.size ? Number(params.size) : undefined });
    setStatus("idle"); setProgress(0); setCues([]); setError(""); setMessage(""); setReachedLimit(false);
  }, [params.uri, params.name, params.size, params.roi]);

  const chooseVideo = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({ type: "video/*", copyToCacheDirectory: true });
      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        setVideo({ name: asset.name, size: asset.size, uri: asset.uri });
        setStatus("idle"); setProgress(0); setCues([]); setError(""); setMessage(""); setReachedLimit(false);
      }
    } catch (cause) {
      setStatus("error"); setError(cause instanceof Error ? cause.message : "Không mở được tệp video.");
    }
  };

  const runOcr = async () => {
    if (!video) { setStatus("error"); setError("Chọn video trước khi bắt đầu nhận dạng."); return; }
    setStatus("processing"); setProgress(0); setError(""); setMessage(""); setCues([]);
    try {
      const result = await recognizeVideoSubtitles(video.uri, ({ frame, maxFrames, timestamp }) => {
        setProgress(Math.min(1, frame / maxFrames));
        setFrameLabel(`Khung ${frame}/${maxFrames} · ${timestamp.toFixed(1)} giây`);
      }, roi);
      setCues(result.cues);
      setReachedLimit(result.reachedFrameLimit);
      if (!result.cues.length) throw new Error("Không tìm thấy chữ phụ đề ở nửa dưới video. Thử video rõ nét hơn hoặc kiểm tra video có phụ đề hiển thị sẵn.");
      setStatus("done");
      setMessage(`Đã quét ${result.framesRead} khung hình và nhận dạng ${result.cues.length} cue. Hãy rà lại kết quả trước khi dùng.`);
    } catch (cause) {
      setStatus("error");
      setError(cause instanceof Error ? cause.message : "OCR không xử lý được video này.");
    }
  };

  const exportCues = async (format: "SRT" | "VTT") => {
    if (!cues.length) return;
    setExporting(true); setError(""); setMessage("");
    try {
      const safeTitle = video?.name.replace(/\.[^.]+$/, "") || "phu-de-ocr";
      const result = await exportSubtitleFile(safeTitle, cues, format);
      setMessage(result.status === "saved" ? `Đã tạo tệp ${format}${result.location ? ` · ${result.location}` : ""}.` : "Đã hủy chọn nơi lưu.");
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Không xuất được tệp."); }
    finally { setExporting(false); }
  };

  return (
    <AppScreen>
      <PageScroll>
        <Pressable onPress={() => router.back()} style={styles.back}><Ionicons name="arrow-back" size={19} color={C.ink} /><Text style={styles.backText}>Quay lại Studio</Text></Pressable>
        <View style={{ gap: 8 }}><Eyebrow>OCR VIDEO → SRT</Eyebrow><Text style={styles.title}>Nhận chữ từ khung hình.</Text><Text style={styles.subtitle}>Chọn video có phụ đề hiển thị; app lấy mẫu khung hình và tạo cue SRT.</Text></View>

        <Notice tone="violet" icon="sparkles-outline" title="OCR thật bằng Google ML Kit" body="Trên Android/iOS, model OCR của Google Play Services được tải tự động ở lần dùng đầu. Cần có mạng lần đầu; sau khi model sẵn sàng, nhận dạng chạy trên thiết bị." />
        {Platform.OS === "web" ? <Notice tone="amber" icon="phone-portrait-outline" title="Cần build native" body="ML Kit OCR không chạy trong trình duyệt. Hãy build và cài lại bản Android/iOS từ mã nguồn đã cập nhật." /> : null}

        <Pressable onPress={chooseVideo} style={({ pressed }) => [styles.picker, pressed && { opacity: 0.84 }]}>
          <View style={styles.uploadIcon}><Ionicons name={video ? "film" : "cloud-upload-outline"} size={23} color={C.forest} /></View>
          <View style={{ flex: 1, gap: 4 }}><Text style={styles.pickerTitle}>{video ? video.name : "Chọn video từ thiết bị"}</Text><Text style={styles.pickerBody}>{video ? `${video.size ? `${(video.size / 1024 / 1024).toFixed(1)} MB · ` : ""}Sẵn sàng quét khung hình` : "MP4, MOV hoặc video có sẵn trên máy"}</Text></View>
          <Ionicons name="chevron-forward" size={19} color={C.muted} />
        </Pressable>

        {video ? <SurfaceCard style={{ gap: 10 }}><Text style={styles.sectionTitle}>Xem video và chọn vùng OCR</Text><VideoRoiPicker uri={video.uri} roi={roi} onChange={setRoi} /></SurfaceCard> : null}
        <SurfaceCard style={{ gap: 11 }}>
          <View style={styles.optionHeading}><Text style={styles.sectionTitle}>Thiết lập OCR</Text><Tag tone="neutral">TỰ ĐỘNG</Tag></View>
          <View style={styles.optionRow}><Text style={styles.optionLabel}>Vùng ưu tiên</Text><Text style={styles.optionValueText}>Khung ROI đã chọn</Text></View>
          <View style={styles.optionRow}><Text style={styles.optionLabel}>Khoảng lấy mẫu</Text><Text style={styles.optionValueText}>1,5 giây</Text></View>
          <View style={styles.optionRow}><Text style={styles.optionLabel}>Giới hạn mỗi lượt</Text><Text style={styles.optionValueText}>Tối đa khoảng 10 phút</Text></View>
        </SurfaceCard>

        {status === "processing" ? <SurfaceCard style={{ gap: 12 }}><View style={styles.progressHeader}><ActivityIndicator color={C.forest} /><Text style={styles.processingTitle}>Đang trích frame và nhận dạng…</Text><Text style={styles.percent}>{Math.round(progress * 100)}%</Text></View><ProgressTrack value={progress} /><Text style={styles.mutedText}>{frameLabel || "Đang khởi tạo ML Kit"}</Text></SurfaceCard> : null}
        {status === "error" ? <Notice tone="amber" icon="alert-circle-outline" title="Chưa hoàn tất OCR" body={error} /> : null}
        {status === "done" ? <SurfaceCard style={{ gap: 12 }}>
          <View style={styles.resultHeading}><View style={styles.resultIcon}><Ionicons name="checkmark" size={18} color={C.forest} /></View><View style={{ flex: 1 }}><Text style={styles.resultTitle}>Đã nhận dạng nội dung</Text><Text style={styles.mutedText}>{cues.length} cue · {message}</Text></View><Tag tone="green">OCR</Tag></View>
          {cues.slice(0, 5).map((cue) => <View key={cue.id} style={styles.cuePreview}><Text style={styles.timecode}>{cue.start} → {cue.end}</Text><Text style={styles.cueText}>{cue.source}</Text></View>)}
          {cues.length > 5 ? <Text style={styles.mutedText}>Còn {cues.length - 5} cue khác sẽ được xuất cùng tệp.</Text> : null}
          {reachedLimit ? <Notice tone="amber" icon="time-outline" title="Đã chạm giới hạn lượt quét" body="Đã quét đến giới hạn an toàn khoảng 10 phút. Hãy chia video dài thành các đoạn ngắn hơn để xử lý phần còn lại." /> : null}
          <View style={styles.exportRow}><Pressable onPress={() => void exportCues("SRT")} disabled={exporting} style={styles.downloadButton}><Ionicons name="download-outline" size={16} color={C.canvas} /><Text style={styles.downloadText}>{exporting ? "Đang tạo…" : "Tải SRT"}</Text></Pressable><Pressable onPress={() => void exportCues("VTT")} disabled={exporting} style={styles.secondaryButton}><Text style={styles.secondaryText}>Tải VTT</Text></Pressable></View>
        </SurfaceCard> : null}
        {message && status !== "done" ? <Text style={styles.message}>{message}</Text> : null}

        <PrimaryButton title={status === "processing" ? "Đang nhận dạng…" : "Bắt đầu nhận dạng thật"} onPress={() => void runOcr()} disabled={!video || status === "processing"} icon="scan" />
        <Pressable onPress={() => router.push("/models" as never)} style={styles.modelLink}><Ionicons name="cloud-download-outline" size={17} color={C.forest} /><Text style={styles.modelLinkText}>Tải model giọng nói offline</Text><Ionicons name="arrow-forward" size={16} color={C.forest} /></Pressable>
        <Text style={styles.footnote}>OCR chỉ nhận chữ đang nhìn thấy trong hình; không tách lời thoại từ âm thanh. Kiểm tra lại chính tả và timeline trước khi xuất bản.</Text>
      </PageScroll>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  back: { flexDirection: "row", alignItems: "center", gap: 8, alignSelf: "flex-start", paddingVertical: 3 },
  backText: { fontSize: 12, color: C.ink, fontWeight: "700" },
  title: { fontSize: 26, lineHeight: 31, letterSpacing: -0.7, fontWeight: "800", color: C.ink },
  subtitle: { fontSize: 13, lineHeight: 19, color: C.muted },
  picker: { minHeight: 72, padding: 11, flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: C.surface, borderRadius: 14, borderWidth: 1, borderStyle: "dashed", borderColor: C.line },
  uploadIcon: { width: 44, height: 44, borderRadius: 15, backgroundColor: C.forestSoft, alignItems: "center", justifyContent: "center" },
  pickerTitle: { color: C.ink, fontSize: 12, fontWeight: "800" },
  pickerBody: { color: C.muted, fontSize: 10, lineHeight: 15 },
  optionHeading: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  sectionTitle: { color: C.ink, fontSize: 14, fontWeight: "800" },
  optionRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 6 },
  optionLabel: { color: C.muted, fontSize: 11 },
  optionValueText: { color: C.ink, fontSize: 10, fontWeight: "700" },
  progressHeader: { flexDirection: "row", alignItems: "center", gap: 9 },
  processingTitle: { flex: 1, color: C.ink, fontSize: 11, fontWeight: "800" },
  percent: { color: C.forest, fontSize: 11, fontWeight: "900" },
  mutedText: { color: C.muted, fontSize: 9, lineHeight: 14 },
  resultHeading: { flexDirection: "row", alignItems: "center", gap: 9 },
  resultIcon: { width: 35, height: 35, borderRadius: 13, backgroundColor: C.forestSoft, alignItems: "center", justifyContent: "center" },
  resultTitle: { color: C.ink, fontSize: 12, fontWeight: "800", marginBottom: 3 },
  cuePreview: { backgroundColor: C.surfaceRaised, borderRadius: 11, padding: 10, gap: 5 },
  timecode: { color: C.muted, fontSize: 9, fontWeight: "700" },
  cueText: { color: C.ink, fontSize: 12, lineHeight: 18, fontWeight: "600" },
  exportRow: { flexDirection: "row", gap: 8 },
  downloadButton: { minHeight: 40, borderRadius: 10, paddingHorizontal: 12, backgroundColor: C.forest, flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6 },
  downloadText: { color: C.canvas, fontSize: 11, fontWeight: "900" },
  secondaryButton: { minHeight: 40, borderRadius: 10, paddingHorizontal: 12, backgroundColor: C.forestSoft, alignItems: "center", justifyContent: "center" },
  secondaryText: { color: C.forest, fontSize: 10, fontWeight: "800" },
  message: { color: C.forest, fontSize: 10, textAlign: "center" },
  modelLink: { minHeight: 46, padding: 10, borderRadius: 12, backgroundColor: C.surface, borderColor: C.line, borderWidth: 1, flexDirection: "row", alignItems: "center", gap: 8 },
  modelLinkText: { flex: 1, color: C.forest, fontSize: 10, fontWeight: "800" },
  footnote: { color: C.muted, fontSize: 9, lineHeight: 14, textAlign: "center" },
});
