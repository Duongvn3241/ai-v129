import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Roi } from '@/components/subtitle/VideoRoiPicker';

export type StudioCue = { id: string; startMs: number; endMs: number; sourceText: string; translatedText?: string; source: 'ocr' | 'stt' | 'import' };
export type StudioProject = {
  schemaVersion: 1;
  video: { uri: string; name: string; size?: number } | null;
  roi: Roi;
  cues: StudioCue[];
  updatedAt: number;
};
const STORAGE_KEY = '@ai-subtitle-studio/project-v1';
export const EMPTY_PROJECT: StudioProject = { schemaVersion: 1, video: null, roi: { x: .08, y: .67, width: .84, height: .27 }, cues: [], updatedAt: 0 };
const validRoi = (r: Roi) => [r.x,r.y,r.width,r.height].every(Number.isFinite) && r.x >= 0 && r.y >= 0 && r.width > 0 && r.height > 0 && r.x + r.width <= 1.00001 && r.y + r.height <= 1.00001;
export function validateStudioProject(value: unknown): StudioProject {
  if (!value || typeof value !== 'object') throw new Error('Dự án không hợp lệ');
  const p = value as StudioProject;
  if (p.schemaVersion !== 1 || !validRoi(p.roi) || !Array.isArray(p.cues)) throw new Error('Định dạng dự án không hỗ trợ');
  if (p.video !== null && (typeof p.video?.uri !== 'string' || typeof p.video?.name !== 'string')) throw new Error('Video không hợp lệ');
  for (const c of p.cues) if (!c || typeof c.id !== 'string' || typeof c.sourceText !== 'string' || !Number.isInteger(c.startMs) || !Number.isInteger(c.endMs) || c.startMs < 0 || c.endMs <= c.startMs) throw new Error('Mốc thời gian phụ đề không hợp lệ');
  return p;
}
export async function loadStudioProject(): Promise<StudioProject> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  if (!raw) return EMPTY_PROJECT;
  try { return validateStudioProject(JSON.parse(raw)); } catch { return EMPTY_PROJECT; }
}
export async function saveStudioProject(p: StudioProject): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(validateStudioProject(p)));
}
export function mergeTranslatedCues(cues: StudioCue[], translated: ReadonlyMap<string,string>): StudioCue[] {
  return cues.map(c => ({ ...c, translatedText: translated.get(c.id) ?? c.translatedText }));
}
export function toSrt(cues: StudioCue[], useTranslated = true): string {
  const time = (ms: number) => { const h = Math.floor(ms / 3600000), m = Math.floor(ms % 3600000 / 60000), s = Math.floor(ms % 60000 / 1000), x = ms % 1000; return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')},${String(x).padStart(3,'0')}`; };
  return cues.map((c,i) => `${i+1}\n${time(c.startMs)} --> ${time(c.endMs)}\n${(useTranslated && c.translatedText) || c.sourceText}\n`).join('\n');
}
