/** Portable render manifest; the companion Termux renderer consumes the same schema. */
export type CoverMode = 'none' | 'solid' | 'blur';
export type VoiceMode = 'original' | 'mix' | 'replace';
export interface RenderJob {
  version: 1;
  performance?: { mode: 'fast' | 'balanced' | 'quality'; encoder: 'auto' | 'software' | 'mediacodec'; threads: number };
  video: string;
  subtitle?: string;
  dubbedAudio?: string;
  voiceSegments?: Array<{file:string;startMs:number;endMs:number}>;
  output: string;
  zoom: number;
  offsetX: number;
  offsetY: number;
  cover: {mode: CoverMode; x:number;y:number;width:number;height:number};
  subtitleStyle: {fontSize:number; marginV:number; outline:number};
  voiceMode: VoiceMode;
  originalVolume: number;
  dubbedVolume: number;
}
export const defaultRenderJob = (video: string): RenderJob => ({
  version: 1, video, output: 'video-hoan-chinh.mp4', performance: {mode:'balanced',encoder:'auto',threads:0}, zoom: 1, offsetX: 0, offsetY: 0,
  cover: {mode:'none',x:0.05,y:0.77,width:0.9,height:0.16},
  subtitleStyle: {fontSize:22,marginV:28,outline:2},
  voiceMode:'original',originalVolume:0.25,dubbedVolume:1,
});
export function validateRenderJob(job:RenderJob): string[] {
  const errors:string[]=[];
  if(!job.video) errors.push('Chưa chọn video.');
  if(job.zoom < 1 || job.zoom > 3) errors.push('Zoom phải từ 1 đến 3.');
  for(const key of ['x','y','width','height'] as const) if(job.cover[key] < 0 || job.cover[key] > 1) errors.push(`Vùng che ${key} không hợp lệ.`);
  if(job.cover.x+job.cover.width>1 || job.cover.y+job.cover.height>1) errors.push('Vùng che vượt ngoài video.');
  if(job.voiceMode!=='original' && !job.dubbedAudio && !job.voiceSegments?.length) errors.push('Cần tệp lồng tiếng hoặc danh sách đoạn giọng đọc.');
  return errors;
}
