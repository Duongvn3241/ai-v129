import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { AppScreen, Eyebrow, Notice, PageScroll, PrimaryButton, SurfaceCard, Tag } from "@/components/subtitle/StudioUI";
import { VideoFrame } from "@/components/subtitle/VideoFrame";
import { sampleCues, sampleProjects, studioColors as C, type SubtitleCue, type SubtitleProject } from "@/constants/studio";
import { exportSubtitleFile, type SubtitleFormat } from "@/lib/subtitle-export";

const formats = ["SRT", "VTT", "TXT", "JSON"] as const;

export default function EditorScreen() {
  const { id, export: openExport } = useLocalSearchParams<{ id?: string; export?: string }>();
  const [projects, setProjects] = useState<SubtitleProject[]>(sampleProjects);
  const project = useMemo(() => projects.find((item) => item.id === id) ?? sampleProjects[0], [id, projects]);
  const [cues, setCues] = useState<SubtitleCue[]>(sampleCues);
  const [selectedFormat, setSelectedFormat] = useState<(typeof formats)[number]>("SRT");
  const [saved, setSaved] = useState(false);
  const [showExport, setShowExport] = useState(() => openExport === "1");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem("subtitle-studio.projects").then((value) => {
      if (!value) return;
      const parsed: unknown = JSON.parse(value);
      if (Array.isArray(parsed) && parsed.every((item) => item && typeof item.id === "string" && typeof item.title === "string")) {
        setProjects(parsed as SubtitleProject[]);
      }
    }).catch(() => undefined);
  }, []);

  useEffect(() => {
    let active = true;
    AsyncStorage.getItem(`subtitle-studio.cues.${project.id}`)
      .then((value) => {
        if (!active) return;
        if (!value) {
          setSaved(false);
          setCues(sampleProjects.some((item) => item.id === project.id) ? sampleCues : []);
          return;
        }
        const parsed: unknown = JSON.parse(value);
        if (Array.isArray(parsed) && parsed.every((cue) => cue && typeof cue.id === "string" && typeof cue.translated === "string")) {
          setCues(parsed as SubtitleCue[]);
          setSaved(true);
        }
      })
      .catch(() => { if (active) setMessage("Chưa đọc được bản lưu gần nhất; bạn vẫn có thể tiếp tục chỉnh sửa."); });
    return () => { active = false; };
  }, [project.id]);

  const updateCue = (cueId: string, text: string) => {
    setSaved(false);
    setCues((current) => current.map((cue) => cue.id === cueId ? { ...cue, translated: text } : cue));
  };

  const saveCues = async () => {
    setSaving(true);
    try {
      await AsyncStorage.setItem(`subtitle-studio.cues.${project.id}`, JSON.stringify(cues));
      const storedProjects = await AsyncStorage.getItem("subtitle-studio.projects");
      if (storedProjects) {
        const parsed = JSON.parse(storedProjects) as SubtitleProject[];
        const updated = parsed.map((item) => item.id === project.id ? { ...item, cueCount: cues.length, updated: "Vừa cập nhật" } : item);
        await AsyncStorage.setItem("subtitle-studio.projects", JSON.stringify(updated));
      }
      setSaved(true);
      setMessage("Đã lưu các câu phụ đề trên thiết bị này.");
    } catch {
      setSaved(false);
      setMessage("Không lưu được. Hãy kiểm tra dung lượng thiết bị rồi thử lại.");
    } finally {
      setSaving(false);
    }
  };

  const addCue = () => {
    const nextNumber = cues.reduce((max, cue) => Math.max(max, Number.parseInt(cue.id, 10) || 0), 0) + 1;
    const previousEnd = cues[cues.length - 1]?.end ?? "00:00:00,000";
    const match = previousEnd.match(/^(\d{2}):(\d{2}):(\d{2})[,.](\d{3})$/);
    const milliseconds = match ? ((Number(match[1]) * 60 + Number(match[2])) * 60 + Number(match[3])) * 1000 + Number(match[4]) + 2000 : 2000;
    const hours = Math.floor(milliseconds / 3_600_000);
    const minutes = Math.floor((milliseconds % 3_600_000) / 60_000);
    const seconds = Math.floor((milliseconds % 60_000) / 1000);
    const millis = milliseconds % 1000;
    const end = `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")},${String(millis).padStart(3, "0")}`;
    setCues((current) => [...current, { id: String(nextNumber).padStart(2, "0"), start: previousEnd, end, source: "", translated: "" }]);
    setSaved(false);
  };

  const downloadFile = async () => {
    setExporting(true);
    try {
      const result = await exportSubtitleFile(project.title, cues, selectedFormat as SubtitleFormat);
      setShowExport(false);
      setMessage(result.status === "saved"
        ? `Đã tạo tệp ${selectedFormat}${result.location ? ` · ${result.location}` : ""}.`
        : "Đã hủy chọn thư mục lưu; tệp chưa được tạo.");
    } catch (error) {
      setMessage(error instanceof Error ? `Tải tệp chưa thành công: ${error.message}` : "Tải tệp chưa thành công. Vui lòng thử lại.");
    } finally {
      setExporting(false);
    }
  };

  return (
    <AppScreen>
      <PageScroll bottom={34}>
        <View style={styles.topBar}>
          <Pressable onPress={() => router.back()} style={styles.back}><Ionicons name="arrow-back" size={19} color={C.ink} /><Text style={styles.backText}>Dự án</Text></Pressable>
          <Pressable accessibilityRole="button" accessibilityLabel="Tải phụ đề" onPress={() => setShowExport(true)} style={styles.exportIcon}><Ionicons name="download-outline" size={19} color={C.ink} /></Pressable>
        </View>
        <View style={{ gap: 7 }}><Eyebrow>TRÌNH BIÊN TẬP · {project.language}</Eyebrow><Text style={styles.title}>{project.title}</Text><View style={styles.metaLine}><Text style={styles.subtitle}>{cues.length} cue · ID và timeline được giữ nguyên</Text><Tag tone={saved ? "green" : "amber"}>{saved ? "ĐÃ LƯU" : "CHƯA LƯU"}</Tag></View></View>

        <View style={styles.videoPreview}>
          <VideoFrame />
          <View style={styles.videoShade} />
          <View style={styles.videoHeader}><Tag tone="lime">PREVIEW</Tag><Text style={styles.duration}>00:24 / 01:48</Text></View>
          <View style={styles.playButton}><Ionicons name="play" size={19} color={C.white} /></View>
          <Text style={styles.videoCaption}>{cues[0]?.translated}</Text>
          <View style={styles.timeline}><View style={styles.timelineTrack}><View style={styles.timelineProgress} /></View><View style={styles.timelineDot} /></View>
        </View>

        <View style={{ gap: 11 }}>
          <View style={styles.cueHeader}><Text style={styles.sectionTitle}>Lời thoại</Text><Pressable onPress={addCue} style={styles.addCue}><Ionicons name="add-circle-outline" size={15} color={C.forest} /><Text style={styles.addCueText}>Thêm cue</Text></Pressable></View>
          {cues.length === 0 ? <View style={styles.emptyCues}><Ionicons name="chatbox-ellipses-outline" size={22} color={C.muted} /><Text style={styles.emptyCueText}>Dự án chưa có phụ đề. Thêm cue đầu tiên để bắt đầu.</Text></View> : null}
          {cues.map((cue) => (
            <SurfaceCard key={cue.id} style={{ gap: 9 }}>
              <View style={styles.cueTop}><View style={styles.cueNumber}><Text style={styles.cueNumberText}>{cue.id}</Text></View><View style={{ flex: 1 }}><Text style={styles.timecode}>{cue.start} → {cue.end}</Text><Text style={styles.original} numberOfLines={2}>{cue.source}</Text></View><Ionicons name="ellipsis-horizontal" size={16} color={C.muted} /></View>
              <TextInput value={cue.translated} onChangeText={(text) => updateCue(cue.id, text)} multiline textAlignVertical="top" style={styles.cueInput} placeholder="Nhập lời phụ đề" placeholderTextColor="#9CA59D" />
              <View style={styles.cps}><Ionicons name="checkmark-circle-outline" size={14} color={C.forest} /><Text style={styles.cpsText}>Dòng gọn · có thể chỉnh sửa</Text></View>
            </SurfaceCard>
          ))}
        </View>

        {message ? <Notice icon={message.startsWith("Tải tệp chưa") || message.startsWith("Không lưu") ? "alert-circle-outline" : "checkmark-circle-outline"} title="Trạng thái" body={message} /> : null}
        <PrimaryButton title={saving ? "Đang lưu…" : saved ? "Đã lưu · lưu lại thay đổi" : "Lưu chỉnh sửa"} icon={saving ? "sync-outline" : saved ? "checkmark" : "bookmark-outline"} onPress={saveCues} disabled={saving} />
      </PageScroll>

      {showExport ? <View style={styles.modalScrim}><View style={styles.sheet}>
        <View style={styles.sheetHandle} />
        <View style={styles.sheetTitleRow}><View><Eyebrow>XUẤT PHỤ ĐỀ</Eyebrow><Text style={styles.sheetTitle}>Chọn định dạng</Text></View><Pressable onPress={() => setShowExport(false)} style={styles.closeButton}><Ionicons name="close" size={19} color={C.ink} /></Pressable></View>
        <Text style={styles.sheetDescription}>Lựa chọn cách trình bày cue của bạn.</Text>
        {formats.map((format) => <Pressable key={format} onPress={() => setSelectedFormat(format)} style={[styles.formatRow, selectedFormat === format && styles.formatSelected]}><View style={[styles.formatGlyph, selectedFormat === format && { backgroundColor: C.lime }]}><Ionicons name="document-text-outline" size={18} color={C.ink} /></View><View style={{ flex: 1 }}><Text style={styles.formatName}>{format}</Text><Text style={styles.formatDetail}>{format === "SRT" ? "Phổ biến · tương thích rộng" : format === "VTT" ? "Phụ đề cho trình phát web" : format === "TXT" ? "Chỉ nội dung văn bản" : "Dữ liệu có cấu trúc"}</Text></View><Ionicons name={selectedFormat === format ? "radio-button-on" : "radio-button-off"} size={19} color={selectedFormat === format ? C.forest : "#A1AAA2"} /></Pressable>)}
        <PrimaryButton title={exporting ? "Đang tạo tệp…" : `Tải tệp ${selectedFormat}`} icon="download-outline" onPress={downloadFile} disabled={exporting || cues.length === 0} />
      </View></View> : null}
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  topBar: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  back: { flexDirection: "row", alignItems: "center", gap: 8, paddingVertical: 4 },
  backText: { color: C.ink, fontSize: 12, fontWeight: "700" },
  exportIcon: { width: 36, height: 36, borderRadius: 11, backgroundColor: C.surface, borderColor: C.line, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  title: { color: C.ink, fontSize: 23, lineHeight: 28, letterSpacing: -0.5, fontWeight: "800" },
  subtitle: { color: C.muted, fontSize: 10, lineHeight: 15, flex: 1 },
  metaLine: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 },
  videoPreview: { height: 164, backgroundColor: C.surfaceRaised, borderRadius: 13, padding: 10, justifyContent: "space-between", alignItems: "center", overflow: "hidden" },
  videoHeader: { width: "100%", flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  duration: { color: "#DAE3D9", fontSize: 9, fontWeight: "700" },
  playButton: { width: 46, height: 46, borderRadius: 23, backgroundColor: "rgba(255,255,255,0.2)", alignItems: "center", justifyContent: "center", paddingLeft: 3 },
  videoShade: { ...StyleSheet.absoluteFill, backgroundColor: "rgba(0,0,0,0.12)" },
  videoCaption: { maxWidth: "88%", color: C.canvas, fontSize: 11, fontWeight: "900", textAlign: "center", backgroundColor: C.lime, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 3 },
  timeline: { width: "100%", flexDirection: "row", alignItems: "center", gap: 7 },
  timelineTrack: { flex: 1, height: 4, backgroundColor: "rgba(255,255,255,0.25)", borderRadius: 99, overflow: "hidden" },
  timelineProgress: { width: "27%", height: 4, backgroundColor: C.lime },
  timelineDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: C.lime },
  cueHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  addCue: { flexDirection: "row", alignItems: "center", gap: 5, paddingVertical: 6, paddingHorizontal: 8, borderRadius: 9, backgroundColor: C.forestSoft },
  addCueText: { color: C.forest, fontSize: 10, fontWeight: "800" },
  emptyCues: { minHeight: 88, alignItems: "center", justifyContent: "center", gap: 8, paddingHorizontal: 20, borderWidth: 1, borderStyle: "dashed", borderColor: C.line, borderRadius: 13 },
  emptyCueText: { color: C.muted, fontSize: 11, textAlign: "center", lineHeight: 16 },
  sectionTitle: { fontSize: 15, color: C.ink, fontWeight: "800" },
  cueTop: { flexDirection: "row", alignItems: "center", gap: 9 },
  cueNumber: { width: 30, height: 30, borderRadius: 11, backgroundColor: C.forestSoft, alignItems: "center", justifyContent: "center" },
  cueNumberText: { color: C.forest, fontSize: 10, fontWeight: "900" },
  timecode: { color: C.forest, fontSize: 9, fontWeight: "800", marginBottom: 4 },
  original: { color: C.muted, fontSize: 10, lineHeight: 15 },
  cueInput: { minHeight: 50, borderRadius: 10, backgroundColor: C.surfaceRaised, paddingHorizontal: 9, paddingVertical: 8, fontSize: 11, lineHeight: 16, color: C.ink, borderWidth: 1, borderColor: C.line },
  cps: { flexDirection: "row", alignItems: "center", gap: 5 },
  cpsText: { color: C.muted, fontSize: 9 },
  modalScrim: { ...StyleSheet.absoluteFill, backgroundColor: "rgba(0,0,0,0.72)", justifyContent: "flex-end" },
  sheet: { backgroundColor: C.canvas, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 16, paddingBottom: 22, gap: 9 },
  sheetHandle: { width: 32, height: 3, borderRadius: 4, backgroundColor: C.muted, alignSelf: "center", marginBottom: 3 },
  sheetTitleRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  sheetTitle: { color: C.ink, fontSize: 21, fontWeight: "800", marginTop: 4 },
  closeButton: { width: 34, height: 34, borderRadius: 12, backgroundColor: C.surface, alignItems: "center", justifyContent: "center" },
  sheetDescription: { color: C.muted, fontSize: 11, marginBottom: 2 },
  formatRow: { minHeight: 56, backgroundColor: C.surface, borderWidth: 1, borderColor: C.line, borderRadius: 15, flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 11 },
  formatSelected: { borderColor: C.forest, backgroundColor: C.forestSoft },
  formatGlyph: { width: 32, height: 32, borderRadius: 10, backgroundColor: C.surfaceRaised, alignItems: "center", justifyContent: "center" },
  formatName: { color: C.ink, fontSize: 12, fontWeight: "800" },
  formatDetail: { color: C.muted, fontSize: 9, marginTop: 3 },
});
