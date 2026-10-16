import { useMemo, useState } from 'react';
import { Alert, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { VideoRoiPicker, DEFAULT_ROI, type Roi } from '@/components/subtitle/VideoRoiPicker';
import { defaultRenderJob, validateRenderJob, type CoverMode, type VoiceMode } from '@/lib/video-render-job';
import { exportBasicVideoOnAndroid, nativeExportUnsupported } from '@/lib/native-video-export';

const ink='#182820';
const styles=StyleSheet.create({page:{flex:1,backgroundColor:'#f5f8f4'},content:{padding:16,gap:14,paddingBottom:50},title:{fontSize:23,fontWeight:'900',color:ink},label:{fontSize:14,fontWeight:'800',color:ink},hint:{fontSize:12,color:'#55685a',lineHeight:19},section:{backgroundColor:'white',borderRadius:16,padding:14,gap:10},btn:{backgroundColor:'#236246',padding:13,borderRadius:11},btnText:{textAlign:'center',color:'white',fontWeight:'800'},chip:{borderColor:'#c6d6cc',borderWidth:1,borderRadius:10,padding:10,marginRight:7},chipSelected:{backgroundColor:'#cdecd9',borderColor:'#236246'},input:{borderWidth:1,borderColor:'#c6d6cc',borderRadius:9,padding:10,color:ink},row:{flexDirection:'row',flexWrap:'wrap',gap:4},text:{color:ink}});
export default function VideoRenderScreen(){
 const params=useLocalSearchParams<{uri?:string;name?:string}>();
 const [video,setVideo]=useState(params.uri??'');
 const [subtitle,setSubtitle]=useState('');
 const [dubbedAudio,setDubbedAudio]=useState('');
 const [zoom,setZoom]=useState(1);
 const [offsetX,setOffsetX]=useState(0);
 const [offsetY,setOffsetY]=useState(0);
 const [roi,setRoi]=useState<Roi>(DEFAULT_ROI);
 const [cover,setCover]=useState<CoverMode>('none');
 const [voiceMode,setVoiceMode]=useState<VoiceMode>('original');
 const [originalVolume,setOriginalVolume]=useState('0.25');
 const [dubbedVolume,setDubbedVolume]=useState('1');
 const [fontSize,setFontSize]=useState('22');
 const [message,setMessage]=useState('');
 const [exporting,setExporting]=useState(false);
 const choose=async(kind:'video'|'subtitle'|'dubbed')=>{
   const r=await DocumentPicker.getDocumentAsync({type:kind==='video'?'video/*':kind==='subtitle'?['text/*','application/x-subrip','application/octet-stream']:'audio/*',copyToCacheDirectory:true});
   if(r.canceled||!r.assets[0])return;
   const uri=r.assets[0].uri;
   if(kind==='video')setVideo(uri);else if(kind==='subtitle')setSubtitle(uri);else setDubbedAudio(uri);
 };
 const job=useMemo(()=>({ ...defaultRenderJob(video),subtitle:subtitle||undefined,dubbedAudio:dubbedAudio||undefined,zoom,offsetX,offsetY,cover:{mode:cover,x:roi.x,y:roi.y,width:roi.width,height:roi.height},voiceMode,originalVolume:Number(originalVolume),dubbedVolume:Number(dubbedVolume),subtitleStyle:{fontSize:Number(fontSize),marginV:28,outline:2}}),[video,subtitle,dubbedAudio,zoom,offsetX,offsetY,roi,cover,voiceMode,originalVolume,dubbedVolume,fontSize]);
 const saveJob=async()=>{
  const errors=validateRenderJob(job);
  if(errors.length){Alert.alert('Thiếu thông tin',errors.join('\n'));return;}
  try{
   const uri=`${FileSystem.cacheDirectory}render-job-${Date.now()}.json`;
   await FileSystem.writeAsStringAsync(uri,JSON.stringify(job,null,2),{encoding:FileSystem.EncodingType.UTF8});
   if(await Sharing.isAvailableAsync())await Sharing.shareAsync(uri,{mimeType:'application/json',dialogTitle:'Lưu cấu hình ghép video'});
   setMessage('Đã tạo cấu hình render. Cần chuyển video, SRT, âm thanh và cấu hình sang Termux/máy tính rồi sửa đường dẫn tệp trước khi chạy tools/render_video.py. Chưa xuất MP4 trực tiếp trong APK.');
  }catch(e){setMessage(e instanceof Error?e.message:'Không thể xuất cấu hình.');}
 };
 const exportNative=async()=>{
  if(exporting)return;
  const errors=validateRenderJob(job);
  if(errors.length){Alert.alert('Cấu hình không hợp lệ',errors.join('\n'));return;}
  const missing=nativeExportUnsupported(job);
  if(missing.length){Alert.alert('Chưa hỗ trợ dựng đầy đủ trong APK',`Bản native hiện chưa có: ${missing.join(', ')}. Để giữ những hiệu ứng này, hãy xuất JSON và dùng bộ dựng FFmpeg.`);return;}
  try {
   setExporting(true);setMessage('Đang xuất MP4 bằng Media3 Android. Vui lòng giữ ứng dụng mở.');
   const uri=await exportBasicVideoOnAndroid(job);
   setMessage('Đã tạo MP4: '+uri);
   if(await Sharing.isAvailableAsync())await Sharing.shareAsync(uri,{mimeType:'video/mp4',dialogTitle:'Lưu hoặc chia sẻ video MP4'});
  }catch(e){setMessage(e instanceof Error?e.message:'Xuất MP4 thất bại.');}
  finally{setExporting(false);}
 };
 const option=(label:string,selected:boolean,onPress:()=>void)=><Pressable key={label} onPress={onPress} style={[styles.chip,selected&&styles.chipSelected]}><Text style={styles.text}>{label}</Text></Pressable>;
 return <View style={styles.page}><ScrollView contentContainerStyle={styles.content}>
  <Pressable onPress={()=>router.back()}><Text style={styles.text}>← Quay lại Video Studio</Text></Pressable>
  <Text style={styles.title}>Ghép video hoàn chỉnh</Text>
  <Text style={styles.hint}>Xem trước khung hình và cấu hình phụ đề, che chữ cũ, zoom và lồng tiếng. Xuất cấu hình để dựng MP4 bằng FFmpeg trong Termux hoặc máy tính.</Text>
  <View style={styles.section}><Text style={styles.label}>Nguồn video và phụ đề</Text><Pressable style={styles.btn} onPress={()=>choose('video')}><Text style={styles.btnText}>Chọn video</Text></Pressable><Text style={styles.hint}>{video||'Chưa chọn'}</Text><Pressable style={styles.btn} onPress={()=>choose('subtitle')}><Text style={styles.btnText}>Chọn SRT / VTT</Text></Pressable><Text style={styles.hint}>{subtitle||'Chưa có phụ đề mới'}</Text>{video?<VideoRoiPicker uri={video} roi={roi} onChange={setRoi}/>:null}</View>
  <View style={styles.section}><Text style={styles.label}>Che phụ đề gốc (vùng ROI ở trên)</Text><View style={styles.row}>{option('Không che',cover==='none',()=>setCover('none'))}{option('Hộp đen',cover==='solid',()=>setCover('solid'))}{option('Làm mờ (thay thế bằng hộp đen)',cover==='blur',()=>setCover('blur'))}</View><Text style={styles.hint}>Vùng che áp dụng lên video sau khi zoom. Dùng ROI để chỉnh chính xác vị trí cần che.</Text></View>
  <View style={styles.section}><Text style={styles.label}>Zoom và dịch khung hình</Text><Text style={styles.text}>Zoom {zoom.toFixed(2)}×</Text><View style={styles.row}>{option('−',false,()=>setZoom(x=>Math.max(1,Math.round((x-0.05)*100)/100)))}{option('+',false,()=>setZoom(x=>Math.min(3,Math.round((x+0.05)*100)/100)))}{option('Đặt lại',false,()=>{setZoom(1);setOffsetX(0);setOffsetY(0)})}</View><Text style={styles.hint}>Dịch khung hình (−1 đến 1). Chỉ có tác dụng khi zoom lớn hơn 1.</Text><View style={styles.row}><TextInput style={[styles.input,{flex:1}]} keyboardType="numbers-and-punctuation" value={String(offsetX)} onChangeText={v=>setOffsetX(Number(v)||0)} placeholder="X"/><TextInput style={[styles.input,{flex:1}]} keyboardType="numbers-and-punctuation" value={String(offsetY)} onChangeText={v=>setOffsetY(Number(v)||0)} placeholder="Y"/></View></View>
  <View style={styles.section}><Text style={styles.label}>Lồng tiếng</Text><Pressable style={styles.btn} onPress={()=>choose('dubbed')}><Text style={styles.btnText}>Chọn tệp âm thanh lồng tiếng</Text></Pressable><Text style={styles.hint}>{dubbedAudio||'Chưa chọn'}</Text><View style={styles.row}>{option('Âm gốc',voiceMode==='original',()=>setVoiceMode('original'))}{option('Trộn tiếng',voiceMode==='mix',()=>setVoiceMode('mix'))}{option('Thay tiếng gốc',voiceMode==='replace',()=>setVoiceMode('replace'))}</View><Text style={styles.hint}>Tệp lồng tiếng toàn video phải được đồng bộ sẵn. Muốn căn theo từng câu, dùng voiceSegments với startMs/endMs trong cấu hình render.</Text><Text style={styles.text}>Âm lượng tiếng gốc / lồng tiếng (0–2)</Text><View style={styles.row}><TextInput style={[styles.input,{flex:1}]} value={originalVolume} onChangeText={setOriginalVolume} keyboardType="decimal-pad"/><TextInput style={[styles.input,{flex:1}]} value={dubbedVolume} onChangeText={setDubbedVolume} keyboardType="decimal-pad"/></View></View>
  <View style={styles.section}><Text style={styles.label}>Kiểu phụ đề</Text><Text style={styles.hint}>Cỡ chữ</Text><TextInput style={styles.input} value={fontSize} onChangeText={setFontSize} keyboardType="number-pad"/></View>
  <Pressable style={[styles.btn,exporting&&{opacity:0.5}]} disabled={exporting} onPress={()=>void exportNative()}><Text style={styles.btnText}>{exporting?'Đang xuất MP4…':'Xuất MP4 ngay trong APK (video gốc)'}</Text></Pressable>
  <Text style={styles.hint}>Chế độ Media3 native hiện chỉ xuất video gốc và tiếng gốc, không ghép phụ đề/ROI/zoom/lồng tiếng. Các hiệu ứng đó vẫn dùng bộ dựng FFmpeg bên ngoài.</Text>
  <Pressable style={styles.btn} onPress={()=>void saveJob()}><Text style={styles.btnText}>Xuất cấu hình ghép video (JSON)</Text></Pressable>
  {message?<Text style={styles.hint}>{message}</Text>:null}
  <Text style={styles.hint}>Đã bổ sung bộ xuất Media3 native giới hạn cho video gốc. Bộ render FFmpeg được cung cấp tại tools/render_video.py trong ZIP dự án. Cần có ffmpeg với bộ lọc subtitles/libass và encoder libx264.</Text>
 </ScrollView></View>
}
