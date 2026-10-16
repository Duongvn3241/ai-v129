import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Alert, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { AppScreen, Eyebrow, Notice, PageScroll, ProgressTrack, SurfaceCard, Tag } from "@/components/subtitle/StudioUI";
import { studioColors as C } from "@/constants/studio";
import type { ModelCategory, ModelMeta } from "react-native-sherpa-onnx/download";

type ModelEntry = { id: string; category: ModelCategory; fallbackName: string; fallbackSize: number; description: string };
const RECOMMENDED: ModelEntry[] = [
  { id: "sherpa-onnx-whisper-tiny", category: "stt" as ModelCategory, fallbackName: "Whisper Tiny đa ngôn ngữ", fallbackSize: 110.8 * 1024 * 1024, description: "Nhận dạng lời nói offline, có hỗ trợ tiếng Việt. Tải khoảng 111 MB." },
  { id: "vits-piper-vi_VN-vivos-x_low-int8", category: "tts" as ModelCategory, fallbackName: "VIVOS x_low · tiếng Việt", fallbackSize: 14 * 1024 * 1024, description: "Tạo giọng đọc tiếng Việt offline, bản int8 gọn nhẹ khoảng 14 MB." },
];

type DownloadState = { id: string; percent: number; phase: string } | null;

function formatSize(bytes: number): string {
  if (!bytes) return "—";
  return bytes >= 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(bytes >= 100 * 1024 * 1024 ? 0 : 1)} MB` : `${Math.round(bytes / 1024)} KB`;
}

export default function ModelsScreen() {
  const [models, setModels] = useState<ModelMeta[]>([]);
  const [installed, setInstalled] = useState<Record<string, boolean>>({});
  const [busy, setBusy] = useState(false);
  const [download, setDownload] = useState<DownloadState>(null);
  const [error, setError] = useState("");

  const refresh = useCallback(async (force = false) => {
    if (Platform.OS === "web") return;
    setBusy(true);
    setError("");
    try {
      const api = await import("react-native-sherpa-onnx/download");
      const [stt, tts] = await Promise.all([
        api.refreshModels(api.ModelCategory.Stt, { forceRefresh: force }),
        api.refreshModels(api.ModelCategory.Tts, { forceRefresh: force }),
      ]);
      const catalog = [...stt, ...tts];
      setModels(catalog);
      const states = await Promise.all(RECOMMENDED.map(async (entry) => [entry.id, await api.isModelDownloaded(entry.category, entry.id)] as const));
      setInstalled(Object.fromEntries(states));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Không tải được danh sách model.");
    } finally {
      setBusy(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => { void refresh(); }, 0);
    return () => clearTimeout(timer);
  }, [refresh]);

  const downloadModel = async (entry: ModelEntry) => {
    if (Platform.OS === "web") return;
    setDownload({ id: entry.id, percent: 0, phase: "Đang tải" });
    setError("");
    try {
      const api = await import("react-native-sherpa-onnx/download");
      await api.downloadModel(entry.category, entry.id, {
        maxRetries: 2,
        onProgress: (progress) => setDownload({ id: entry.id, percent: progress.percent, phase: progress.phase === "extracting" ? "Đang giải nén" : "Đang tải" }),
      });
      setInstalled((current) => ({ ...current, [entry.id]: true }));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Tải model chưa thành công. Kiểm tra kết nối mạng rồi thử lại.");
    } finally {
      setDownload(null);
    }
  };

  const removeModel = (entry: ModelEntry) => {
    Alert.alert("Gỡ model đã tải?", `${entry.fallbackName} sẽ bị xóa khỏi thiết bị. Có thể tải lại sau.`, [
      { text: "Hủy", style: "cancel" },
      { text: "Gỡ model", style: "destructive", onPress: async () => {
        try {
          const api = await import("react-native-sherpa-onnx/download");
          await api.deleteModel(entry.category, entry.id);
          setInstalled((current) => ({ ...current, [entry.id]: false }));
        } catch (cause) { setError(cause instanceof Error ? cause.message : "Không gỡ được model."); }
      } },
    ]);
  };

  const getModel = (id: string) => models.find((model) => model.id === id);

  return (
    <AppScreen>
      <PageScroll>
        <Pressable onPress={() => router.back()} style={styles.back}><Ionicons name="arrow-back" size={19} color={C.ink} /><Text style={styles.backText}>Quay lại công cụ</Text></Pressable>
        <View style={{ gap: 8 }}><Eyebrow>MODEL OFFLINE · SHERPA ONNX</Eyebrow><Text style={styles.title}>Tải model dùng trên máy.</Text><Text style={styles.subtitle}>Model tải một lần, sau đó STT và giọng đọc tiếng Việt chạy offline.</Text></View>

        {Platform.OS === "web" ? <Notice tone="amber" icon="phone-portrait-outline" title="Cần bản Android/iOS native" body="Trình duyệt không thể nạp thư viện ONNX native. Cài app sau khi build lại để tải và chạy model offline." /> : null}
        <Notice tone="violet" icon="shield-checkmark-outline" title="Nguồn model công khai" body="Các model được tải trực tiếp từ release Sherpa ONNX chính thức, kiểm tra SHA-256 khi có checksum. APK mẫu chỉ dùng để tham khảo; không sao chép nhị phân/model riêng từ APK." />

        {RECOMMENDED.map((entry) => {
          const meta = getModel(entry.id);
          const isInstalled = installed[entry.id] ?? false;
          const current = download?.id === entry.id ? download : null;
          return <SurfaceCard key={entry.id} style={{ gap: 12 }}>
            <View style={styles.cardHead}>
              <View style={styles.modelIcon}><Ionicons name={entry.category === "stt" ? "mic-outline" : "volume-high-outline"} size={20} color={C.forest} /></View>
              <View style={{ flex: 1, gap: 4 }}><Text style={styles.modelTitle}>{meta?.displayName ?? entry.fallbackName}</Text><Text style={styles.modelId}>{entry.id}</Text></View>
              <Tag tone={isInstalled ? "green" : "neutral"}>{isInstalled ? "ĐÃ CÀI" : entry.category.toUpperCase()}</Tag>
            </View>
            <Text style={styles.description}>{entry.description}</Text>
            <View style={styles.metaRow}><Text style={styles.metaText}>Kích thước: {formatSize(meta?.bytes ?? entry.fallbackSize)}</Text><Text style={styles.metaText}>{meta?.quantization ? `Định lượng ${meta.quantization}` : "Tải theo yêu cầu"}</Text></View>
            {current ? <View style={{ gap: 7 }}><View style={styles.progressText}><Text style={styles.metaText}>{current.phase === "extracting" ? "Đang giải nén model…" : "Đang tải model…"}</Text><Text style={styles.percent}>{Math.round(current.percent)}%</Text></View><ProgressTrack value={current.percent / 100} /></View> : null}
            <View style={styles.actions}>
              {isInstalled ? <Pressable onPress={() => router.push("/speech" as never)} style={styles.primary}><Ionicons name="play-outline" size={16} color={C.canvas} /><Text style={styles.primaryText}>{entry.category === "stt" ? "Dùng STT" : "Dùng TTS"}</Text></Pressable> : <Pressable disabled={Boolean(download) || busy || Platform.OS === "web"} onPress={() => void downloadModel(entry)} style={[styles.primary, (Boolean(download) || busy || Platform.OS === "web") && { opacity: 0.55 }]}><Ionicons name="download-outline" size={16} color={C.canvas} /><Text style={styles.primaryText}>{download?.id === entry.id ? "Đang tải…" : "Tải model"}</Text></Pressable>}
              {isInstalled ? <Pressable onPress={() => removeModel(entry)} style={styles.remove}><Ionicons name="trash-outline" size={15} color={C.red} /><Text style={styles.removeText}>Gỡ</Text></Pressable> : null}
            </View>
          </SurfaceCard>;
        })}

        {error ? <Notice tone="amber" icon="alert-circle-outline" title="Chưa hoàn tất" body={error} /> : null}
        {busy ? <View style={styles.loading}><ActivityIndicator color={C.forest} /><Text style={styles.metaText}>Đang kiểm tra catalog và model đã tải…</Text></View> : <Pressable onPress={() => void refresh(true)} style={styles.refresh}><Ionicons name="refresh-outline" size={16} color={C.forest} /><Text style={styles.refreshText}>Làm mới danh sách model</Text></Pressable>}
        <Text style={styles.footnote}>Tổng dung lượng model đề xuất khoảng 125 MB. Cần kết nối mạng khi tải lần đầu; sau đó xử lý tiếng nói offline. Model được lưu trong thư mục riêng của ứng dụng.</Text>
      </PageScroll>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  back: { flexDirection: "row", alignItems: "center", gap: 8, alignSelf: "flex-start", paddingVertical: 3 },
  backText: { fontSize: 12, color: C.ink, fontWeight: "700" },
  title: { fontSize: 26, lineHeight: 31, letterSpacing: -0.7, fontWeight: "800", color: C.ink },
  subtitle: { fontSize: 13, lineHeight: 19, color: C.muted },
  cardHead: { flexDirection: "row", alignItems: "center", gap: 10 },
  modelIcon: { width: 40, height: 40, borderRadius: 14, backgroundColor: C.forestSoft, alignItems: "center", justifyContent: "center" },
  modelTitle: { color: C.ink, fontSize: 13, fontWeight: "800" },
  modelId: { color: C.muted, fontSize: 8 },
  description: { color: C.muted, fontSize: 11, lineHeight: 16 },
  metaRow: { flexDirection: "row", justifyContent: "space-between", gap: 8 },
  metaText: { color: C.muted, fontSize: 9 },
  progressText: { flexDirection: "row", justifyContent: "space-between" },
  percent: { color: C.forest, fontSize: 10, fontWeight: "900" },
  actions: { flexDirection: "row", gap: 9 },
  primary: { minHeight: 40, flex: 1, borderRadius: 11, backgroundColor: C.forest, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 7 },
  primaryText: { color: C.canvas, fontSize: 11, fontWeight: "900" },
  remove: { minHeight: 40, paddingHorizontal: 12, borderRadius: 11, backgroundColor: C.redSoft, flexDirection: "row", alignItems: "center", gap: 5 },
  removeText: { color: C.red, fontSize: 10, fontWeight: "800" },
  loading: { flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 8, padding: 7 },
  refresh: { alignSelf: "center", flexDirection: "row", alignItems: "center", gap: 6, padding: 8 },
  refreshText: { color: C.forest, fontSize: 10, fontWeight: "800" },
  footnote: { color: C.muted, fontSize: 9, lineHeight: 14, textAlign: "center", paddingHorizontal: 8 },
});
