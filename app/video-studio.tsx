import { VideoRoiPicker, DEFAULT_ROI, type Roi } from '@/components/subtitle/VideoRoiPicker';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { loadStudioProject, saveStudioProject, type StudioProject } from '@/lib/studio-project';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { AppScreen, Notice, PrimaryButton } from '@/components/subtitle/StudioUI';
import { studioColors as C } from '@/constants/studio';

type Video = { uri: string; name: string; size?: number };
type Tab = 'ocr' | 'stt' | 'translate' | 'studio';
type StudioTool = 'subtitle' | 'voice' | 'cover' | 'zoom' | 'audio' | 'export';
const tabs: { id: Tab; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { id: 'ocr', label: 'OCR', icon: 'scan-outline' },
  { id: 'stt', label: 'STT', icon: 'mic-outline' },
  { id: 'translate', label: 'Dịch thuật', icon: 'language-outline' },
  { id: 'studio', label: 'Xưởng Video', icon: 'videocam-outline' },
];
const studioTools: { id: StudioTool; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { id: 'subtitle', label: 'Phụ đề', icon: 'text-outline' },
  { id: 'voice', label: 'Lồng tiếng', icon: 'volume-high-outline' },
  { id: 'cover', label: 'Che chữ', icon: 'eye-off-outline' },
  { id: 'zoom', label: 'Zoom', icon: 'expand-outline' },
  { id: 'audio', label: 'Âm thanh', icon: 'musical-notes-outline' },
  { id: 'export', label: 'Xuất MP4', icon: 'film-outline' },
];
export default function VideoStudioScreen() {
  const [video, setVideo] = useState<Video | null>(null);
  const [roi, setRoi] = useState<Roi>(DEFAULT_ROI);
  const [tab, setTab] = useState<Tab>('ocr');
  const [studioTool, setStudioTool] = useState<StudioTool>('subtitle');
  const [error, setError] = useState('');
  const [restored, setRestored] = useState(false);
  const projectRef = useRef<StudioProject | null>(null);
  useEffect(() => { let alive = true; loadStudioProject().then(p => { if (!alive) return; projectRef.current = p; setVideo(p.video); setRoi(p.roi); setRestored(true); }).catch(() => { if (alive) setRestored(true); }); return () => { alive = false; }; }, []);
  useEffect(() => { if (!restored) return; const timer = setTimeout(() => { const next: StudioProject = { ...(projectRef.current ?? { schemaVersion: 1, cues: [] }), schemaVersion: 1, video, roi, updatedAt: Date.now() }; projectRef.current = next; void saveStudioProject(next).catch(() => setError('Không lưu được dự án tự động')); }, 350); return () => clearTimeout(timer); }, [video, roi, restored]);
  const chooseVideo = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({ type: 'video/*', copyToCacheDirectory: true });
      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        setVideo({ uri: asset.uri, name: asset.name, size: asset.size });
        setRoi(DEFAULT_ROI);
        setError('');
      }
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Không thể mở video'); }
  };
  const openOcr = () => video && router.push({ pathname: '/ocr', params: { uri: video.uri, name: video.name, size: String(video.size ?? ''), roi: JSON.stringify(roi) } } as never);
  const openStt = () => video && router.push({ pathname: '/speech', params: { uri: video.uri, name: video.name } } as never);
  const openRender = () => video && router.push({ pathname: '/video-render', params: { uri: video.uri, name: video.name } } as never);
  const openTranslate = () => router.push('/translate' as never);
  const openEditor = () => router.push('/(tabs)/projects' as never);
  const studioContent = () => {
    switch (studioTool) {
      case 'subtitle': return <><Text style={styles.heading}>Chỉnh sửa phụ đề</Text><Text style={styles.info}>Chỉnh văn bản và mốc thời gian trong trình biên tập dự án hiện có.</Text><PrimaryButton title="Mở trình biên tập" icon="text-outline" onPress={openEditor} /></>;
      case 'voice': return <><Text style={styles.heading}>Lồng tiếng</Text><Text style={styles.info}>Chọn file giọng đọc và chế độ thay hoặc trộn âm thanh gốc trong cấu hình dựng video.</Text><PrimaryButton title="Thiết lập lồng tiếng" icon="volume-high-outline" disabled={!video} onPress={openRender} /></>;
      case 'cover': return <><Text style={styles.heading}>Che phụ đề gốc</Text><Text style={styles.info}>Dùng ROI trên preview làm vùng che. Bộ dựng FFmpeg hỗ trợ che vùng theo cấu hình.</Text><PrimaryButton title="Thiết lập vùng che" icon="eye-off-outline" disabled={!video} onPress={openRender} /></>;
      case 'zoom': return <><Text style={styles.heading}>Zoom và căn chỉnh</Text><Text style={styles.info}>Điều chỉnh độ phóng to và dịch chuyển khung hình trong màn cấu hình xuất video.</Text><PrimaryButton title="Thiết lập zoom" icon="expand-outline" disabled={!video} onPress={openRender} /></>;
      case 'audio': return <><Text style={styles.heading}>Âm thanh</Text><Text style={styles.info}>Chọn âm thanh gốc hoặc giọng lồng tiếng; bộ trộn nhiều track trực tiếp trong preview chưa hoàn thiện.</Text><PrimaryButton title="Cấu hình âm thanh" icon="musical-notes-outline" disabled={!video} onPress={openRender} /></>;
      case 'export': return <><Text style={styles.heading}>Xuất video MP4</Text><Text style={styles.info}>Media3 xuất video gốc trực tiếp. Hiệu ứng phụ đề, che chữ, zoom và lồng tiếng hiện dùng render-job/FFmpeg ngoài APK; chưa thể xuất đầy đủ native.</Text><PrimaryButton title="Mở xuất MP4" icon="film-outline" disabled={!video} onPress={openRender} /></>;
    }
  };
  const tabContent = () => {
    switch (tab) {
      case 'ocr': return <><Text style={styles.heading}>OCR · Trích xuất phụ đề</Text><Text style={styles.info}>Kéo ROI trên preview, thay đổi kích thước bằng bốn góc. Video và ROI được tự động lưu để tiếp tục lần sau.</Text><PrimaryButton title="Bắt đầu OCR" icon="scan-outline" disabled={!video} onPress={openOcr} /></>;
      case 'stt': return <><Text style={styles.heading}>STT · Nhận dạng giọng nói</Text><Text style={styles.info}>Nhận dạng tiếng nói từ cùng video bằng model đã tải; tạo phụ đề có thời gian.</Text><PrimaryButton title="Bắt đầu STT" icon="mic-outline" disabled={!video} onPress={openStt} /></>;
      case 'translate': return <><Text style={styles.heading}>Dịch thuật · Gemini</Text><Text style={styles.info}>Dịch file SRT/VTT, giữ nguyên số câu và mốc thời gian. Cần thiết lập Gemini API key trong Cài đặt.</Text><PrimaryButton title="Mở công cụ dịch thuật" icon="language-outline" onPress={openTranslate} /></>;
      case 'studio': return <><Text style={styles.heading}>Xưởng Video</Text><ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.toolRow}>{studioTools.map(item => <Pressable key={item.id} onPress={() => setStudioTool(item.id)} style={[styles.tool, studioTool === item.id && styles.toolActive]}><Ionicons name={item.icon} size={15} color={studioTool === item.id ? C.canvas : C.ink}/><Text style={[styles.toolText, studioTool === item.id && styles.tabTextActive]}>{item.label}</Text></Pressable>)}</ScrollView>{studioContent()}</>;
    }
  };
  return <AppScreen>
    <View style={styles.page}>
      <View style={styles.top}><Pressable onPress={() => router.back()} style={styles.back}><Ionicons name="arrow-back" color={C.ink} size={19}/><Text style={styles.backText}>Video Studio</Text></Pressable><Pressable onPress={() => void chooseVideo()} style={styles.pick}><Ionicons name="folder-open-outline" size={17} color={C.forest}/><Text style={styles.pickText}>{video ? 'Đổi video' : 'Chọn video'}</Text></Pressable></View>
      <Text numberOfLines={1} style={styles.filename}>{video?.name ?? 'Chưa chọn video · Chọn để bắt đầu'}</Text>
      <View style={styles.previewShell}>{video ? <VideoRoiPicker uri={video.uri} roi={roi} onChange={setRoi} /> : <Pressable onPress={() => void chooseVideo()} style={styles.placeholder}><Ionicons name="videocam-outline" color={C.muted} size={42}/><Text style={styles.info}>Preview video luôn hiển thị tại đây</Text></Pressable>}</View>
      <View style={styles.tabShell}><ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabRow}>{tabs.map(item => <Pressable key={item.id} onPress={() => setTab(item.id)} style={[styles.tab, tab === item.id && styles.tabActive]}><Ionicons name={item.icon} size={16} color={tab === item.id ? C.canvas : C.ink}/><Text style={[styles.tabText, tab === item.id && styles.tabTextActive]}>{item.label}</Text></Pressable>)}</ScrollView></View>
      <ScrollView style={styles.panelScroll} contentContainerStyle={styles.panel} keyboardShouldPersistTaps="handled">{tabContent()}{error ? <Notice tone="amber" icon="alert-circle-outline" title="Lỗi chọn video" body={error}/> : null}<Text style={styles.disclaimer}>Video và ROI tự động lưu trên máy. Các thao tác OCR/STT/Dịch/Render chuyên sâu vẫn mở màn riêng; xuất MP4 đủ hiệu ứng native chưa hoàn thiện.</Text></ScrollView>
    </View>
  </AppScreen>;
}
const styles = StyleSheet.create({
  page: { flex: 1, paddingHorizontal: 12, paddingTop: 8, backgroundColor: C.canvas },
  top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 6 },
  back: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  backText: { fontSize: 17, fontWeight: '900', color: C.ink },
  pick: { flexDirection: 'row', alignItems: 'center', gap: 5, padding: 8, backgroundColor: C.forestSoft, borderRadius: 10 },
  pickText: { color: C.forest, fontWeight: '800', fontSize: 12 },
  filename: { color: C.muted, fontSize: 11, marginBottom: 6 },
  previewShell: { flexShrink: 1, minHeight: 180, maxHeight: 460, overflow: 'hidden' },
  placeholder: { height: 240, backgroundColor: C.surfaceRaised, borderRadius: 14, alignItems: 'center', justifyContent: 'center', gap: 12 },
  tabShell: { marginTop: 10, borderBottomWidth: 1, borderColor: C.line },
  tabRow: { gap: 7, paddingVertical: 7 },
  tab: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 11, paddingVertical: 10, borderRadius: 12, backgroundColor: C.surfaceRaised },
  tabActive: { backgroundColor: C.forest },
  tabText: { color: C.ink, fontSize: 11, fontWeight: '800' },
  tabTextActive: { color: C.canvas },
  panelScroll: { flex: 1 }, panel: { gap: 13, paddingVertical: 16, paddingBottom: 30 },
  heading: { color: C.ink, fontSize: 17, fontWeight: '900' },
  info: { color: C.muted, fontSize: 12, lineHeight: 19 },
  toolRow: { gap: 7, paddingVertical: 8 },
  tool: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 9, borderRadius: 10, backgroundColor: C.surfaceRaised },
  toolActive: { backgroundColor: C.forest },
  toolText: { color: C.ink, fontSize: 11, fontWeight: '700' },
  disclaimer: { color: C.muted, fontSize: 10, lineHeight: 16, marginTop: 12 },
});
