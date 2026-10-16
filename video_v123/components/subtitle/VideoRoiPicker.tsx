import { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, Pressable, StyleSheet, PanResponder } from 'react-native';
import { useVideoPlayer, VideoView } from 'expo-video';

export type Roi = { x: number; y: number; width: number; height: number };
export const DEFAULT_ROI: Roi = { x: 0.08, y: 0.67, width: 0.84, height: 0.27 };
const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n));
const bound = (r: Roi): Roi => {
  const width = clamp(r.width, 0.08, 1), height = clamp(r.height, 0.05, 1);
  return { x: clamp(r.x, 0, 1 - width), y: clamp(r.y, 0, 1 - height), width, height };
};

export function VideoRoiPicker({ uri, roi, onChange }: { uri: string; roi: Roi; onChange: (next: Roi) => void }) {
  const player = useVideoPlayer(uri, p => { p.pause(); });
  const [viewport, setViewport] = useState({ width: 1, height: 1 });
  const [videoSize, setVideoSize] = useState({ width: 16, height: 9 });
  const [current, setCurrent] = useState(0);
  const [duration, setDuration] = useState(0);
  const roiRef = useRef(roi), changeRef = useRef(onChange);
  useEffect(() => { roiRef.current = bound(roi); changeRef.current = onChange; }, [roi, onChange]);
  useEffect(() => {
    let alive = true;
    setVideoSize({ width: 16, height: 9 });
    import('expo-video-thumbnails').then(({ getThumbnailAsync }) => getThumbnailAsync(uri, { time: 0 }))
      .then(frame => { if (alive && frame.width > 0 && frame.height > 0) setVideoSize({ width: frame.width, height: frame.height }); })
      .catch(() => undefined);
    return () => { alive = false; };
  }, [uri]);
  useEffect(() => {
    const sub = player.addListener('timeUpdate', ({ currentTime }) => { setCurrent(currentTime); setDuration(player.duration || 0); });
    player.timeUpdateEventInterval = 0.25;
    return () => sub.remove();
  }, [player]);
  const rect = useMemo(() => {
    const scale = Math.min(viewport.width / videoSize.width, viewport.height / videoSize.height);
    const width = videoSize.width * scale, height = videoSize.height * scale;
    return { x: (viewport.width - width) / 2, y: (viewport.height - height) / 2, width, height };
  }, [viewport, videoSize]);
  const rectRef = useRef(rect); rectRef.current = rect;
  const gesture = useRef<{ start: Roi; resize: boolean } | null>(null);
  const pan = useRef(PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderGrant: (evt) => {
      const r = roiRef.current, box = rectRef.current;
      const x = (evt.nativeEvent.locationX - box.x) / box.width;
      const y = (evt.nativeEvent.locationY - box.y) / box.height;
      if (x < r.x || x > r.x + r.width || y < r.y || y > r.y + r.height) { gesture.current = null; return; }
      gesture.current = { start: { ...r }, resize: x >= r.x + r.width - 0.12 && y >= r.y + r.height - 0.12 };
    },
    onPanResponderMove: (_, g) => {
      if (!gesture.current) return;
      const { start, resize } = gesture.current, box = rectRef.current;
      const dx = g.dx / Math.max(1, box.width), dy = g.dy / Math.max(1, box.height);
      changeRef.current(bound(resize
        ? { ...start, width: clamp(start.width + dx, 0.08, 1 - start.x), height: clamp(start.height + dy, 0.05, 1 - start.y) }
        : { ...start, x: clamp(start.x + dx, 0, 1 - start.width), y: clamp(start.y + dy, 0, 1 - start.height) }));
    },
    onPanResponderRelease: () => { gesture.current = null; },
    onPanResponderTerminate: () => { gesture.current = null; },
  })).current;
  const seek = (offset: number) => { player.pause(); player.currentTime = clamp(player.currentTime + offset, 0, player.duration || Number.MAX_SAFE_INTEGER); };
  return <View style={styles.root}>
    <View style={styles.preview} onLayout={e => setViewport({ width: e.nativeEvent.layout.width, height: e.nativeEvent.layout.height })}>
      <VideoView player={player} style={StyleSheet.absoluteFill} contentFit="contain" nativeControls={false} />
      <View style={StyleSheet.absoluteFill} {...pan.panHandlers}>
        <View pointerEvents="none" style={[styles.roi, { left: rect.x + roi.x * rect.width, top: rect.y + roi.y * rect.height, width: roi.width * rect.width, height: roi.height * rect.height }]}>
          <Text style={styles.label}>VÙNG OCR</Text><View style={styles.handle} />
        </View>
      </View>
    </View>
    <Text style={styles.help}>Video {videoSize.width}×{videoSize.height} · ROI {Math.round(roi.x * 100)}%, {Math.round(roi.y * 100)}%, {Math.round(roi.width * 100)}% × {Math.round(roi.height * 100)}%</Text>
    <View style={styles.controls}>
      <Pressable onPress={() => seek(-2)} style={styles.button}><Text style={styles.buttonText}>−2s</Text></Pressable>
      <Pressable onPress={() => seek(-1 / 30)} style={styles.button}><Text style={styles.buttonText}>◀ Frame*</Text></Pressable>
      <Pressable onPress={() => player.play()} style={styles.button}><Text style={styles.buttonText}>Phát</Text></Pressable>
      <Pressable onPress={() => player.pause()} style={styles.button}><Text style={styles.buttonText}>Dừng</Text></Pressable>
      <Pressable onPress={() => seek(1 / 30)} style={styles.button}><Text style={styles.buttonText}>Frame* ▶</Text></Pressable>
      <Pressable onPress={() => seek(2)} style={styles.button}><Text style={styles.buttonText}>+2s</Text></Pressable>
    </View>
    <Text style={styles.help}>{current.toFixed(1)}s / {duration.toFixed(1)}s · Kéo trong vùng để di chuyển, kéo góc dưới bên phải để đổi kích thước. *Bước frame giả định 30fps; chưa phải điều khiển frame-accurate.</Text>
  </View>;
}
const styles = StyleSheet.create({
  root: { gap: 8 }, preview: { width: '100%', height: 320, backgroundColor: '#000', overflow: 'hidden', borderRadius: 12 },
  roi: { position: 'absolute', borderWidth: 2, borderColor: '#B6FF43', backgroundColor: 'rgba(182,255,67,0.08)' },
  label: { position: 'absolute', top: 0, left: 0, color: '#000', backgroundColor: '#B6FF43', fontSize: 8, fontWeight: '800', padding: 3 },
  handle: { position: 'absolute', right: -3, bottom: -3, width: 22, height: 22, backgroundColor: '#B6FF43', borderRadius: 3 },
  controls: { flexDirection: 'row', gap: 4 }, button: { flex: 1, backgroundColor: '#e6efe8', borderRadius: 7, paddingVertical: 9, alignItems: 'center' },
  buttonText: { fontSize: 9, color: '#183c2b', fontWeight: '700' }, help: { color: '#6b7770', fontSize: 11, lineHeight: 16 },
});
