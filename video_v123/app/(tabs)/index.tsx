import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { LogoMark, PageScroll } from "@/components/subtitle/StudioUI";
import { VideoFrame } from "@/components/subtitle/VideoFrame";
import { sampleCues, sampleProjects, studioColors as C } from "@/constants/studio";

export default function StudioHomeScreen() {
  const project = sampleProjects[0];
  const cue = sampleCues[0];
  const [playing, setPlaying] = useState(false);
  const tools = [
    { label: "Phụ đề", icon: "text-outline" as const, action: () => router.push({ pathname: "/editor/[id]", params: { id: project.id } } as never) },
    { label: "Làm video", icon: "videocam-outline" as const, action: () => router.push("/video-studio" as never) },
    { label: "OCR", icon: "scan-outline" as const, action: () => router.push("/ocr" as never) },
    { label: "Dịch", icon: "language-outline" as const, action: () => router.push("/translate" as never) },
    { label: "Âm thanh", icon: "musical-notes-outline" as const, action: () => router.push("/speech" as never) },
    { label: "Tải model", icon: "cloud-download-outline" as const, action: () => router.push("/models" as never) },
    { label: "Dự án", icon: "folder-open-outline" as const, action: () => router.navigate("/(tabs)/projects" as never) },
  ];

  return (
    <View style={styles.root}>
      <PageScroll bottom={8}>
        <View style={styles.topBar}>
          <Pressable onPress={() => router.navigate("/(tabs)/projects" as never)} style={styles.projectPicker}>
            <LogoMark size={32} />
            <View style={styles.projectCopy}>
              <Text style={styles.topEyebrow}>ĐANG CHỈNH SỬA · {project.language}</Text>
              <View style={styles.projectNameLine}><Text numberOfLines={1} style={styles.projectName}>{project.title}</Text><Ionicons name="chevron-down" size={13} color={C.muted} /></View>
            </View>
          </Pressable>
          <Pressable accessibilityRole="button" accessibilityLabel="Tải phụ đề" onPress={() => router.push({ pathname: "/editor/[id]", params: { id: project.id, export: "1" } } as never)} style={styles.exportButton}>
            <Ionicons name="download-outline" size={15} color={C.canvas} /><Text style={styles.exportText}>Tải</Text>
          </Pressable>
        </View>

        <View style={styles.previewCard}>
          <View style={styles.previewHeader}>
            <View style={styles.previewMode}><View style={styles.liveDot} /><Text style={styles.previewModeText}>VIDEO · BẢN XEM TRƯỚC</Text></View>
            <Pressable onPress={() => router.push("/ocr" as never)} style={styles.previewAction}><Ionicons name="scan-outline" size={14} color={C.ink} /><Text style={styles.previewActionText}>OCR</Text></Pressable>
          </View>
          <View style={styles.stage}>
            <VideoFrame />
            <View style={styles.stageShade} />
            <Pressable onPress={() => setPlaying((value) => !value)} style={styles.stagePlay}>
              <Ionicons name={playing ? "pause" : "play"} size={19} color={C.white} />
            </Pressable>
            <View style={styles.captionPill}><Text numberOfLines={1} style={styles.captionText}>{cue.translated}</Text></View>
          </View>
          <View style={styles.transport}>
            <Text style={styles.timeText}>00:24</Text>
            <View style={styles.scrubTrack}><View style={styles.scrubFill} /><View style={styles.scrubThumb} /></View>
            <Text style={styles.timeText}>01:48</Text>
            <Pressable onPress={() => router.push({ pathname: "/editor/[id]", params: { id: project.id } } as never)} style={styles.ccButton}><Ionicons name="text-outline" size={16} color={C.ink} /></Pressable>
          </View>
        </View>

        <View style={styles.timelinePanel}>
          <View style={styles.timelineHeader}>
            <Text style={styles.timelineTitle}>TIMELINE</Text>
            <View style={styles.trackCount}><View style={styles.trackCountDot} /><Text style={styles.trackCountText}>3 track · 48 cue</Text></View>
          </View>
          <View style={styles.ruler}><Text style={styles.rulerText}>00:00</Text><View style={styles.rulerLine} /><Text style={styles.rulerText}>00:02</Text><View style={styles.rulerLine} /><Text style={styles.rulerText}>00:04</Text><View style={styles.rulerLine} /><Text style={styles.rulerText}>00:06</Text></View>
          <View style={styles.timelineTracks}>
            <View style={styles.trackRow}><Text style={styles.trackLabel}>V1</Text><View style={styles.trackLane}><View style={styles.videoClip}><Ionicons name="film-outline" size={10} color="#D6FBFE" /><Text numberOfLines={1} style={styles.videoClipText}>kyoto_morning.mp4</Text></View></View></View>
            <View style={styles.trackRow}><Text style={styles.trackLabel}>CC</Text><View style={styles.trackLane}><View style={styles.subtitleClip}><Text numberOfLines={1} style={styles.clipText}>Ánh nắng…</Text></View><View style={styles.subtitleClipAlt}><Text numberOfLines={1} style={styles.clipTextDark}>Cả con phố…</Text></View><View style={styles.subtitleClip}><Text numberOfLines={1} style={styles.clipText}>Lối nhỏ ven sông</Text></View></View></View>
            <View style={styles.trackRow}><Text style={styles.trackLabel}>A1</Text><View style={styles.trackLane}><View style={styles.audioWave}><View style={styles.waveBars}>{[5, 9, 7, 13, 8, 15, 7, 11, 5, 10, 14, 8, 12, 6, 10, 5, 13, 7, 11, 5].map((height, i) => <View key={i} style={[styles.audioBar, { height }]} />)}</View></View></View></View>
            <View pointerEvents="none" style={styles.playhead} />
          </View>
        </View>

        <Pressable onPress={() => router.push({ pathname: "/editor/[id]", params: { id: project.id } } as never)} style={styles.cueStrip}>
          <View style={styles.cueTop}><Text style={styles.cueLabel}>CUE 01</Text><Text style={styles.cueTime}>{cue.start} → {cue.end}</Text><Ionicons name="create-outline" size={14} color={C.muted} /></View>
          <Text numberOfLines={1} style={styles.cueText}>{cue.translated}</Text>
        </Pressable>
      </PageScroll>
      <View style={styles.bottomDock}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.toolRail}>
          {tools.map((tool, index) => <Pressable key={tool.label} onPress={tool.action} style={[styles.toolItem, index === 0 && styles.toolItemActive]}><Ionicons name={tool.icon} size={18} color={index === 0 ? C.lime : C.muted} /><Text style={[styles.toolLabel, index === 0 && styles.toolLabelActive]}>{tool.label}</Text></Pressable>)}
        </ScrollView>
        <View style={styles.demoNote}><Ionicons name="cloud-download-outline" size={12} color={C.forest} /><Text style={styles.demoNoteText}>Video Studio: OCR + STT · tải model để bật nhận dạng lời nói offline</Text></View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.canvas },
  topBar: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 10 },
  projectPicker: { minWidth: 0, flex: 1, flexDirection: "row", alignItems: "center", gap: 8 },
  projectCopy: { flex: 1, gap: 2 },
  topEyebrow: { color: C.muted, fontSize: 8, letterSpacing: 0.85, fontWeight: "800" },
  projectNameLine: { flexDirection: "row", alignItems: "center", gap: 4 },
  projectName: { color: C.ink, fontSize: 13, fontWeight: "800", maxWidth: 188 },
  exportButton: { height: 34, minWidth: 66, paddingHorizontal: 10, borderRadius: 9, backgroundColor: C.red, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 5 },
  exportText: { color: C.canvas, fontSize: 10, fontWeight: "900" },
  previewCard: { padding: 7, borderRadius: 14, backgroundColor: C.surface, borderWidth: 1, borderColor: C.line, gap: 6 },
  previewHeader: { height: 23, flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 2 },
  previewMode: { flexDirection: "row", alignItems: "center", gap: 6 },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: C.red },
  previewModeText: { color: C.muted, fontSize: 8, fontWeight: "800", letterSpacing: 0.6 },
  previewAction: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 7, paddingVertical: 3, backgroundColor: C.surfaceRaised, borderRadius: 6 },
  previewActionText: { color: C.ink, fontSize: 8, fontWeight: "800" },
  stage: { width: "100%", height: 220, borderRadius: 9, backgroundColor: "#22262A", overflow: "hidden", alignItems: "center", justifyContent: "center" },
  stageShade: { ...StyleSheet.absoluteFill, backgroundColor: "rgba(4,7,9,0.12)" },
  stagePlay: { width: 40, height: 40, borderRadius: 20, backgroundColor: "rgba(10,12,14,0.68)", borderWidth: 1, borderColor: "rgba(255,255,255,0.28)", alignItems: "center", justifyContent: "center", paddingLeft: 3 },
  captionPill: { position: "absolute", left: 12, right: 12, bottom: 11, alignSelf: "center", backgroundColor: C.lime, borderRadius: 3, paddingHorizontal: 9, paddingVertical: 5 },
  captionText: { color: C.canvas, fontSize: 11, fontWeight: "900", textAlign: "center" },
  transport: { height: 24, flexDirection: "row", alignItems: "center", gap: 7, paddingHorizontal: 2 },
  timeText: { color: C.muted, fontSize: 9, fontVariant: ["tabular-nums"], fontWeight: "700" },
  scrubTrack: { flex: 1, height: 3, borderRadius: 9, backgroundColor: C.surfaceRaised, justifyContent: "center" },
  scrubFill: { width: "27%", height: 3, borderRadius: 9, backgroundColor: C.lime },
  scrubThumb: { position: "absolute", left: "27%", width: 7, height: 7, borderRadius: 4, backgroundColor: C.white },
  ccButton: { width: 23, height: 22, alignItems: "center", justifyContent: "center", backgroundColor: C.surfaceRaised, borderRadius: 5 },
  timelinePanel: { backgroundColor: C.surface, borderRadius: 12, borderWidth: 1, borderColor: C.line, paddingHorizontal: 10, paddingVertical: 10, gap: 8 },
  timelineHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  timelineTitle: { color: C.ink, fontSize: 10, letterSpacing: 1, fontWeight: "900" },
  trackCount: { flexDirection: "row", alignItems: "center", gap: 5 },
  trackCountDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: C.forest },
  trackCountText: { color: C.muted, fontSize: 8, fontWeight: "700" },
  ruler: { height: 15, flexDirection: "row", alignItems: "center", gap: 6, marginLeft: 24 },
  rulerText: { color: C.muted, fontSize: 8, fontVariant: ["tabular-nums"] },
  rulerLine: { flex: 1, height: 1, backgroundColor: C.line },
  timelineTracks: { gap: 4, position: "relative" },
  trackRow: { height: 25, flexDirection: "row", alignItems: "center", gap: 6 },
  trackLabel: { width: 18, color: C.muted, fontSize: 8, fontWeight: "900", textAlign: "center" },
  trackLane: { flex: 1, height: 21, backgroundColor: "#101214", borderRadius: 4, flexDirection: "row", alignItems: "center", gap: 3, overflow: "hidden" },
  videoClip: { width: "73%", height: 18, borderRadius: 3, backgroundColor: "#147E88", flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 6 },
  videoClipText: { color: "#D6FBFE", fontSize: 8, fontWeight: "700", flex: 1 },
  subtitleClip: { width: "23%", height: 17, borderRadius: 3, backgroundColor: C.lime, justifyContent: "center", paddingHorizontal: 4 },
  subtitleClipAlt: { width: "22%", height: 17, borderRadius: 3, backgroundColor: "#F7A63B", justifyContent: "center", paddingHorizontal: 4 },
  clipText: { color: C.canvas, fontSize: 7, fontWeight: "800" },
  clipTextDark: { color: "#26170A", fontSize: 7, fontWeight: "800" },
  audioWave: { width: "73%", height: 17, borderRadius: 3, backgroundColor: "#26213D", justifyContent: "center", paddingHorizontal: 6 },
  waveBars: { height: 14, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  audioBar: { width: 2, borderRadius: 2, backgroundColor: C.violet },
  playhead: { position: "absolute", left: "53%", top: 0, bottom: 0, width: 1, backgroundColor: C.lime },
  cueStrip: { backgroundColor: C.surface, borderRadius: 10, borderWidth: 1, borderColor: C.line, paddingHorizontal: 10, paddingVertical: 9, gap: 5 },
  cueTop: { flexDirection: "row", alignItems: "center", gap: 8 },
  cueLabel: { color: C.forest, fontSize: 9, fontWeight: "900" },
  cueTime: { flex: 1, color: C.muted, fontSize: 8, fontVariant: ["tabular-nums"] },
  cueText: { color: C.ink, fontSize: 11, fontWeight: "700" },
  bottomDock: { paddingTop: 4, paddingBottom: 1, backgroundColor: C.canvas, borderTopWidth: 1, borderTopColor: C.line },
  toolRail: { alignItems: "center", gap: 4, paddingHorizontal: 10 },
  toolItem: { minWidth: 67, height: 48, alignItems: "center", justifyContent: "center", gap: 3, borderRadius: 9 },
  toolItemActive: { backgroundColor: C.surfaceRaised },
  toolLabel: { color: C.muted, fontSize: 9, fontWeight: "700" },
  toolLabelActive: { color: C.lime },
  demoNote: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 5, paddingTop: 1 },
  demoNoteText: { color: C.muted, fontSize: 8 },
});
