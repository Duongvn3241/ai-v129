# Hướng dẫn sử dụng AI Subtitle Studio

Bản cập nhật này thay các luồng demo chính bằng xử lý thật. Để dùng OCR/STT/TTS, cần cài **APK native mới được build từ mã nguồn này**; Expo Go và preview web không chứa các native module ML Kit/Sherpa ONNX.

## 1. Tải model giọng nói

Mở **Công cụ → Quản lý model** hoặc nhấn lối tắt **Tải model** trên màn Studio. Chọn **Tải model** cho chức năng cần dùng:

| Model | Dùng cho | Tải lần đầu |
|---|---|---:|
| Whisper Tiny đa ngôn ngữ | Nhận dạng lời nói từ audio/video, hỗ trợ tiếng Việt | khoảng 111 MB |
| VIVOS x_low int8 | Tạo giọng đọc tiếng Việt offline | khoảng 14 MB |

Model được lấy từ release công khai của Sherpa ONNX và lưu trong vùng riêng của ứng dụng. Sau khi tải xong, có thể dùng offline. Cần kết nối mạng khi tải model; tổng dung lượng hai model khoảng 125 MB. Có thể gỡ và tải lại trong **Quản lý model**.

## 2. OCR video → SRT/VTT

1. Mở **Công cụ → OCR video → SRT**.
2. Chọn video có phụ đề/chữ đã hiển thị trên hình rồi nhấn **Bắt đầu nhận dạng thật**.
3. ML Kit trích chữ trên thiết bị; màn hình hiển thị tiến trình và cue kết quả.
4. Nhấn **Tải SRT** hoặc **Tải VTT**.

OCR ưu tiên nửa dưới khung hình, lấy mẫu mỗi 1,5 giây, tối đa khoảng 10 phút đầu mỗi lượt (400 mẫu, cách nhau 1,5 giây). Model OCR được Google Play Services tải tự động ở lần dùng đầu, vì vậy lần đầu cần mạng. OCR chỉ đọc chữ đang hiện trên hình, không nghe lời nói từ audio. Kết quả có thể cần sửa tay; hãy chia video dài thành đoạn ngắn hơn.

## 3. Dịch SRT/VTT bằng Gemini

1. Tạo Gemini API key trong Google AI Studio.
2. Mở **Cài đặt**, dán key và nhấn **Lưu khóa an toàn**. Key được lưu trong SecureStore của thiết bị.
3. Mở **Dịch phụ đề**, chọn file `.srt` hoặc `.vtt`, nhập ngôn ngữ nguồn/đích rồi nhấn **Dịch tệp thật**.
4. Xem trước kết quả và nhấn **Tải SRT đã dịch**.

Dịch dùng model Gemini có sẵn cho API key và gửi nội dung cue trực tiếp tới Google Gemini khi người dùng bấm dịch. ID, số cue và timeline được bảo toàn. Phí/giới hạn sử dụng tuỳ tài khoản Google AI Studio; đừng lưu API key của người khác trên thiết bị của bạn.

## 4. STT → SRT và TTS tiếng Việt

Mở **Công cụ → STT → SRT** để chọn audio/video (MP3, WAV, M4A, MP4 và định dạng FFmpeg hỗ trợ). Ứng dụng chuyển âm thanh sang WAV mono 16 kHz, chạy Whisper Tiny offline và cho tải SRT. Các mốc câu hiện được **chia gần đúng theo thời lượng tệp**, chưa phải căn chỉnh từ/câu chính xác; cần rà lại timeline trước khi sử dụng.

Trong tab **Giọng đọc TTS**, nhập tối đa 2.000 ký tự, tạo giọng VIVOS tiếng Việt offline và lưu/chia sẻ tệp WAV.

## 5. Tải và sửa phụ đề

Màn Studio có nút **Tải**. Trình biên tập hỗ trợ xuất **SRT, VTT, TXT, JSON**. SRT/VTT giữ mốc thời gian; Android cho chọn thư mục lưu, iOS mở bảng chia sẻ, web tải trực tiếp từ trình duyệt. Các cue/dự án được lưu cục bộ trên thiết bị.

## 6. Build APK mới

**Lỗi `npm ci` / lockfile:** xem `SUA_LOI_EAS_LOCKFILE.md`. ZIP này dùng duy nhất `pnpm-lock.yaml`; build bằng `bash scripts/build-apk-termux.sh` trong Termux hoặc chạy các lệnh trong tài liệu đó.


Thay đổi native không thể cập nhật vào một APK đã cài sẵn. Hãy build APK mới sau khi lấy mã nguồn này; xem [hướng dẫn Android](docs/ANDROID_APK.md). Môi trường preview web chỉ dùng để xem giao diện, không thể tải hoặc chạy model ONNX/ML Kit native.

## Tham khảo APK vTranslate

Đã kiểm kê cấu trúc APK tham khảo để rút ra hướng thiết kế OCR nhiều engine, FFmpeg/media pipeline, model tải theo yêu cầu và TTS đa giọng. Không trích xuất hay đóng gói lại mã nguồn/nhị phân/model riêng từ APK. Xem [phân tích và kế hoạch tích hợp](docs/VTTRANSLATE_REFERENCE.md). Model Whisper và VIVOS của dự án được tải từ release công khai Sherpa ONNX.

## Nguồn kỹ thuật

- [Sherpa ONNX — release model](https://github.com/k2-fsa/sherpa-onnx/releases)
- [Google ML Kit — Text Recognition v2 trên Android](https://developers.google.com/ml-kit/vision/text-recognition/v2/android)
- [Gemini API — generateContent REST](https://ai.google.dev/api/generate-content)


## Video Studio (bản cập nhật)

- Mở **Công cụ → Video Studio · OCR + STT**.
- Chọn video và chọn OCR, STT hoặc OCR + STT.
- OCR nhận chữ đang hiển thị trong hình; STT nhận lời nói từ âm thanh và cần tải model Whisper.
- Khi chọn OCR + STT, chạy OCR trước; sau đó chọn **Sau OCR, mở STT cho cùng video**. Rà soát kết quả trước khi xuất SRT/VTT.
- Bản này chưa xuất MP4 đã burn-in phụ đề. Không coi nút chọn quy trình là bằng chứng video đã được render; phần mã hóa video cần module native riêng.
