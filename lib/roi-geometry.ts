export type Size = { width: number; height: number };
export type Rect = { x: number; y: number; width: number; height: number };
export type Rotation = 0 | 90 | 180 | 270;
const clamp = (v: number) => Math.max(0, Math.min(1, v));
export function uprightSize(encoded: Size, rotation: Rotation): Size { return rotation === 90 || rotation === 270 ? { width: encoded.height, height: encoded.width } : encoded; }
export function containedRect(viewport: Size, upright: Size): Rect {
  if (viewport.width <= 0 || viewport.height <= 0 || upright.width <= 0 || upright.height <= 0) throw new Error('Kích thước video không hợp lệ');
  const scale = Math.min(viewport.width/upright.width, viewport.height/upright.height);
  const width = upright.width*scale, height = upright.height*scale;
  return { x:(viewport.width-width)/2, y:(viewport.height-height)/2, width, height };
}
export function pointToNormalized(x:number,y:number,viewport:Size,encoded:Size,rotation:Rotation) {
  const r=containedRect(viewport,uprightSize(encoded,rotation));
  return { x:clamp((x-r.x)/r.width), y:clamp((y-r.y)/r.height) };
}
export function roiToUprightPixels(roi:Rect,encoded:Size,rotation:Rotation) {
  const size=uprightSize(encoded,rotation);
  const x=Math.floor(clamp(roi.x)*size.width), y=Math.floor(clamp(roi.y)*size.height);
  const right=Math.ceil(clamp(roi.x+roi.width)*size.width), bottom=Math.ceil(clamp(roi.y+roi.height)*size.height);
  return { x,y,width:Math.max(1,right-x),height:Math.max(1,bottom-y),sourceWidth:size.width,sourceHeight:size.height };
}
