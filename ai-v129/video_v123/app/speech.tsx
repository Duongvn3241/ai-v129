import { Ionicons } from "@expo/vector-icons";
import * as DocumentPicker from "expo-document-picker";
import * as Sharing from "expo-sharing";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { useLocalSearchParams } from "expo-router";
import { ActivityIndicator, Platform, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { AppScreen, Eyebrow, Notice, PageScroll, PrimaryButton, SurfaceCard, Tag } from "@/components/subtitle/StudioUI";
import { studioColors as C } from "@/constants/studio";
import { secondsToSrtTime } from "@/lib/subtitle-parser";
import { exportSubtitleFile } from "@/lib/subtitle-export";
import type { SubtitleCue } from "@/constants/studio";
import { inspectWav, makeSpeechChunk, removeRepeatedPrefix } from "@/lib/stt-chunks";

const STT_ID = "sherpa-onnx-whisper-tiny";
const TTS_ID = "vits-piper-vi_VN-vivos-x_low-int8";
type Mode = "stt" | "tts";

function makeDraftCues(text: string, duration: number): SubtitleCue[] {
  const sentences = text.split(/(?<=[.!?。！？])\s+/u).map((part) => part.trim()).filter(Boolean);
  const parts = sentences.length ? sentences : [text.trim()];
  const totalLength = parts.reduce((sum, part) => sum + Math.max(1, part.length), 0);
  let cursor = 0;
  return parts.map((source, index) => {
    const span = index === parts.length - 1 ? Math.max(0.8, duration - cursor) : Math.max(0.8, duration * source.length / totalLength);
    const cue = { id: String(index + 1).padStart(2, "0"), start: secondsToSrtTime(cursor), end: secondsToSrtTime(cursor + span), source, translated: "" };
    cursor += span;
    return cue;
  });
}

function filePathFromUri(uri: string): string {
  return uri.startsWith("file://") ? decodeURIComponent(uri.slice("file://".length)) : uri;
}

export default function SpeechScreen() {
  const params = useLocalSearchParams<{ uri?: string; name?: string }>();
  const [mode, setMode] = useState<Mode>("stt");
  const [audioFile, setAudioFile] = useState<{ uri: string; name: string } | null>(null);
  const [ttsText, setTtsText] = useState("Xin chào! Đây là giọng đọc tiếng Việt chạy trực tiếp trên thiết bị.");
  const [transcript, setTranscript] = useState("");
  const [cues, setCues] = useState<SubtitleCue[]>([]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [sttStage, setSttStage] = useState("");
  const [sttProgress, setSttProgress] = useState(0);

  useEffect(() => {
    if (!params.uri) return;
    setAudioFile({ uri: params.uri, name: params.name || "video-da-chon.mp4" });
    setMode("stt"); setTranscript(""); setCues([]); setError(""); setMessage("");
  }, [params.uri, params.name]);

  const chooseAudio = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({ type: ["audio/*", "video/*"], copyToCacheDirectory: true });
      if (!result.canceled && result.assets[0]) {
        setAudioFile({ uri: result.assets[0].uri, name: result.assets[0].name });
        setTranscript("");
        setCues([]);
        setError("");
        setMessage("");
      }
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Không mở được tệp."); }
  };

  const runStt = async () => {
    if (Platform.OS === "web") { setError("STT offline cần bản Android/iOS native đã build; trình duyệt không có Sherpa ONNX."); return; }
    if (!audioFile) { setError("Hãy chọn tệp audio hoặc video trước."); return; }
    setBusy(true); setError(""); setSttStage("Kiểm tra model"); setMessage("Đang kiểm tra model và chuyển âm thanh về WAV 16 kHz…");
    let engine: { transcribeFile: (path: string) => Promise<{ text: string }>; destroy: () => Promise<void> } | null = null;
    let wavPath = "";
    let chunkPath = "";
    setSttProgress(0);
    try {
      if (audioFile.uri.startsWith("content://")) throw new Error("Không đọc được URI tệp. Chọn lại tệp để sao chép vào bộ nhớ tạm.");
      const [downloadApi, audioApi, fs] = await Promise.all([
        import("react-native-sherpa-onnx/download"),
        import("react-native-sherpa-onnx/audio"),
        import("@dr.pogodin/react-native-fs"),
      ]);
      const modelPath = await downloadApi.getModelPath(downloadApi.ModelCategory.Stt, STT_ID);
      if (!modelPath) throw new Error("Chưa có Whisper Tiny. Tải model nhận dạng lời nói trước.");
      setSttStage("Kiểm tra dung lượng tệp");
      const sourceStat = await fs.stat(filePathFromUri(audioFile.uri));
      if (Number(sourceStat.size) > 180 * 1024 * 1024) throw new Error("Tệp lớn hơn 180 MB. Hãy thử cắt video/audio ngắn để tránh hết RAM khi nhận dạng.");
      wavPath = `${fs.CachesDirectoryPath}/subtitle-stt-${Date.now()}.wav`;
      setSttStage("Giải mã về WAV 16 kHz");
      await audioApi.convertAudioToWav16k(filePathFromUri(audioFile.uri), wavPath);
      const duration = await inspectWav(wavPath);
      if (!duration) throw new Error("Không tìm thấy âm thanh để nhận dạng.");
      setSttStage("Nạp thư viện STT native");
      const { createSTT } = await import("react-native-sherpa-onnx/stt");
      setMessage("Đang khởi tạo Whisper. Nếu ứng dụng tự đóng ở bước này, hãy lấy logcat để xác định lỗi native.");
      setSttStage("Khởi tạo Whisper Tiny");
      engine = await createSTT({
        modelPath: { type: "file", path: modelPath },
        modelType: "whisper",
        preferInt8: true,
        numThreads: 2,
        modelOptions: { whisper: { language: "auto", task: "transcribe", enableSegmentTimestamps: true } },
      });
      setMessage("Đang nhận dạng lời nói offline trên thiết bị…");
      setSttStage("Nhận dạng lời nói");
      const nextCues: SubtitleCue[] = [];
      const chunks = Math.ceil(duration / 28);
      let previous = "";
      for (let i = 0; i < chunks; i++) {
        const start = i * 28;
        const overlapStart = i ? Math.max(0, start - 1) : start;
        const length = Math.min(duration - overlapStart, i ? 29 : 28);
        chunkPath = `${fs.CachesDirectoryPath}/subtitle-chunk-${Date.now()}-${i}.wav`;
        await makeSpeechChunk(wavPath, overlapStart, length, chunkPath);
        setSttStage(`Nhận dạng đoạn ${i + 1}/${chunks}`);
        const result = await engine.transcribeFile(chunkPath);
        await fs.unlink(chunkPath).catch(() => undefined);
        chunkPath = "";
        const recognized = (result.text || "").trim();
        const clean = i ? removeRepeatedPrefix(previous, recognized) : recognized;
        previous = recognized;
        if (clean) {
          const local = makeDraftCues(clean, Math.min(28, duration - start));
          for (const cue of local) {
            const toSeconds = (time: string) => { const [h, m, rest] = time.split(":"); return Number(h) * 3600 + Number(m) * 60 + Number(rest.replace(",", ".")); };
            nextCues.push({ ...cue, id: String(nextCues.length + 1).padStart(2, "0"), start: secondsToSrtTime(start + toSeconds(cue.start)), end: secondsToSrtTime(start + toSeconds(cue.end)) });
          }
        }
        setSttProgress(Math.round(((i + 1) / chunks) * 100));
      }
      if (!nextCues.length) throw new Error("Không nhận dạng được lời nói trong tệp này.");
      const combined = nextCues.map(cue => cue.source).join(" ");
      setSttStage("Hoàn tất");
      setTranscript(combined);
      setCues(nextCues);
      setMessage(`Đã nhận dạng ${nextCues.length} cue. Mốc câu được ước lượng trong từng đoạn 28 giây; hãy rà soát trong trình biên tập.`);
    } catch (cause) {
      console.error("[SubtitleStudio/STT] stage:", sttStage, cause);
      const reason = cause instanceof Error ? cause.message : "Không nhận dạng được tệp.";
      if (reason.includes("Chưa có Whisper")) setError(`${reason} Mở Quản lý model để tải khoảng 111 MB.`);
      else setError(reason);
      setMessage("");
    } finally {
      if (engine) await engine.destroy().catch((cleanupError) => console.warn("[SubtitleStudio/STT] cleanup:", cleanupError));
      if (chunkPath) import("@dr.pogodin/react-native-fs").then((fs) => fs.unlink(chunkPath).catch(() => undefined)).catch(() => undefined);
      if (wavPath) import("@dr.pogodin/react-native-fs").then((fs) => fs.unlink(wavPath).catch(() => undefined)).catch(() => undefined);
      setBusy(false);
    }
  };

  const exportStt = async (format: "SRT" | "VTT" = "SRT") => {
    try {
      const result = await exportSubtitleFile("nhan-dang-offline", cues, format);
      setMessage(result.status === "saved" ? `Đã tạo tệp ${format} từ kết quả nhận dạng.` : "Đã hủy chọn nơi lưu tệp.");
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Không xuất được SRT."); }
  };

  const runTts = async () => {
    if (Platform.OS === "web") { setError("TTS offline cần bản Android/iOS native đã build; trình duyệt không có Sherpa ONNX."); return; }
    const text = ttsText.trim();
    if (!text) { setError("Nhập nội dung cần đọc trước."); return; }
    if (text.length > 2000) { setError("Giới hạn 2.000 ký tự cho một lượt tạo giọng đọc để tránh đầy bộ nhớ."); return; }
    setBusy(true); setError(""); setMessage("Đang tạo giọng đọc offline…");
    let engine: { generateSpeech: (text: string) => Promise<unknown>; destroy: () => Promise<void> } | null = null;
    try {
      const [downloadApi, ttsApi, fs] = await Promise.all([
        import("react-native-sherpa-onnx/download"),
        import("react-native-sherpa-onnx/tts"),
        import("@dr.pogodin/react-native-fs"),
      ]);
      const modelPath = await downloadApi.getModelPath(downloadApi.ModelCategory.Tts, TTS_ID);
      if (!modelPath) throw new Error("Chưa có model giọng VIVOS tiếng Việt. Tải model giọng đọc trước.");
      const { createTTS, saveAudioToFile } = ttsApi;
      engine = await createTTS({ modelPath: { type: "file", path: modelPath }, modelType: "vits", numThreads: 2 });
      const audio = await engine.generateSpeech(text) as Parameters<typeof saveAudioToFile>[0];
      const outputPath = `${fs.DocumentDirectoryPath}/giong-doc-viet-${Date.now()}.wav`;
      await saveAudioToFile(audio, outputPath);
      if (await Sharing.isAvailableAsync()) await Sharing.shareAsync(`file://${outputPath}`, { mimeType: "audio/wav", dialogTitle: "Lưu hoặc chia sẻ giọng đọc" });
      setMessage("Đã tạo giọng đọc WAV tiếng Việt offline; tệp đã sẵn sàng để lưu/chia sẻ.");
    } catch (cause) {
      const reason = cause instanceof Error ? cause.message : "Không tạo được giọng đọc.";
      setError(reason.includes("Chưa có model") ? `${reason} Mở Quản lý model để tải khoảng 14 MB.` : reason);
      setMessage("");
    } finally {
      if (engine) await engine.destroy().catch((cleanupError) => console.warn("[SubtitleStudio/STT] cleanup:", cleanupError));
      setBusy(false);
    }
  };

  return (
    <AppScreen>
      <PageScroll>
        <Pressable onPress={() => router.back()} style={styles.back}><Ionicons name="arrow-back" size={19} color={C.ink} /><Text style={styles.backText}>Quay lại công cụ</Text></Pressable>
        <View style={{ gap: 8 }}><Eyebrow>GIỌNG NÓI · CHẠY OFFLINE</Eyebrow><Text style={styles.title}>Nhận dạng & giọng đọc.</Text><Text style={styles.subtitle}>Tải model một lần, xử lý nội dung ngay trên thiết bị.</Text></View>
        <View style={styles.modeSwitch}>
          <Pressable onPress={() => { setMode("stt"); setError(""); setMessage(""); }} style={[styles.modeButton, mode === "stt" && styles.modeSelected]}><Ionicons name="mic-outline" size={16} color={mode === "stt" ? C.canvas : C.muted} /><Text style={[styles.modeText, mode === "stt" && styles.modeTextSelected]}>STT → SRT</Text></Pressable>
          <Pressable onPress={() => { setMode("tts"); setError(""); setMessage(""); }} style={[styles.modeButton, mode === "tts" && styles.modeSelected]}><Ionicons name="volume-high-outline" size={16} color={mode === "tts" ? C.canvas : C.muted} /><Text style={[styles.modeText, mode === "tts" && styles.modeTextSelected]}>Giọng đọc TTS</Text></Pressable>
        </View>
        <Notice tone="violet" icon="shield-checkmark-outline" title="Xử lý cục bộ" body="Âm thanh không được tải lên cloud. Cần cài model và build lại ứng dụng native; bước chuyển đổi tệp dùng FFmpeg kèm Sherpa ONNX." />
        {Platform.OS === "web" ? <Notice tone="amber" icon="phone-portrait-outline" title="Preview web chỉ để xem giao diện" body="Cài APK Android đã build lại để dùng model Whisper/VIVOS và xử lý STT/TTS offline." /> : null}
        {mode === "stt" ? <>
          <Pressable onPress={chooseAudio} style={styles.fileCard}><View style={styles.fileIcon}><Ionicons name="folder-open-outline" size={21} color={C.forest} /></View><View style={{ flex: 1, gap: 4 }}><Text style={styles.fileTitle}>{audioFile?.name ?? "Chọn audio hoặc video"}</Text><Text style={styles.fileHint}>MP3, WAV, M4A, MP4 và định dạng FFmpeg hỗ trợ</Text></View><Ionicons name="chevron-forward" size={18} color={C.muted} /></Pressable>
          <PrimaryButton title={busy ? "Đang xử lý offline…" : "Nhận dạng lời nói"} onPress={() => void runStt()} disabled={busy || Platform.OS === "web"} icon="mic" />
          {transcript ? <SurfaceCard style={{ gap: 10 }}><View style={styles.resultHead}><Text style={styles.sectionTitle}>Kết quả nhận dạng</Text><Tag tone="green">{cues.length} CUE</Tag></View><Text style={styles.resultText}>{transcript}</Text><Text style={styles.hint}>Các mốc câu được chia gần đúng theo thời lượng tệp, không phải căn chỉnh từ/câu chính xác.</Text><Pressable onPress={() => void exportStt("SRT")} style={styles.secondary}><Ionicons name="download-outline" size={16} color={C.forest} /><Text style={styles.secondaryText}>Tải SRT</Text></Pressable><Pressable onPress={() => void exportStt("VTT")} style={styles.secondary}><Ionicons name="download-outline" size={16} color={C.forest} /><Text style={styles.secondaryText}>Tải VTT</Text></Pressable></SurfaceCard> : null}
        </> : <>
          <SurfaceCard style={{ gap: 11 }}><View style={styles.resultHead}><Text style={styles.sectionTitle}>Văn bản cần đọc</Text><Tag tone="neutral">TIẾNG VIỆT</Tag></View><TextInput multiline value={ttsText} onChangeText={setTtsText} placeholder="Nhập lời thoại tiếng Việt…" placeholderTextColor={C.muted} style={styles.textInput} maxLength={2000} /><Text style={styles.hint}>{ttsText.length}/2000 ký tự · Giọng VIVOS x_low</Text><PrimaryButton title={busy ? "Đang tạo giọng đọc…" : "Tạo và lưu giọng đọc"} onPress={() => void runTts()} disabled={busy || Platform.OS === "web"} icon="volume-high" /></SurfaceCard>
        </>}
        {busy ? <View style={styles.status}><ActivityIndicator color={C.forest} /><Text style={styles.statusText}>{sttStage && mode === "stt" ? `${sttStage} (${sttProgress}%) · ` : ""}{message}</Text></View> : message ? <Text style={styles.success}>{message}</Text> : null}
        {error ? <Notice tone="amber" icon="alert-circle-outline" title="Chưa xử lý được" body={error} /> : null}
        <Pressable onPress={() => router.push("/models" as never)} style={styles.modelLink}><Ionicons name="cloud-download-outline" size={18} color={C.forest} /><View style={{ flex: 1 }}><Text style={styles.modelLinkTitle}>Quản lý model</Text><Text style={styles.modelLinkHint}>Whisper Tiny (~111 MB) · VIVOS tiếng Việt (~14 MB)</Text></View><Ionicons name="arrow-forward" size={16} color={C.forest} /></Pressable>
      </PageScroll>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  back: { flexDirection: "row", alignItems: "center", gap: 8, alignSelf: "flex-start", paddingVertical: 3 },
  backText: { fontSize: 12, color: C.ink, fontWeight: "700" },
  title: { fontSize: 26, lineHeight: 31, letterSpacing: -0.7, fontWeight: "800", color: C.ink },
  subtitle: { fontSize: 13, lineHeight: 19, color: C.muted },
  modeSwitch: { flexDirection: "row", gap: 7, backgroundColor: C.surface, borderRadius: 13, padding: 5 },
  modeButton: { flex: 1, minHeight: 39, borderRadius: 10, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6 },
  modeSelected: { backgroundColor: C.lime },
  modeText: { color: C.muted, fontSize: 10, fontWeight: "800" },
  modeTextSelected: { color: C.canvas },
  fileCard: { minHeight: 68, padding: 10, borderRadius: 13, backgroundColor: C.surface, borderWidth: 1, borderColor: C.line, flexDirection: "row", alignItems: "center", gap: 9 },
  fileIcon: { width: 41, height: 41, borderRadius: 14, backgroundColor: C.forestSoft, alignItems: "center", justifyContent: "center" },
  fileTitle: { color: C.ink, fontSize: 11, fontWeight: "800" },
  fileHint: { color: C.muted, fontSize: 9, lineHeight: 14 },
  resultHead: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  sectionTitle: { color: C.ink, fontSize: 13, fontWeight: "800" },
  resultText: { color: C.ink, fontSize: 12, lineHeight: 18 },
  hint: { color: C.muted, fontSize: 9, lineHeight: 14 },
  secondary: { minHeight: 37, paddingHorizontal: 11, borderRadius: 10, backgroundColor: C.forestSoft, alignSelf: "flex-start", flexDirection: "row", alignItems: "center", gap: 6 },
  secondaryText: { color: C.forest, fontSize: 10, fontWeight: "800" },
  textInput: { minHeight: 110, borderRadius: 12, borderWidth: 1, borderColor: C.line, backgroundColor: C.surfaceRaised, padding: 10, color: C.ink, fontSize: 12, lineHeight: 18, textAlignVertical: "top" },
  status: { flexDirection: "row", alignItems: "center", gap: 8, padding: 8 },
  statusText: { flex: 1, color: C.muted, fontSize: 10 },
  success: { color: C.forest, textAlign: "center", fontSize: 10, lineHeight: 15 },
  modelLink: { minHeight: 57, padding: 10, borderRadius: 13, backgroundColor: C.surface, borderWidth: 1, borderColor: C.line, flexDirection: "row", alignItems: "center", gap: 9 },
  modelLinkTitle: { color: C.ink, fontSize: 11, fontWeight: "800" },
  modelLinkHint: { color: C.muted, fontSize: 9, marginTop: 3 },
});
