# Kiểm thử thực tế OCR / STT (v1.2.1)

## OCR ROI
- Chọn video dọc 9:16, tua tới phụ đề. Khung ROI phải nằm đúng phần video thực tế, không nằm trên dải đen.
- Kéo trong vùng ROI để di chuyển; kéo góc dưới phải để thay đổi kích thước.
- Kiểm tra thêm video ngang 16:9, video vuông và video có phụ đề hai dòng.
- Chạy OCR, so sánh câu và timestamp với video gốc. Lấy mẫu 1,5 giây nên timestamp chỉ gần đúng và có thể bỏ sót phụ đề quá ngắn.
- Nút Frame chỉ tua 1/30 giây theo giả định 30fps, không phải frame stepping chuẩn xác với mọi nguồn.

## STT bị văng
- Dùng file WAV 16 kHz mono 10–30 giây, model Whisper Tiny tải đủ, máy còn RAM.
- Nếu tự đóng, thu thập Android logcat. Trên Termux có ADB chạy `bash scripts/collect-stt-log-termux.sh` rồi tái hiện lỗi.
- Log lỗi JavaScript có prefix `[SubtitleStudio/STT]`; crash native SIGSEGV/SIGABRT hoặc OOM cần logcat và không thể bắt bằng try/catch JavaScript.
- Đoạn dài hơn 2 phút hiện bị chặn; xử lý theo từng đoạn CHƯA triển khai.

## Trạng thái
- Đã cải tiến vùng ROI theo hình chữ nhật video hiển thị trong preview và hỗ trợ thao tác trên video dọc/ngang.
- Chưa build APK, chưa test thiết bị thực, chưa xác minh STT hết văng.
- Chưa xác minh bản quyền/tính tương thích các model trong APK tham khảo.
- Chưa triển khai video MP4 burn-in và chỉnh timeline chuyên sâu.
