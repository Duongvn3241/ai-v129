import { ImageBackground, Platform, StyleSheet, View } from "react-native";

const PREVIEW_FRAME = "/manus-storage/async-images/pGXVNmAGvZbEIeudjsZtyM/image-1.webp";

export function VideoFrame() {
  return (
    <View style={StyleSheet.absoluteFill}>
      {Platform.OS === "web" ? (
        <ImageBackground source={{ uri: PREVIEW_FRAME }} resizeMode="cover" style={StyleSheet.absoluteFill} />
      ) : (
        <View style={styles.scene}>
          <View style={styles.sky} />
          <View style={styles.sun} />
          <View style={styles.leftRoof} />
          <View style={styles.leftStore} />
          <View style={styles.rightRoof} />
          <View style={styles.rightStore} />
          <View style={styles.lanternOne} />
          <View style={styles.lanternTwo} />
          <View style={styles.lanternThree} />
          <View style={styles.street} />
          <View style={styles.personOne}><View style={styles.head} /><View style={styles.body} /></View>
          <View style={[styles.personOne, styles.personTwo]}><View style={[styles.head, styles.headTwo]} /><View style={[styles.body, styles.bodyTwo]} /></View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  scene: { ...StyleSheet.absoluteFill, overflow: "hidden", backgroundColor: "#263238" },
  sky: { ...StyleSheet.absoluteFill, bottom: "39%", backgroundColor: "#58686B" },
  sun: { position: "absolute", width: 38, height: 38, borderRadius: 20, backgroundColor: "#E9B56D", top: "14%", right: "17%", opacity: 0.86 },
  leftRoof: { position: "absolute", left: "-4%", top: "11%", width: "37%", height: "27%", backgroundColor: "#252526", transform: [{ skewY: "-8deg" }] },
  leftStore: { position: "absolute", left: "1%", top: "29%", width: "30%", height: "38%", backgroundColor: "#46382D" },
  rightRoof: { position: "absolute", right: "-5%", top: "17%", width: "39%", height: "22%", backgroundColor: "#1E2928", transform: [{ skewY: "8deg" }] },
  rightStore: { position: "absolute", right: "0%", top: "34%", width: "31%", height: "34%", backgroundColor: "#3A3330" },
  lanternOne: { position: "absolute", left: "17%", top: "36%", width: 10, height: 23, backgroundColor: "#CB8852", borderRadius: 4 },
  lanternTwo: { position: "absolute", right: "17%", top: "38%", width: 11, height: 25, backgroundColor: "#D19252", borderRadius: 4 },
  lanternThree: { position: "absolute", right: "28%", top: "45%", width: 8, height: 18, backgroundColor: "#B87748", borderRadius: 4 },
  street: { position: "absolute", left: "0%", right: "0%", bottom: "-27%", height: "57%", backgroundColor: "#202426", borderTopLeftRadius: 150, borderTopRightRadius: 150 },
  personOne: { position: "absolute", left: "42%", top: "43%", alignItems: "center" },
  personTwo: { left: "57%", top: "49%", transform: [{ scale: 0.77 }] },
  head: { width: 17, height: 17, borderRadius: 9, backgroundColor: "#D5AA8A", borderWidth: 3, borderColor: "#332B28" },
  headTwo: { backgroundColor: "#E7C2A1" },
  body: { marginTop: -1, width: 24, height: 33, borderRadius: 10, backgroundColor: "#607E78" },
  bodyTwo: { backgroundColor: "#A35E50" },
});
