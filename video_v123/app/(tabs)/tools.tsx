import { router } from "expo-router";
import { StyleSheet, Text, View } from "react-native";
import { AppScreen, BrandHeader, Eyebrow, Notice, PageScroll, SectionHeading, ToolRow } from "@/components/subtitle/StudioUI";
import { studioColors as C } from "@/constants/studio";

export default function ToolsScreen() {
  return (
    <AppScreen>
      <PageScroll>
        <BrandHeader rightIcon="help-circle-outline" />
        <View style={{ gap: 8 }}>
          <Eyebrow>BỘ CÔNG CỤ SÁNG TẠO</Eyebrow>
          <Text style={styles.title}>Chọn cách bắt đầu</Text>
          <Text style={styles.subtitle}>Luồng xử lý thật, có nút tải kết quả và quản lý model trên thiết bị.</Text>
        </View>

        <Notice tone="violet" icon="information-circle-outline" title="Cần cài bản native đã build lại" body="Các engine ML Kit và Sherpa ONNX cần Android/iOS native. Model giọng nói tải trong ứng dụng; dịch Gemini cần API key riêng trong Cài đặt." />

        <View style={{ gap: 10 }}>
          <SectionHeading title="Làm video" />
          <ToolRow icon="videocam-outline" iconBg={C.forestSoft} title="Video Studio · OCR + STT" detail="Chọn video một lần, nhận dạng chữ và lời thoại, rồi xuất phụ đề" status="MỚI" onPress={() => router.push("/video-studio" as never)} />
        </View>

        <View style={{ gap: 10 }}>
          <SectionHeading title="Xử lý phụ đề" />
          <ToolRow icon="scan-outline" iconBg={C.forestSoft} title="OCR video → SRT" detail="Nhận chữ trong video bằng ML Kit · tải SRT/VTT" status="NATIVE" onPress={() => router.push("/ocr" as never)} />
          <ToolRow icon="language-outline" iconBg={C.violetSoft} title="Dịch phụ đề" detail="Đọc SRT/VTT · dịch Gemini · giữ timeline · tải SRT" status="GEMINI" onPress={() => router.push("/translate" as never)} />
          <ToolRow icon="create-outline" iconBg={C.amberSoft} title="Sửa & xuất phụ đề" detail="Chỉnh cue đã lưu · tải SRT/VTT/TXT/JSON" status="SẴN SÀNG" onPress={() => router.push({ pathname: "/editor/[id]", params: { id: "kyoto" } } as never)} />
        </View>

        <View style={{ gap: 10 }}>
          <SectionHeading title="Giọng nói offline" />
          <ToolRow icon="mic-outline" iconBg={C.violetSoft} title="STT → SRT" detail="Whisper Tiny đa ngôn ngữ · nhận dạng trên máy" status="TẢI MODEL" onPress={() => router.push("/speech" as never)} />
          <ToolRow icon="volume-high-outline" iconBg={C.redSoft} title="Tạo giọng đọc tiếng Việt" detail="Piper VIVOS offline · xuất và chia sẻ WAV" status="TẢI MODEL" onPress={() => router.push("/speech" as never)} />
          <ToolRow icon="cloud-download-outline" iconBg={C.forestSoft} title="Quản lý model" detail="Tải Whisper (~111 MB) và giọng Việt (~14 MB)" status="MODEL" onPress={() => router.push("/models" as never)} />
        </View>

        <View style={{ gap: 10 }}>
          <SectionHeading title="Đang phát triển" />
          <ToolRow icon="film-outline" iconBg={C.surfaceRaised} title="Xuất MP4 có phụ đề" detail="Burn-in phụ đề và mã hóa video qua bộ xử lý native" status="CẦN TÍCH HỢP" disabled />
          <ToolRow icon="radio-outline" iconBg={C.forestSoft} title="Dịch bubble trực tiếp" detail="Dịch nổi khi đang xem nội dung" status="CẦN TÍCH HỢP" disabled />
        </View>
        <View style={styles.tip}><Text style={styles.tipTitle}>Gợi ý</Text><Text style={styles.tipBody}>Tải model một lần từ mục Quản lý model. OCR video cần phụ đề hiển thị sẵn; STT tạo lời từ âm thanh. Sau khi xử lý, rà lại kết quả trước khi xuất.</Text></View>
      </PageScroll>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 26, lineHeight: 31, letterSpacing: -0.7, fontWeight: "800", color: C.ink },
  subtitle: { fontSize: 13, lineHeight: 19, color: C.muted },
  tip: { padding: 12, borderRadius: 14, backgroundColor: C.surface, borderColor: C.line, borderWidth: 1, gap: 5 },
  tipTitle: { color: C.lime, fontWeight: "800", fontSize: 12 },
  tipBody: { color: C.muted, fontSize: 10, lineHeight: 15 },
});
