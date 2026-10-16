import { Ionicons } from "@expo/vector-icons";
import * as SecureStore from "expo-secure-store";
import { useEffect, useState } from "react";
import { Alert, Platform, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { AppScreen, BrandHeader, Eyebrow, Notice, PageScroll, SectionHeading, SurfaceCard, Tag } from "@/components/subtitle/StudioUI";
import { studioColors as C } from "@/constants/studio";

const GEMINI_KEY = "ai-subtitle-studio.gemini-api-key";

export default function SettingsScreen() {
  const [apiKey, setApiKey] = useState("");
  const [hasKey, setHasKey] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (Platform.OS === "web") return;
    SecureStore.getItemAsync(GEMINI_KEY).then((value) => setHasKey(Boolean(value))).catch(() => setHasKey(false));
  }, []);

  const saveKey = async () => {
    if (!apiKey.trim()) {
      Alert.alert("Chưa có API key", "Nhập key Gemini của bạn trước khi lưu.");
      return;
    }
    if (Platform.OS === "web") {
      Alert.alert("Chỉ khả dụng trên ứng dụng", "SecureStore hoạt động trên bản Android/iOS; trang Preview web không lưu API key.");
      return;
    }
    setBusy(true);
    try {
      await SecureStore.setItemAsync(GEMINI_KEY, apiKey.trim());
      setHasKey(true);
      setApiKey("");
      Alert.alert("Đã lưu an toàn", "API key được lưu trong vùng SecureStore của thiết bị này.");
    } catch {
      Alert.alert("Chưa lưu được", "Hãy thử lại trên bản Android đã cài đặt.");
    } finally {
      setBusy(false);
    }
  };

  const removeKey = () => {
    if (Platform.OS === "web") {
      setHasKey(false);
      return;
    }
    Alert.alert("Xóa API key?", "Key đã lưu trên thiết bị sẽ bị gỡ.", [
      { text: "Giữ lại", style: "cancel" },
      { text: "Xóa key", style: "destructive", onPress: async () => { await SecureStore.deleteItemAsync(GEMINI_KEY); setHasKey(false); } },
    ]);
  };

  return (
    <AppScreen>
      <PageScroll>
        <BrandHeader rightIcon="shield-checkmark-outline" />
        <View style={{ gap: 8 }}>
          <Eyebrow>TÙY CHỈNH WORKSPACE</Eyebrow>
          <Text style={styles.title}>Cài đặt</Text>
          <Text style={styles.subtitle}>Quản lý kết nối và thông tin ứng dụng.</Text>
        </View>

        <View style={styles.profileCard}>
          <View style={styles.profileMark}><Ionicons name="sparkles" size={22} color={C.ink} /></View>
          <View style={{ flex: 1, gap: 4 }}><Text style={styles.profileTitle}>AI Subtitle Studio</Text><Text style={styles.profileBody}>Ứng dụng phụ đề · Bản thử nghiệm</Text></View>
          <Tag tone="lime">PREVIEW</Tag>
        </View>

        <View style={{ gap: 11 }}>
          <SectionHeading title="Kết nối AI" />
          <SurfaceCard style={{ gap: 14 }}>
            <View style={styles.keyHeader}>
              <View style={styles.geminiIcon}><Ionicons name="key-outline" size={19} color={C.forest} /></View>
              <View style={{ flex: 1, gap: 4 }}><Text style={styles.cardTitle}>Gemini API key</Text><Text style={styles.cardSubtitle}>Lưu riêng trong SecureStore trên thiết bị</Text></View>
              <Tag tone={hasKey ? "green" : "neutral"}>{hasKey ? "ĐÃ LƯU" : "CHƯA CÓ"}</Tag>
            </View>
            <TextInput value={apiKey} onChangeText={setApiKey} secureTextEntry autoCapitalize="none" autoCorrect={false} placeholder="Dán API key của bạn" placeholderTextColor="#A0A8A1" style={styles.input} />
            <Pressable onPress={saveKey} disabled={busy} style={({ pressed }) => [styles.saveButton, pressed && { opacity: 0.82 }]}>
              <Text style={styles.saveText}>{busy ? "Đang lưu…" : "Lưu khóa an toàn"}</Text><Ionicons name="lock-closed-outline" size={16} color={C.canvas} />
            </Pressable>
            {hasKey ? <Pressable onPress={removeKey} style={{ alignSelf: "flex-start", paddingVertical: 3 }}><Text style={styles.removeText}>Xóa khóa đã lưu</Text></Pressable> : null}
          </SurfaceCard>
          <Notice tone="violet" icon="code-slash-outline" title="Dịch phụ đề bằng Gemini" body="Khi bấm Dịch, cue sẽ được gửi đến Google Gemini bằng key đã lưu. Hãy kiểm tra điều khoản và giới hạn/phí API của tài khoản Google AI Studio." />
        </View>

        <View style={{ gap: 10 }}>
          <SectionHeading title="Thông tin" />
          <View style={styles.settingRow}><View style={[styles.settingIcon, { backgroundColor: C.forestSoft }]}><Ionicons name="language-outline" size={18} color={C.forest} /></View><Text style={styles.settingLabel}>Ngôn ngữ giao diện</Text><Text style={styles.settingValue}>Tiếng Việt</Text></View>
          <View style={styles.settingRow}><View style={[styles.settingIcon, { backgroundColor: C.violetSoft }]}><Ionicons name="phone-portrait-outline" size={18} color={C.violet} /></View><Text style={styles.settingLabel}>Nền tảng</Text><Text style={styles.settingValue}>Expo · Android</Text></View>
        </View>
        <Text style={styles.version}>AI SUBTITLE STUDIO  ·  UI BUILD 01</Text>
      </PageScroll>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 27, letterSpacing: -0.8, fontWeight: "800", color: C.ink },
  subtitle: { color: C.muted, fontSize: 13, lineHeight: 19 },
  profileCard: { borderRadius: 15, padding: 11, backgroundColor: C.surface, borderWidth: 1, borderColor: C.line, flexDirection: "row", alignItems: "center", gap: 9 },
  profileMark: { width: 43, height: 43, borderRadius: 15, alignItems: "center", justifyContent: "center", backgroundColor: C.lime },
  profileTitle: { color: C.ink, fontSize: 12, fontWeight: "800" },
  profileBody: { color: C.muted, fontSize: 9 },
  keyHeader: { flexDirection: "row", alignItems: "center", gap: 11 },
  geminiIcon: { width: 40, height: 40, borderRadius: 14, backgroundColor: C.forestSoft, alignItems: "center", justifyContent: "center" },
  cardTitle: { color: C.ink, fontSize: 13, fontWeight: "800" },
  cardSubtitle: { color: C.muted, fontSize: 10 },
  input: { minHeight: 43, borderRadius: 11, backgroundColor: C.surfaceRaised, borderColor: C.line, borderWidth: 1, paddingHorizontal: 11, fontSize: 12, color: C.ink },
  saveButton: { minHeight: 41, borderRadius: 11, backgroundColor: C.forest, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 },
  saveText: { color: C.canvas, fontSize: 11, fontWeight: "900" },
  removeText: { color: C.red, fontSize: 11, fontWeight: "700" },
  settingRow: { height: 52, borderRadius: 13, paddingHorizontal: 10, backgroundColor: C.surface, borderWidth: 1, borderColor: C.line, flexDirection: "row", gap: 9, alignItems: "center" },
  settingIcon: { width: 37, height: 37, borderRadius: 13, alignItems: "center", justifyContent: "center" },
  settingLabel: { flex: 1, color: C.ink, fontSize: 12, fontWeight: "700" },
  settingValue: { color: C.muted, fontSize: 10, fontWeight: "600" },
  version: { textAlign: "center", color: "#A3AAA4", fontSize: 9, letterSpacing: 1.2, fontWeight: "700", paddingTop: 4 },
});
