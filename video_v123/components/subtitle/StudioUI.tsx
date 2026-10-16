import type { ReactNode } from "react";
import { Ionicons } from "@expo/vector-icons";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { studioColors as C } from "@/constants/studio";

export type IconName = React.ComponentProps<typeof Ionicons>["name"];

export function AppScreen({ children }: { children: ReactNode }) {
  return (
    <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
      <View style={styles.fill}>{children}</View>
    </SafeAreaView>
  );
}

export function PageScroll({ children, bottom = 20 }: { children: ReactNode; bottom?: number }) {
  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={[styles.page, { paddingBottom: bottom }]}
      keyboardShouldPersistTaps="handled"
    >
      {children}
    </ScrollView>
  );
}

export function LogoMark({ size = 36 }: { size?: number }) {
  const barHeights = [11, 20, 14, 25, 16];
  return (
    <View style={[styles.logoMark, { width: size, height: size, borderRadius: size * 0.32 }]}>
      <View style={styles.logoBars}>
        {barHeights.map((height, index) => (
          <View key={index} style={{ width: size * 0.075, height: size * (height / 30), borderRadius: 4, backgroundColor: C.canvas }} />
        ))}
      </View>
    </View>
  );
}

export function BrandHeader({
  rightIcon = "notifications-outline",
  onRightPress,
}: {
  rightIcon?: IconName;
  onRightPress?: () => void;
}) {
  return (
    <View style={styles.brandHeader}>
      <View style={styles.brandLeft}>
        <LogoMark size={34} />
        <View>
          <Text style={styles.brandTitle}>SUBTITLE STUDIO</Text>
          <Text style={styles.brandSub}>MỌI CÂU ĐÚNG NHỊP</Text>
        </View>
      </View>
      <Pressable onPress={onRightPress} hitSlop={8} style={styles.headerButton}>
        <Ionicons name={rightIcon} size={18} color={C.ink} />
      </Pressable>
    </View>
  );
}

export function Eyebrow({ children, color = C.muted }: { children: ReactNode; color?: string }) {
  return <Text style={[styles.eyebrow, { color }]}>{children}</Text>;
}

export function PageHeading({
  eyebrow,
  title,
  subtitle,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
}) {
  return (
    <View style={styles.pageHeading}>
      {eyebrow ? <Eyebrow>{eyebrow}</Eyebrow> : null}
      <Text style={styles.pageTitle}>{title}</Text>
      {subtitle ? <Text style={styles.pageSubtitle}>{subtitle}</Text> : null}
    </View>
  );
}

