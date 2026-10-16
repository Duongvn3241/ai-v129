# Công việc — AI Subtitle Studio

## Cập nhật Video Studio
- [x] Thêm màn Video Studio để chọn video một lần và chọn quy trình OCR, STT hoặc cả hai.
- [x] Chuyển video đã chọn sang màn OCR/STT để không phải chọn lại tệp.
- [x] Thêm lối tắt Video Studio vào Studio và Công cụ.
- [x] Làm rõ trạng thái tính năng: OCR/STT và xuất SRT/VTT có luồng riêng; xuất MP4/burn-in vẫn cần media encoder native.

## Đã tích hợp trong bản cập nhật
- [x] Nút tải trên màn Studio và trình biên tập; xuất SRT, VTT, TXT, JSON.
- [x] Lưu dự án/cue cục bộ, thêm cue và sửa phụ đề.
- [x] OCR video thật bằng Google ML Kit native, tiến trình, xem cue và tải SRT/VTT.
- [x] Màn Quản lý model: tải, theo dõi tiến độ và gỡ model từ release Sherpa ONNX.
- [x] Whisper Tiny đa ngôn ngữ cho STT offline; chuyển tệp bằng FFmpeg sang WAV mono 16 kHz.
- [x] VIVOS x_low int8 cho TTS tiếng Việt offline; xuất/chia sẻ WAV.
- [x] Đọc SRT/VTT, dịch cue theo lô bằng Gemini REST API, bảo toàn ID/timeline và xuất SRT.
- [x] Lưu Gemini API key bằng SecureStore trên thiết bị; thông báo rõ nội dung được gửi tới Google khi dịch.
- [x] Cập nhật Cài đặt, Công cụ, lối tắt model ở trang Studio và hướng dẫn build APK.

## Giới hạn cần biết
- [ ] OCR hiện quét ưu tiên nửa dưới khung hình, lấy mẫu 1,5 giây, tối đa khoảng 10 phút đầu (400 khung hình) mỗi lượt; chưa xử lý toàn bộ phim hoặc OCR qua audio.
- [ ] STT tạo cue bằng cách chia gần đúng theo thời lượng; cần thêm alignment/timestamp chính xác trước khi dùng cho bản phát hành.
- [ ] TTS tạo WAV từ văn bản; chưa đồng bộ nhiều track/voice với timeline video.
- [ ] Video Studio ghép/burn-in phụ đề và dịch bubble trực tiếp chưa được tích hợp.
- [ ] Cần chạy kiểm thử thiết bị Android/iOS thật và tạo APK mới; Sandbox xác nhận được TypeScript, lint, test và web export nhưng không có Android SDK nên không thể build APK tại đây.

## Tham khảo vTranslate và hướng phát triển
- [x] Kiểm kê thành phần APK tham khảo ở mức cấu trúc: ML Kit OCR, PaddleOCR NCNN assets, Sherpa ONNX/ONNX Runtime, FFmpeg native, Kokoro/Piper resources.
- [x] Viết kế hoạch kiến trúc để tránh sao chép model/nhị phân riêng từ APK.
- [ ] Pipeline video đầu-cuối: chọn video một lần → OCR/STT → hợp nhất → dịch → TTS theo cue → xuất.
- [ ] STT dùng timestamp segment thực, không chia thời lượng theo độ dài văn bản.
- [ ] OCR adapter để có thể chọn ML Kit hoặc engine OCR khác từ nguồn công khai.
- [ ] Media adapter ổn định cho trích audio/frame, metadata, xử lý codec và quản lý tệp tạm.
- [ ] TTS đa giọng và đồng bộ track theo timeline, sau khi xác minh giấy phép/tương thích engine.
- [ ] Xuất video có phụ đề hoặc burn-in sau khi pipeline media được kiểm thử.

## Ghi chú
- Model Whisper Tiny (~111 MB) và VIVOS x_low int8 (~14 MB) được tải từ release công khai Sherpa ONNX; APK vTranslate chỉ dùng để tham khảo luồng, không trích xuất/copy model hoặc nhị phân.
- Xem `HUONG_DAN_CAP_NHAT.md` và `docs/ANDROID_APK.md` để biết cách dùng và build.
