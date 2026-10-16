import { VideoRoiPicker, DEFAULT_ROI, type Roi } from "@/components/subtitle/VideoRoiPicker";
import { Ionicons } from "@expo/vector-icons";
import * as DocumentPicker from "expo-document-picker";
import { router } from "expo-router";
import { useState } from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { AppScreen, Eyebrow, Notice, PageScroll, PrimaryButton, SurfaceCard, Tag } from "@/components/subtitle/StudioUI";
import { studioColors as C } from "@/constants/studio";

type PickedVideo = { uri: string; name: string; size?: number };

export default function VideoStudioScreen() {
  const [roi, setRoi] = useState<Roi>(DEFAULT_ROI);
  const [video, setVideo] = useState<PickedVideo | null>(null);
  const [pipeline, setPipeline] = useState<"ocr" | "stt" | "both">("both");
  const [error, setError] = useState("");

  const chooseVideo = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({ type: "video/*", copyToCacheDirectory: true });
      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        setVideo({ uri: asset.uri, name: asset.name, size: asset.size });
        setError("");
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Không mở được video.");
    }
  };

  const openOcr = () => {
    if (!video) return;
    router.push({ pathname: "/ocr", params: { uri: video.uri, name: video.name, size: String(video.size ?? ""), roi: JSON.stringify(roi) } } as never);
  };
  const openStt = () => {
    if (!video) return;
    router.push({ pathname: "/speech", params: { uri: video.uri, name: video.name } } as never);
  };

  return (
    <AppScreen>
      <PageScroll>
        <Pressable onPress={() => router.back()} style={styles.back}><Ionicons name="arrow-back" size={19} color={C.ink} /><Text style={styles.backText}>Quay lại Studio</Text></Pressable>
        <View style={styles.heading}>
          <Eyebrow>VIDEO WORKFLOW · OCR + STT</Eyebrow>
          <Text style={styles.title}>Biến video thành phụ đề.</Text>
          <Text style={styles.subtitle}>Chọn video một lần, chạy nhận chữ trên hình hoặc nhận lời nói từ âm thanh, sau đó rà soát và xuất SRT.</Text>
        </View>

        <View style={styles.hero}>
          <View style={styles.heroTop}><View style={styles.heroIcon}><Ionicons name="film-outline" size={24} color={C.canvas} /></View><Tag tone="lime">VIDEO STUDIO</Tag></View>
          <Text style={styles.heroTitle}>Một video · Hai nguồn văn bản</Text>
          <Text style={styles.heroBody}>OCR đọc phụ đề đang hiện trên màn hình. STT nghe lời thoại từ âm thanh. Dùng cả hai để đối chiếu kết quả.</Text>
          <View style={styles.stepRow}>
            {[{ n: "01", t: "Chọn video" }, { n: "02", t: "Nhận dạng" }, { n: "03", t: "Xuất SRT" }].map((step, i) => <View key={step.n} style={styles.step}><Text style={styles.stepNumber}>{step.n}</Text><Text style={styles.stepText}>{step.t}</Text>{i < 2 ? <View style={styles.stepLine} /> : null}</View>)}
          </View>
        </View>

        <Pressable onPress={() => void chooseVideo()} style={styles.filePicker}>
          <View style={styles.fileIcon}><Ionicons name={video ? "checkmark-circle" : "cloud-upload-outline"} size={24} color={C.forest} /></View>
          <View style={{ flex: 1, gap: 4 }}><Text style={styles.fileTitle}>{video?.name ?? "Chọn video từ điện thoại"}</Text><Text style={styles.fileDetail}>{video ? `${video.size ? `${(video.size / 1024 / 1024).toFixed(1)} MB · ` : ""}Đã sẵn sàng xử lý` : "MP4, MOV và định dạng video được Android hỗ trợ"}</Text></View>
          <Ionicons name="chevron-forward" size={18} color={C.muted} />
        </Pressable>

        {video ? <SurfaceCard style={{ gap: 10 }}><Text style={styles.sectionTitle}>Xem video · chỉnh vùng phụ đề OCR</Text><VideoRoiPicker uri={video.uri} roi={roi} onChange={setRoi} /></SurfaceCard> : null}
        <SurfaceCard style={{ gap: 12 }}>
          <Text style={styles.sectionTitle}>Chọn quy trình</Text>
          {([
            { key: "both", icon: "layers-outline", title: "OCR + STT", desc: "Đọc chữ trong hình và lời thoại từ âm thanh" },
            { key: "ocr", icon: "scan-outline", title: "Chỉ OCR", desc: "Dành cho video đã có phụ đề hiển thị" },
            { key: "stt", icon: "mic-outline", title: "Chỉ STT", desc: "Tạo bản chép lời từ âm thanh video" },
          ] as const).map((item) => {
            const selected = pipeline === item.key;
            return <Pressable key={item.key} onPress={() => setPipeline(item.key)} style={[styles.modeCard, selected && styles.modeSelected]}>
              <View style={[styles.modeIcon, selected && styles.modeIconSelected]}><Ionicons name={item.icon as never} size={19} color={selected ? C.canvas : C.ink} /></View>
              <View style={{ flex: 1, gap: 3 }}><Text style={styles.modeTitle}>{item.title}</Text><Text style={styles.modeDesc}>{item.desc}</Text></View>
              <Ionicons name={selected ? "radio-button-on" : "radio-button-off"} size={19} color={selected ? C.forest : C.muted} />
            </Pressable>;
          })}
        </SurfaceCard>

        <Notice tone="violet" icon="shield-checkmark-outline" title="Xử lý trên thiết bị" body="OCR dùng Google ML Kit; STT dùng Whisper Tiny offline sau khi tải model. Khi chọn OCR + STT, hai bước sẽ mở lần lượt để bạn kiểm tra kết quả và xuất phụ đề riêng." />
        {Platform.OS === "web" ? <Notice tone="amber" icon="phone-portrait-outline" title="Cần APK native" body="OCR và STT cần cài bản Android đã build lại. Preview web chỉ dùng để xem giao diện." /> : null}
        {error ? <Notice tone="amber" icon="alert-circle-outline" title="Không mở được video" body={error} /> : null}

        <PrimaryButton title={!video ? "Chọn video để bắt đầu" : pipeline === "both" ? "Bắt đầu OCR + STT" : pipeline === "ocr" ? "Bắt đầu OCR" : "Bắt đầu STT"} icon="play-circle-outline" disabled={!video} onPress={() => { if (pipeline === "ocr") openOcr(); else if (pipeline === "stt") openStt(); else openOcr(); }} />
        {video && pipeline === "both" ? <Pressable onPress={openStt} style={styles.secondaryAction}><Ionicons name="mic-outline" size={17} color={C.forest} /><Text style={styles.secondaryText}>Sau OCR, mở STT cho cùng video</Text><Ionicons name="arrow-forward" size={16} color={C.forest} /></Pressable> : null}

        {video ? <Pressable onPress={() => router.push({ pathname: "/video-render", params: { uri: video.uri, name: video.name } } as never)} style={styles.secondaryAction}><Ionicons name="videocam-outline" size={20} color={C.forest}/><Text style={styles.secondaryText}>Ghép video · phụ đề · lồng tiếng · zoom · che chữ gốc</Text><Ionicons name="arrow-forward" size={16} color={C.forest}/></Pressable> : null}
        <View style={styles.note}><Ionicons name="information-circle-outline" size={16} color={C.amber} /><Text style={styles.noteText}>Hiện quy trình hỗ trợ nhận dạng và xuất SRT/VTT. Ghép phụ đề cố định vào hình (burn-in) và xuất lại thành MP4 cần tích hợp bộ mã hóa video native riêng; màn này chưa giả lập rằng bước đó đã hoạt động.</Text></View>
      </PageScroll>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  back: { flexDirection: "row", alignItems: "center", gap: 8, alignSelf: "flex-start", paddingVertical: 3 },
  backText: { fontSize: 12, color: C.ink, fontWeight: "700" },
  heading: { gap: 7 },
  title: { fontSize: 27, lineHeight: 32, letterSpacing: -0.7, fontWeight: "900", color: C.ink },
  subtitle: { fontSize: 13, lineHeight: 19, color: C.muted },
  hero: { padding: 15, borderRadius: 18, backgroundColor: C.surfaceRaised, borderWidth: 1, borderColor: C.line, gap: 10 },
  heroTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  heroIcon: { width: 46, height: 46, borderRadius: 15, backgroundColor: C.lime, alignItems: "center", justifyContent: "center" },
  heroTitle: { color: C.ink, fontSize: 18, fontWeight: "900", letterSpacing: -0.3 },
  heroBody: { color: C.muted, fontSize: 11, lineHeight: 17 },
  stepRow: { flexDirection: "row", alignItems: "center", marginTop: 4 },
  step: { flex: 1, flexDirection: "row", alignItems: "center", gap: 5 },
  stepNumber: { color: C.lime, fontSize: 10, fontWeight: "900" },
  stepText: { color: C.ink, fontSize: 9, fontWeight: "700" },
  stepLine: { flex: 1, height: 1, backgroundColor: C.line, marginHorizontal: 5 },
  filePicker: { minHeight: 76, padding: 11, flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: C.surface, borderRadius: 14, borderWidth: 1, borderStyle: "dashed", borderColor: C.forest },
  fileIcon: { width: 44, height: 44, borderRadius: 14, backgroundColor: C.forestSoft, alignItems: "center", justifyContent: "center" },
  fileTitle: { color: C.ink, fontSize: 12, fontWeight: "800" },
  fileDetail: { color: C.muted, fontSize: 10, lineHeight: 15 },
  sectionTitle: { color: C.ink, fontSize: 14, fontWeight: "900" },
  modeCard: { flexDirection: "row", alignItems: "center", gap: 10, padding: 10, borderRadius: 13, borderWidth: 1, borderColor: C.line, backgroundColor: C.surfaceRaised },
  modeSelected: { borderColor: C.forest, backgroundColor: C.forestSoft },
  modeIcon: { width: 38, height: 38, borderRadius: 12, backgroundColor: C.surface, alignItems: "center", justifyContent: "center" },
  modeIconSelected: { backgroundColor: C.lime },
  modeTitle: { color: C.ink, fontSize: 12, fontWeight: "900" },
  modeDesc: { color: C.muted, fontSize: 10, lineHeight: 14 },
  secondaryAction: { minHeight: 42, borderRadius: 12, paddingHorizontal: 12, backgroundColor: C.surface, borderWidth: 1, borderColor: C.line, flexDirection: "row", alignItems: "center", gap: 8 },
  secondaryText: { flex: 1, color: C.forest, fontSize: 11, fontWeight: "800" },
  note: { flexDirection: "row", alignItems: "flex-start", gap: 8, padding: 10, borderRadius: 12, backgroundColor: C.amberSoft },
  noteText: { flex: 1, color: C.muted, fontSize: 10, lineHeight: 15 },
});