export function SectionHeading({
  title,
  action,
  onAction,
}: {
  title: string;
  action?: string;
  onAction?: () => void;
}) {
  return (
    <View style={styles.sectionHeading}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {action ? (
        <Pressable onPress={onAction} hitSlop={8}>
          <Text style={styles.sectionAction}>{action}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

export function Tag({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: "neutral" | "lime" | "violet" | "amber" | "red" | "green";
}) {
  const tones = {
    neutral: { bg: C.surfaceRaised, fg: C.muted },
    lime: { bg: C.lime, fg: C.canvas },
    violet: { bg: C.violetSoft, fg: C.violet },
    amber: { bg: C.amberSoft, fg: C.amber },
    red: { bg: C.redSoft, fg: C.red },
    green: { bg: C.forestSoft, fg: C.forest },
  };
  const palette = tones[tone];
  return (
    <View style={[styles.tag, { backgroundColor: palette.bg }]}>
      <Text style={[styles.tagText, { color: palette.fg }]}>{children}</Text>
    </View>
  );
}

export function PrimaryButton({
  title,
  onPress,
  icon = "arrow-forward",
  disabled = false,
  light = false,
}: {
  title: string;
  onPress: () => void;
  icon?: IconName;
  disabled?: boolean;
  light?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.primaryButton,
        light && styles.primaryButtonLight,
        disabled && styles.primaryButtonDisabled,
        pressed && !disabled && styles.pressed,
      ]}
    >
      <Text style={[styles.primaryButtonText, light && styles.primaryButtonTextLight]}>{title}</Text>
      <Ionicons name={icon} size={16} color={C.canvas} />
    </Pressable>
  );
}

export function SurfaceCard({ children, style }: { children: ReactNode; style?: object }) {
  return <View style={[styles.surfaceCard, style]}>{children}</View>;
}

export function ToolRow({
  icon,
  iconBg,
  title,
  detail,
  status,
  onPress,
  disabled = false,
}: {
  icon: IconName;
  iconBg: string;
  title: string;
  detail: string;
  status?: string;
  onPress?: () => void;
  disabled?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [styles.toolRow, pressed && !disabled && styles.rowPressed]}
    >
      <View style={[styles.toolIcon, { backgroundColor: iconBg }]}>
        <Ionicons name={icon} size={18} color={C.ink} />
      </View>
      <View style={styles.toolCopy}>
        <Text style={styles.toolTitle}>{title}</Text>
        <Text style={styles.toolDetail}>{detail}</Text>
      </View>
      {status ? <Text style={styles.toolStatus}>{status}</Text> : null}
      <Ionicons name="chevron-forward" size={15} color={C.muted} />
    </Pressable>
  );
}

export function ProgressTrack({ value, color = C.forest }: { value: number; color?: string }) {
  return (
    <View style={styles.progressTrack}>
      <View style={[styles.progressFill, { width: `${Math.min(Math.max(value, 0), 1) * 100}%`, backgroundColor: color }]} />
    </View>
  );
}

export function Notice({
  icon = "information-circle-outline",
  title,
  body,
  tone = "neutral",
}: {
  icon?: IconName;
  title: string;
  body: string;
  tone?: "neutral" | "amber" | "violet";
}) {
  const bg = tone === "amber" ? C.amberSoft : tone === "violet" ? C.violetSoft : C.surfaceRaised;
  const color = tone === "amber" ? C.amber : tone === "violet" ? C.violet : C.forest;
  return (
    <View style={[styles.notice, { backgroundColor: bg }]}>
      <Ionicons name={icon} size={17} color={color} />
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={[styles.noticeTitle, { color }]}>{title}</Text>
        <Text style={styles.noticeBody}>{body}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.canvas },
  fill: { flex: 1 },
  page: { paddingHorizontal: 16, paddingTop: 5, gap: 14 },
  logoMark: { backgroundColor: C.lime, alignItems: "center", justifyContent: "center" },
  logoBars: { flexDirection: "row", alignItems: "center", gap: 2.5 },
  brandHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  brandLeft: { flexDirection: "row", alignItems: "center", gap: 8 },
  brandTitle: { fontSize: 10, fontWeight: "900", letterSpacing: 1, color: C.ink },
  brandSub: { marginTop: 3, fontSize: 8, fontWeight: "700", letterSpacing: 0.8, color: C.muted },
  headerButton: { width: 36, height: 36, borderRadius: 12, borderColor: C.line, borderWidth: 1, backgroundColor: C.surface, alignItems: "center", justifyContent: "center" },
  eyebrow: { fontSize: 9, fontWeight: "800", letterSpacing: 1.1 },
  pageHeading: { gap: 5 },
  pageTitle: { fontSize: 26, lineHeight: 31, fontWeight: "800", letterSpacing: -0.6, color: C.ink },
  pageSubtitle: { fontSize: 12, lineHeight: 17, color: C.muted },
  sectionHeading: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  sectionTitle: { fontSize: 14, fontWeight: "800", color: C.ink, letterSpacing: -0.15 },
  sectionAction: { fontSize: 10, fontWeight: "700", color: C.forest },
  tag: { alignSelf: "flex-start", borderRadius: 99, paddingHorizontal: 8, paddingVertical: 4 },
  tagText: { fontSize: 8, fontWeight: "900", letterSpacing: 0.5 },
  primaryButton: { minHeight: 42, paddingHorizontal: 14, borderRadius: 12, backgroundColor: C.forest, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 },
  primaryButtonLight: { backgroundColor: C.lime },
  primaryButtonDisabled: { opacity: 0.48 },
  primaryButtonText: { color: C.canvas, fontSize: 12, fontWeight: "900" },
  primaryButtonTextLight: { color: C.canvas },
  pressed: { opacity: 0.82, transform: [{ scale: 0.99 }] },
  surfaceCard: { backgroundColor: C.surface, borderRadius: 15, borderWidth: 1, borderColor: C.line, padding: 12 },
  toolRow: { minHeight: 61, flexDirection: "row", alignItems: "center", gap: 9, paddingHorizontal: 10, paddingVertical: 8, backgroundColor: C.surface, borderWidth: 1, borderColor: C.line, borderRadius: 14 },
  rowPressed: { backgroundColor: C.surfaceRaised },
  toolIcon: { width: 36, height: 36, borderRadius: 11, alignItems: "center", justifyContent: "center" },
  toolCopy: { flex: 1, gap: 3 },
  toolTitle: { fontSize: 12, fontWeight: "800", color: C.ink },
  toolDetail: { fontSize: 10, lineHeight: 14, color: C.muted },
  toolStatus: { fontSize: 8, fontWeight: "800", color: C.muted, maxWidth: 62, textAlign: "right" },
  progressTrack: { height: 4, backgroundColor: C.surfaceRaised, borderRadius: 99, overflow: "hidden" },
  progressFill: { height: "100%", borderRadius: 99 },
  notice: { flexDirection: "row", alignItems: "flex-start", gap: 8, padding: 10, borderRadius: 12 },
  noticeTitle: { fontSize: 10, fontWeight: "800" },
  noticeBody: { fontSize: 9, lineHeight: 14, color: C.muted },
});
