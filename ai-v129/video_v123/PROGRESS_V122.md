# AI Subtitle Studio v1.2.2 — tình trạng thực tế

## Đã thay đổi trong mã nguồn
- STT: bỏ giới hạn cứng 2 phút sau khi chuyển đổi; chia WAV PCM16 16kHz mono thành đoạn 28 giây, nhận dạng tuần tự bằng một engine Whisper, giải phóng file đoạn sau mỗi lần chạy; tiến trình theo đoạn và chống lặp phần từ trùng giữa các đoạn. Có xuất SRT/VTT.
- WAV header được xác minh trước khi cắt để tránh xử lý dữ liệu không tương thích.
- Cập nhật `buffer` và importer trong `pnpm-lock.yaml` để hỗ trợ tạo WAV chunk.

## Giới hạn chưa giải quyết
- `convertAudioToWav16k` vẫn giải mã **toàn bộ** nguồn thành WAV trước khi cắt; video cực dài có thể đầy bộ nhớ hoặc dung lượng trống. Cần thay bằng giải mã streaming/FFmpeg theo đoạn trong native layer.
- Cắt đoạn 28 giây có thể cắt giữa câu; đoạn chồng 1 giây chỉ lọc trùng theo từ, chưa có aligner để xác định mốc từng từ. Thời gian cue chỉ là ước lượng trong mỗi đoạn.
- Không có quyền chạy Android/EAS thực tế tại đây; chưa thể xác nhận hết crash Sherpa-ONNX/Whisper.
- Burn-in MP4 cần encoder native (FFmpeg hoặc MediaCodec), chưa được triển khai. Không quảng cáo là đã có.
- OCR và ROI cần thử trên máy thật, đặc biệt tỷ lệ khung hình và các video xoay.
- Quản lý model Sherpa STT/TTS đã có; model OCR ML Kit là dependency native, không phải gói Sherpa tải/xóa theo cách tương tự.

## Cách thử
1. `pnpm install --frozen-lockfile`
2. `pnpm dlx expo-doctor`
3. `bash scripts/build-apk-termux.sh`
4. Thử WAV 10 giây, 70 giây, 4 phút. Quan sát phần trăm và số cue.
5. Nếu app tự đóng: chạy `bash scripts/collect-stt-log-termux.sh` (yêu cầu ADB hoạt động), gửi logcat.

Chưa build APK hoặc xác minh trên thiết bị. Đây là bản mã nguồn thử nghiệm.
