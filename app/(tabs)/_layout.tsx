import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { HapticTab } from "@/components/haptic-tab";
import { studioColors as C } from "@/constants/studio";

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const bottom = Platform.OS === "web" ? 8 : Math.max(insets.bottom, 6);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarActiveTintColor: C.lime,
        tabBarInactiveTintColor: C.muted,
        tabBarLabelStyle: { fontSize: 9, fontWeight: "700", marginTop: 0 },
        tabBarStyle: {
          height: 51 + bottom,
          paddingTop: 4,
          paddingBottom: bottom,
          backgroundColor: C.canvas,
          borderTopColor: C.line,
          borderTopWidth: 1,
          elevation: 0,
        },
      }}
    >
      <Tabs.Screen name="index" options={{ title: "Studio", tabBarIcon: ({ color, size }) => <Ionicons name="aperture-outline" size={size} color={color} /> }} />
      <Tabs.Screen name="projects" options={{ title: "Dự án", tabBarIcon: ({ color, size }) => <Ionicons name="folder-open-outline" size={size} color={color} /> }} />
      <Tabs.Screen name="tools" options={{ title: "Công cụ", tabBarIcon: ({ color, size }) => <Ionicons name="sparkles-outline" size={size} color={color} /> }} />
      <Tabs.Screen name="settings" options={{ title: "Cài đặt", tabBarIcon: ({ color, size }) => <Ionicons name="options-outline" size={size} color={color} /> }} />
    </Tabs>
  );
}
