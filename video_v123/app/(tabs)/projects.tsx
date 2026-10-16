import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { AppScreen, BrandHeader, Eyebrow, PageScroll, ProgressTrack, SectionHeading, Tag } from "@/components/subtitle/StudioUI";
import { sampleProjects, studioColors as C, type SubtitleProject } from "@/constants/studio";

const PROJECTS_KEY = "subtitle-studio.projects";

export default function ProjectsScreen() {
  const [query, setQuery] = useState("");
  const [projects, setProjects] = useState(sampleProjects);
  const [loaded, setLoaded] = useState(false);
  const shown = useMemo(() => projects.filter((project) => project.title.toLowerCase().includes(query.toLowerCase())), [projects, query]);

  useEffect(() => {
    let active = true;
    AsyncStorage.getItem(PROJECTS_KEY).then((value) => {
      if (!active) return;
      if (value) {
        const parsed: unknown = JSON.parse(value);
        if (Array.isArray(parsed) && parsed.every((item) => item && typeof item.id === "string" && typeof item.title === "string")) {
          setProjects(parsed as SubtitleProject[]);
        }
      }
    }).catch(() => undefined).finally(() => { if (active) setLoaded(true); });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (loaded) AsyncStorage.setItem(PROJECTS_KEY, JSON.stringify(projects)).catch(() => undefined);
  }, [loaded, projects]);

  const createProject = async () => {
    const next: SubtitleProject = {
      id: `new-${Date.now()}`,
      title: `Dự án mới ${projects.length + 1}`,
      language: "EN → VI",
      updated: "Vừa tạo · bản xem trước",
      cueCount: 0,
      progress: 0,
      color: "#E6EBDE",
    };
    const updated = [next, ...projects];
    setProjects(updated);
    await AsyncStorage.setItem(PROJECTS_KEY, JSON.stringify(updated)).catch(() => undefined);
    router.push({ pathname: "/editor/[id]", params: { id: next.id } } as never);
  };

  return (
    <AppScreen>
      <PageScroll>
        <BrandHeader rightIcon="add-outline" onRightPress={createProject} />
        <View style={{ gap: 8 }}>
          <Eyebrow>THƯ VIỆN CỦA BẠN</Eyebrow>
          <Text style={styles.title}>Dự án</Text>
          <Text style={styles.subtitle}>Mở lại bản nháp và tiếp tục chỉnh từng câu.</Text>
        </View>

        <View style={styles.searchBox}>
          <Ionicons name="search-outline" size={19} color={C.muted} />
          <TextInput value={query} onChangeText={setQuery} placeholder="Tìm tên dự án" placeholderTextColor="#9AA29C" style={styles.searchInput} />
          <View style={styles.countPill}><Text style={styles.countText}>{projects.length}</Text></View>
        </View>

        <View style={{ gap: 12 }}>
          <SectionHeading title="Gần đây" action="+ Dự án mới" onAction={createProject} />
          {shown.length === 0 ? (
            <View style={styles.empty}>
              <View style={styles.emptyIcon}><Ionicons name="folder-open-outline" size={22} color={C.forest} /></View>
              <Text style={styles.emptyTitle}>Chưa thấy dự án này</Text>
              <Text style={styles.emptyBody}>Thử từ khóa khác hoặc tạo một dự án mẫu mới.</Text>
            </View>
          ) : shown.map((project, index) => (
            <ProjectCard key={project.id} project={project} index={index} onPress={() => router.push({ pathname: "/editor/[id]", params: { id: project.id } } as never)} />
          ))}
        </View>

        <View style={styles.footer}><Ionicons name="information-circle-outline" size={16} color={C.muted} /><Text style={styles.footerText}>Dự án mới và danh sách của bạn được lưu trên thiết bị này.</Text></View>
      </PageScroll>
    </AppScreen>
  );
}

function ProjectCard({ project, index, onPress }: { project: SubtitleProject; index: number; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.card, pressed && { opacity: 0.86 }]}>
      <View style={[styles.cardArt, { backgroundColor: project.color }]}>
        <View style={styles.artGlyph}><Ionicons name={index % 2 ? "musical-notes-outline" : "film-outline"} size={23} color={C.forest} /></View>
        <Text style={styles.cardArtMeta}>{project.language}</Text>
      </View>
      <View style={styles.cardInfo}>
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
          <Text style={styles.cardTitle} numberOfLines={1}>{project.title}</Text>
          {project.progress >= 1 ? <Tag tone="green">XONG</Tag> : <Tag tone="amber">BẢN NHÁP</Tag>}
        </View>
        <Text style={styles.cardMeta}>{project.cueCount} cue  ·  {project.updated}</Text>
        <ProgressTrack value={project.progress} color={project.progress >= 1 ? C.violet : C.forest} />
        <View style={styles.openLine}><Text style={styles.openText}>{project.progress >= 1 ? "Xem bản hoàn tất" : "Tiếp tục chỉnh sửa"}</Text><Ionicons name="arrow-forward" size={15} color={C.forest} /></View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 31, letterSpacing: -1, fontWeight: "800", color: C.ink },
  subtitle: { color: C.muted, fontSize: 13, lineHeight: 19 },
  searchBox: { height: 44, borderRadius: 12, borderWidth: 1, borderColor: C.line, backgroundColor: C.surface, flexDirection: "row", alignItems: "center", paddingHorizontal: 11, gap: 8 },
  searchInput: { flex: 1, fontSize: 13, color: C.ink, paddingVertical: 0 },
  countPill: { minWidth: 22, height: 22, borderRadius: 11, backgroundColor: C.surfaceRaised, alignItems: "center", justifyContent: "center", paddingHorizontal: 6 },
  countText: { color: C.forest, fontSize: 10, fontWeight: "800" },
  card: { backgroundColor: C.surface, borderRadius: 15, borderWidth: 1, borderColor: C.line, padding: 8, gap: 8 },
  cardArt: { height: 70, borderRadius: 10, padding: 8, flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  artGlyph: { width: 32, height: 32, borderRadius: 10, backgroundColor: "rgba(255,255,255,0.09)", alignItems: "center", justifyContent: "center" },
  cardArtMeta: { color: C.forest, fontSize: 9, letterSpacing: 0.9, fontWeight: "900" },
  cardInfo: { gap: 6, paddingHorizontal: 3, paddingBottom: 2 },
  cardTitle: { color: C.ink, fontSize: 13, fontWeight: "800", flex: 1, marginRight: 8 },
  cardMeta: { color: C.muted, fontSize: 10 },
  openLine: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingTop: 1 },
  openText: { fontSize: 11, color: C.forest, fontWeight: "800" },
  empty: { padding: 25, alignItems: "center", gap: 9, backgroundColor: C.surface, borderRadius: 21, borderWidth: 1, borderColor: C.line },
  emptyIcon: { width: 48, height: 48, borderRadius: 17, alignItems: "center", justifyContent: "center", backgroundColor: C.forestSoft },
  emptyTitle: { fontSize: 14, fontWeight: "800", color: C.ink },
  emptyBody: { maxWidth: 230, textAlign: "center", color: C.muted, fontSize: 12, lineHeight: 18 },
  footer: { flexDirection: "row", gap: 7, alignItems: "center", paddingHorizontal: 4 },
  footerText: { flex: 1, color: C.muted, fontSize: 10, lineHeight: 15 },
});
