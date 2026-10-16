import { Ionicons } from "@expo/vector-icons";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system/legacy";
import * as SecureStore from "expo-secure-store";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Platform, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { AppScreen, Eyebrow, Notice, PageScroll, PrimaryButton, ProgressTrack, SurfaceCard, Tag } from "@/components/subtitle/StudioUI";
import { studioColors as C } from "@/constants/studio";
import { exportSubtitleFile } from "@/lib/subtitle-export";
import { parseSubtitleText } from "@/lib/subtitle-parser";
import { translateCuesWithGemini } from "@/lib/gemini-translate";
import type { SubtitleCue } from "@/constants/studio";

const GEMINI_KEY = "ai-subtitle-studio.gemini-api-key";
type TranslateStatus = "idle" | "processing" | "done" | "error";

export default function TranslateScreen() {
  const [file, setFile] = useState<{ name: string; uri: string } | null>(null);
  const [status, setStatus] = useState<TranslateStatus>("idle");
  const [progress, setProgress] = useState({ completed: 0, total: 0 });
  const [sourceLanguage, setSourceLanguage] = useState("English");
  const [targetLanguage, setTargetLanguage] = useState("Vietnamese");
  const [translatedCues, setTranslatedCues] = useState<SubtitleCue[]>([]);
  const [hasKey, setHasKey] = useState(false);
  const [busyExport, setBusyExport] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (Platform.OS === "web") return;
    SecureStore.getItemAsync(GEMINI_KEY).then((key) => setHasKey(Boolean(key))).catch(() => setHasKey(false));
  }, []);

  const chooseFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({ type: ["application/x-subrip", "text/vtt", "text/plain", "application/octet-stream"], copyToCacheDirectory: true });
      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        setFile({ name: asset.name, uri: asset.uri });
        setStatus("idle"); setTranslatedCues([]); setError(""); setMessage("");
      }
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Không mở được tệp phụ đề."); }
  };

  const readFileText = async (uri: string) => {
    if (Platform.OS === "web") {
      const response = await fetch(uri);
      if (!response.ok) throw new Error("Không đọc được tệp phụ đề đã chọn.");
      return response.text();
    }
    return FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.UTF8 });
  };

  const startTranslation = async () => {
    if (!file) { setStatus("error"); setError("Chọn tệp SRT hoặc VTT trước khi dịch."); return; }
    if (!sourceLanguage.trim() || !targetLanguage.trim()) { setStatus("error"); setError("Nhập ngôn ngữ nguồn và ngôn ngữ đích."); return; }
    if (Platform.OS === "web") { setStatus("error"); setError("API key được lưu trong SecureStore của bản Android/iOS. Dùng app native để dịch an toàn."); return; }
    setStatus("processing"); setProgress({ completed: 0, total: 0 }); setError(""); setMessage(""); setTranslatedCues([]);
    try {
      const apiKey = await SecureStore.getItemAsync(GEMINI_KEY);
      if (!apiKey) throw new Error("Chưa lưu Gemini API key. Mở Cài đặt, lưu key rồi quay lại.");
      const text = await readFileText(file.uri);
      const parsed = parseSubtitleText(text);
      setProgress({ completed: 0, total: parsed.length });
      const translated = await translateCuesWithGemini(apiKey, parsed, sourceLanguage.trim(), targetLanguage.trim(), (completed, total) => setProgress({ completed, total }));
      setTranslatedCues(translated);
      setStatus("done");
      setMessage(`Đã dịch ${translated.length} cue; số cue, ID và timeline được giữ nguyên.`);
    } catch (cause) {
      setStatus("error");
      setError(cause instanceof Error ? cause.message : "Không dịch được tệp.");
    }
  };

  const downloadTranslated = async () => {
    setBusyExport(true); setError("");
    try {
      const result = await exportSubtitleFile(`${file?.name.replace(/\.[^.]+$/, "") || "translated"}-${targetLanguage.toLowerCase()}`, translatedCues, "SRT");
      setMessage(result.status === "saved" ? `Đã tạo SRT đã dịch${result.location ? ` · ${result.location}` : ""}.` : "Đã hủy chọn nơi lưu.");
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Không xuất được tệp."); }
    finally { setBusyExport(false); }
  };

  return (
    <AppScreen>
      <PageScroll>
        <Pressable onPress={() => router.back()} style={styles.back}><Ionicons name="arrow-back" size={19} color={C.ink} /><Text style={styles.backText}>Quay lại</Text></Pressable>
        <View style={{ gap: 8 }}><Eyebrow>DỊCH PHỤ ĐỀ · GEMINI API</Eyebrow><Text style={styles.title}>Giữ nguyên nhịp câu.</Text><Text style={styles.subtitle}>Dịch phụ đề thật, bảo toàn ID và mốc thời gian.</Text></View>

        {Platform.OS === "web" ? <Notice tone="amber" icon="phone-portrait-outline" title="Dịch cần app native" body="API key được lưu bằng SecureStore trên Android/iOS. Hãy dùng bản app đã build để dịch." /> : null}
        {!hasKey && Platform.OS !== "web" ? <Pressable onPress={() => router.push("/(tabs)/settings" as never)}><Notice tone="amber" icon="key-outline" title="Cần Gemini API key" body="Mở Cài đặt và lưu API key của bạn trước khi dịch." /></Pressable> : null}
        <Notice tone="violet" icon="cloud-outline" title="Dữ liệu được gửi tới Gemini" body="Khi bấm dịch, nội dung cue sẽ được gửi trực tiếp đến Google Gemini bằng API key đã lưu trên thiết bị. Phí/lượt dùng phụ thuộc tài khoản Google AI Studio của bạn." />

        <Pressable onPress={chooseFile} style={styles.fileCard}>
          <View style={styles.fileIcon}><Ionicons name="document-text-outline" size={21} color={C.forest} /></View>
          <View style={{ flex: 1, gap: 4 }}><Text style={styles.fileLabel}>TỆP NGUỒN · SRT / VTT</Text><Text style={styles.fileName} numberOfLines={1}>{file?.name ?? "Chọn tệp phụ đề"}</Text></View>
          <Text style={styles.changeText}>{file ? "Đổi tệp" : "Chọn"}</Text>
        </Pressable>

        <SurfaceCard style={{ gap: 14 }}>
          <View style={styles.languageRow}><View style={{ flex: 1, gap: 7 }}><Text style={styles.label}>TỪ NGÔN NGỮ</Text><TextInput value={sourceLanguage} onChangeText={setSourceLanguage} style={styles.languageBox} placeholder="English" placeholderTextColor={C.muted} /></View><View style={styles.swap}><Ionicons name="arrow-forward" size={15} color={C.forest} /></View><View style={{ flex: 1, gap: 7 }}><Text style={styles.label}>SANG</Text><TextInput value={targetLanguage} onChangeText={setTargetLanguage} style={styles.languageBox} placeholder="Vietnamese" placeholderTextColor={C.muted} /></View></View>
          <View style={styles.preserveBox}><Ionicons name="shield-checkmark-outline" size={17} color={C.forest} /><Text style={styles.preserveText}>Giữ nguyên số cue, ID và timeline</Text><Ionicons name="checkmark-circle" size={16} color={C.forest} /></View>
        </SurfaceCard>

        {status === "processing" ? <SurfaceCard style={{ gap: 12 }}><View style={styles.processingRow}><ActivityIndicator color={C.violet} /><Text style={styles.processingText}>Đang dịch cue bằng Gemini…</Text><Text style={styles.percent}>{progress.total ? Math.round(progress.completed / progress.total * 100) : 0}%</Text></View><ProgressTrack value={progress.total ? progress.completed / progress.total : 0} color={C.violet} /><Text style={styles.mutedText}>{progress.completed}/{progress.total} cue đã hoàn thành · gửi theo lô nhỏ để giảm lỗi.</Text></SurfaceCard> : null}
        {status === "error" ? <Notice tone="amber" icon="alert-circle-outline" title="Chưa dịch được" body={error} /> : null}
        {message ? <Text style={styles.message}>{message}</Text> : null}

        {status === "done" ? <View style={{ gap: 11 }}>
          <View style={styles.resultHeading}><Text style={styles.sectionTitle}>Kết quả dịch thật</Text><Tag tone="green">{translatedCues.length} CUE · ID/TIME GIỮ NGUYÊN</Tag></View>
          {translatedCues.slice(0, 5).map((cue) => <SurfaceCard key={`${cue.id}-${cue.start}`} style={{ gap: 7 }}><View style={styles.cueMeta}><Text style={styles.cueId}>#{cue.id}</Text><Text style={styles.timecode}>{cue.start} → {cue.end}</Text></View><Text style={styles.sourceText}>{cue.source}</Text><Text style={styles.translatedText}>{cue.translated}</Text></SurfaceCard>)}
          {translatedCues.length > 5 ? <Text style={styles.mutedText}>Còn {translatedCues.length - 5} cue khác trong tệp xuất.</Text> : null}
          <Pressable onPress={() => void downloadTranslated()} disabled={busyExport} style={styles.downloadButton}><Ionicons name="download-outline" size={16} color={C.canvas} /><Text style={styles.downloadText}>{busyExport ? "Đang tạo SRT…" : "Tải SRT đã dịch"}</Text></Pressable>
        </View> : null}

        <PrimaryButton title={status === "processing" ? "Đang dịch…" : status === "done" ? "Dịch lại" : "Dịch tệp thật"} icon="sparkles" onPress={() => void startTranslation()} disabled={status === "processing" || busyExport || !file} />
        <Pressable onPress={() => router.push("/(tabs)/settings" as never)} style={styles.settingsLink}><Ionicons name="settings-outline" size={15} color={C.forest} /><Text style={styles.settingsText}>{hasKey ? "Quản lý Gemini API key" : "Mở Cài đặt để lưu API key"}</Text><Ionicons name="arrow-forward" size={15} color={C.forest} /></Pressable>
      </PageScroll>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  back: { flexDirection: "row", alignItems: "center", gap: 8, alignSelf: "flex-start", paddingVertical: 3 },
  backText: { fontSize: 12, color: C.ink, fontWeight: "700" },
  title: { fontSize: 26, lineHeight: 31, letterSpacing: -0.7, fontWeight: "800", color: C.ink },
  subtitle: { fontSize: 13, lineHeight: 19, color: C.muted },
  fileCard: { minHeight: 61, paddingHorizontal: 10, paddingVertical: 8, borderRadius: 13, backgroundColor: C.surface, borderColor: C.line, borderWidth: 1, flexDirection: "row", alignItems: "center", gap: 9 },
  fileIcon: { width: 40, height: 40, borderRadius: 14, backgroundColor: C.forestSoft, alignItems: "center", justifyContent: "center" },
  fileLabel: { color: C.muted, fontSize: 8, fontWeight: "900", letterSpacing: 1 },
  fileName: { color: C.ink, fontSize: 11, fontWeight: "700" },
  changeText: { color: C.forest, fontSize: 10, fontWeight: "800" },
  languageRow: { flexDirection: "row", alignItems: "flex-end", gap: 9 },
  label: { color: C.muted, fontSize: 8, fontWeight: "900", letterSpacing: 1 },
  languageBox: { minHeight: 37, borderRadius: 10, borderWidth: 1, borderColor: C.line, backgroundColor: C.surfaceRaised, paddingHorizontal: 8, color: C.ink, fontSize: 11, fontWeight: "700" },
  swap: { width: 28, height: 36, alignItems: "center", justifyContent: "center" },
  preserveBox: { flexDirection: "row", alignItems: "center", gap: 8, padding: 11, borderRadius: 13, backgroundColor: C.forestSoft },
  preserveText: { flex: 1, color: C.forest, fontSize: 10, fontWeight: "700" },
  processingRow: { flexDirection: "row", alignItems: "center", gap: 9 },
  processingText: { flex: 1, color: C.ink, fontSize: 11, fontWeight: "800" },
  percent: { color: C.violet, fontSize: 11, fontWeight: "900" },
  mutedText: { color: C.muted, fontSize: 9, lineHeight: 14 },
  message: { color: C.forest, fontSize: 10, lineHeight: 15, textAlign: "center" },
  resultHeading: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 6 },
  sectionTitle: { color: C.ink, fontSize: 13, fontWeight: "800" },
  cueMeta: { flexDirection: "row", gap: 8, alignItems: "center" },
  cueId: { color: C.forest, fontSize: 9, fontWeight: "900" },
  timecode: { color: C.muted, fontSize: 9, fontWeight: "700" },
  sourceText: { color: C.muted, fontSize: 10, lineHeight: 15 },
  translatedText: { color: C.ink, fontSize: 12, lineHeight: 18, fontWeight: "700" },
  downloadButton: { minHeight: 42, borderRadius: 11, backgroundColor: C.forest, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 7 },
  downloadText: { color: C.canvas, fontSize: 11, fontWeight: "900" },
  settingsLink: { alignSelf: "center", flexDirection: "row", gap: 6, alignItems: "center", padding: 7 },
  settingsText: { color: C.forest, fontSize: 10, fontWeight: "800" },
});
