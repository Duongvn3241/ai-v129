# Ghép video v1.2.3

## Có trong bản này
- Màn **Ghép video hoàn chỉnh** mở từ Video Studio khi đã chọn video.
- Chọn video, tệp SRT/VTT, tệp âm thanh lồng tiếng; xem video và kéo ROI che phụ đề gốc.
- Chọn che bằng hộp đen, zoom 1–3x, pan, cỡ chữ phụ đề, trộn/thay tiếng gốc.
- Xuất JSON cấu hình; script `tools/render_video.py` chạy FFmpeg để tạo MP4 trên máy có ffmpeg + ffprobe + libass + libx264.
- Manifest hỗ trợ `voiceSegments`: mỗi đoạn `{ "file": "voice/001.wav", "startMs": 1200, "endMs": 3200 }`, ghép vào timeline và cắt âm thanh vượt cửa sổ thời gian.

## Cách render trên Termux
1. `pkg install python ffmpeg` (cần bản FFmpeg có `subtitles` filter và `libx264`).
2. Copy video, SRT, audio, `render-job.json` vào thư mục Termux truy cập được; thay `content://`/`file://` hoặc đường dẫn sandbox Android trong JSON bằng **đường dẫn tệp thực** trên Termux.
3. Chạy `python tools/render_video.py render-job.json` từ thư mục dự án (hoặc đường dẫn tuyệt đối đến script).
4. MP4 đầu ra nằm ở trường `output` của JSON.

## Giới hạn cần nói rõ
- APK **chưa tự render MP4**: Expo không tự cung cấp bộ mã hóa/filtergraph FFmpeg. Script Termux/máy tính là pipeline render thật nhưng riêng biệt.
- Vùng che `blur` hiện fallback **hộp đen** và có cảnh báo khi render, không phải blur thực sự.
- ROI trên preview không thể hiện hiệu ứng zoom và lớp che/subtitle render sau cùng; preview hiện để đặt vị trí vùng.
- Audio một file cần được đồng bộ sẵn; `voiceSegments` đặt đúng mốc nhưng nếu giọng dài hơn cue sẽ cắt, không tự tăng tốc hoặc tổng hợp lại giọng.
- Độ chính xác căn lời thoại phụ thuộc timestamps đầu vào; cần kiểm tra bằng tai.
- Chưa test APK native hoặc build EAS, chưa kiểm chứng toàn bộ filter FFmpeg trên Termux.
