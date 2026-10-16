# Quy trình video đầu vào — AI Subtitle Studio

## Các luồng hiện có

1. **OCR → SRT/VTT** (`/ocr`): đọc chữ phụ đề đang hiển thị trong hình video bằng Google ML Kit; lấy mẫu mỗi 1,5 giây, ưu tiên vùng nửa dưới khung hình, tối đa 400 mẫu (~10 phút).
2. **STT → SRT** (`/speech`, chế độ STT): nhận dạng lời nói trong tệp audio/video bằng Sherpa ONNX Whisper Tiny. Cần tải model trước trong **Tải model**. Mốc thời gian hiện được chia gần đúng theo độ dài văn bản, chưa phải timestamp chính xác từng từ/câu từ Whisper.
3. **Dịch phụ đề** (`/translate`): nhập SRT/VTT/TXT/JSON và dịch qua Gemini API; giữ ID và timeline. Cần lưu Gemini API key trong Cài đặt. Luồng dịch gửi văn bản phụ đề tới Google.
4. **TTS** (`/speech`, chế độ TTS): tạo giọng đọc tiếng Việt offline sau khi tải model VIVOS.
5. **Biên tập / xuất**: rà lại cue và xuất SRT/VTT/TXT/JSON trong trình biên tập.

## Cách làm với một video

- Muốn lấy **chữ đang hiện trên màn hình**: Công cụ → OCR → chọn video → Bắt đầu nhận dạng → rà cue → Tải SRT.
- Muốn lấy **lời nói trong âm thanh**: Công cụ → Âm thanh → STT → chọn video → nhận dạng → rà cue → xuất SRT.
- Muốn dịch: xuất SRT từ OCR/STT, mở Dịch phụ đề, chọn tệp SRT vừa tạo, chọn ngôn ngữ và dịch.
- Muốn lồng tiếng: chuyển sang TTS, dán nội dung cần đọc, tạo giọng đọc và nghe/kiểm tra kết quả.

## Giới hạn cần biết

- OCR nhận chữ đã được render lên hình, không tự nghe lời nói. STT nghe âm thanh, không tự đọc chữ trong hình.
- OCR là lấy mẫu chứ không quét mọi frame; phụ đề xuất hiện rất ngắn có thể bị bỏ sót. Nên dùng video rõ, chữ đủ lớn và tương phản tốt.
- OCR giới hạn 400 mẫu để giảm nguy cơ quá tải/treo máy. Video dài hơn nên cắt thành các đoạn ngắn.
- STT hiện tạo mốc cue gần đúng theo tỷ lệ độ dài văn bản; cần hiệu chỉnh timeline trước khi phát hành.
- OCR, STT, TTS và tải model yêu cầu APK native đã build đúng các module. Không chạy đầy đủ trên web preview hoặc Expo Go.
- Thiết bị thật cần kiểm tra quyền đọc file, bộ nhớ trống, mạng ở lần tải model/OCR đầu, và tương thích codec video. Chưa thể cam kết mọi định dạng video đều được hỗ trợ trên mọi thiết bị.
