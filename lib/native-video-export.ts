import { Platform } from 'react-native';
import { requireNativeModule } from 'expo-modules-core';
import * as FileSystem from 'expo-file-system/legacy';
import type { RenderJob } from './video-render-job';

type VideoExportNative = { exportBasicVideo(source: string, destination: string): Promise<string> };

/** Only the unmodified video + original audio is supported by the current Media3 native exporter. */
export function nativeExportUnsupported(job: RenderJob): string[] {
 const missing: string[] = [];
 if (job.subtitle) missing.push('chèn phụ đề');
 if (job.cover.mode !== 'none') missing.push('che phụ đề gốc');
 if (job.zoom !== 1 || job.offsetX !== 0 || job.offsetY !== 0) missing.push('zoom/dịch khung hình');
 if (job.voiceMode !== 'original' || job.dubbedAudio || job.voiceSegments?.length) missing.push('lồng tiếng');
 return missing;
}

export async function exportBasicVideoOnAndroid(job: RenderJob): Promise<string> {
 if (Platform.OS !== 'android') throw new Error('Chỉ hỗ trợ Android.');
 const unsupported = nativeExportUnsupported(job);
 if (unsupported.length) throw new Error('Chế độ native hiện chưa hỗ trợ: ' + unsupported.join(', ') + '. Dùng bộ dựng FFmpeg bên ngoài để giữ các hiệu ứng này.');
 if (!job.video) throw new Error('Chưa chọn video.');
 const destination = `${FileSystem.cacheDirectory}video-export-${Date.now()}.mp4`;
 const native = requireNativeModule<VideoExportNative>('VideoExport');
 return native.exportBasicVideo(job.video, destination);
}
