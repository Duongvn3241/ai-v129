# Tham khảo APK vTranslate — phân tích kỹ thuật và kế hoạch tích hợp

Ngày tham khảo: 2026-10-15  
Tệp tham khảo: `(Mới) vTranslate.apk`  
Mục tiêu: học cách tổ chức tính năng và lựa chọn kiến trúc; **không giải nén/copy mã nguồn, model, thư viện nhị phân hoặc tài nguyên riêng** từ APK vào dự án.

## 1. Những gì xác nhận được từ cấu trúc APK

APK có dung lượng khoảng 188,6 MB và chứa các thành phần native/asset liên quan đến:

- **OCR:** thư viện Google ML Kit OCR và PaddleOCR NCNN; có bộ model PaddleOCR v5 detection/recognition cùng bảng ký tự.
- **STT/âm thanh:** Sherpa ONNX và ONNX Runtime native; có thư viện FFmpeg như `libavcodec`, `libavformat`, `libavfilter`, `libswresample`, `libswscale`.
- **TTS:** thư mục tài nguyên `kokoro` với nhiều profile/embedding giọng tiếng Việt, từ điển tiếng Việt; có tài nguyên Piper/espeak-ng.
- **AI chạy local:** các thư viện `llama`/`ggml` và thư viện có tên liên quan chat/translation.
- **Nhận dạng chữ đa ngôn ngữ:** các tài nguyên ML Kit OCR cho nhiều hệ chữ.

Đây là kết luận từ tên thư viện và đường dẫn tài nguyên bên trong APK, không phải xác nhận mọi tính năng đều hoạt động trên mọi thiết bị. Chưa thực hiện kiểm thử hành vi runtime của APK.

## 2. Bài học áp dụng cho AI Subtitle Studio

### A. OCR có phương án dự phòng

Hiện dự án dùng Google ML Kit để nhận chữ từ thumbnail video. Nên giữ ML Kit làm lựa chọn mặc định, sau đó thiết kế một adapter OCR để có thể thêm PaddleOCR/engine khác khi cần. Không đưa model lớn vào APK mặc định nếu có thể tải theo yêu cầu.

Mỗi engine phải trả cùng định dạng chuẩn:
`{ text, confidence?, boundingBox?, timestampMs }`.

### B. Một video, một quy trình điều phối

Xây dựng Video Pipeline theo từng bước có trạng thái riêng:

1. Chọn video và kiểm tra quyền/định dạng.
2. Lấy metadata: thời lượng, kích thước, codec nếu có.
3. Chạy OCR, STT hoặc cả hai song song có giới hạn tài nguyên.
4. Chuẩn hóa văn bản và hợp nhất kết quả OCR/STT, giữ nguồn gốc mỗi cue.
5. Hiệu chỉnh timestamp; không chia đều thời lượng theo số ký tự khi có timestamp thực từ engine.
6. Dịch theo lô, bảo toàn ID/timeline và lưu bản gốc.
7. TTS theo cue; ghép các đoạn audio theo timeline, cho phép thay giọng.
8. Xem trước video/phụ đề, rồi xuất SRT/VTT/TXT/JSON và audio/video nếu bộ muxer hỗ trợ.

Lỗi ở một bước phải cho phép thử lại riêng bước đó, không buộc chạy lại toàn bộ video.

### C. Tách xử lý media khỏi giao diện

Tạo lớp `MediaAdapter` cho trích audio/frame, metadata, cắt đoạn và ghép audio. Trên web dùng API trình duyệt phù hợp; trên Android/iOS dùng native module đã được xác nhận tương thích. Không gọi API native từ web preview.

### D. Quản lý model và bộ nhớ

- Danh mục model có phiên bản, dung lượng, ngôn ngữ, giấy phép, checksum và trạng thái tải.
- Tải theo yêu cầu, hiển thị tiến độ, hủy/tải tiếp nếu thư viện hỗ trợ, kiểm tra dung lượng trống.
- Cho chọn engine nhẹ/chính xác; giải phóng model sau khi dùng.
- Tôn trọng giấy phép của model và thư viện. Không tái đóng gói model/nhị phân của APK tham khảo.

### E. TTS đa giọng

Dùng giao diện TTS chung để chọn engine/giọng, ngôn ngữ, tốc độ và cao độ nếu engine hỗ trợ. Trước khi thêm Kokoro/Piper vào app, cần tích hợp từ nguồn công khai chính thức, xác nhận giấy phép, tương thích Android ABI, dung lượng và khả năng phát âm tiếng Việt. Không giả định các embedding trong APK có thể tái sử dụng.

## 3. Thứ tự ưu tiên phát triển

- [ ] **P0 — Video Pipeline:** một màn hình chọn video, chọn OCR/STT/cả hai, tiến độ theo bước, tiếp tục/thử lại và lưu dự án.
- [ ] **P0 — Timestamp thật cho STT:** dùng segment timestamps do recognizer trả về; nếu engine không cung cấp thì đánh dấu “ước lượng”.
- [ ] **P0 — OCR theo thời lượng:** xử lý theo đoạn, cấu hình khoảng lấy mẫu và vùng OCR; tránh giới hạn âm thầm chỉ quét đầu video.
- [ ] **P1 — OCR engine adapter:** ML Kit hiện có; đánh giá thêm PaddleOCR từ nguồn công khai và chỉ bật khi native module/model được tích hợp hợp lệ.
- [ ] **P1 — Media processing:** tách audio/video ổn định, xử lý codec không hỗ trợ với thông báo rõ, quản lý tệp tạm và bộ nhớ.
- [ ] **P1 — TTS theo cue:** tạo từng đoạn giọng đọc, căn timeline, điều chỉnh tốc độ và ghép track.
- [ ] **P2 — Xuất video:** ghép hoặc burn-in phụ đề qua media pipeline, có xem trước và tùy chọn giữ video gốc.
- [ ] **P2 — Kiểm thử thực tế:** video ngắn/dài, nhiều codec, phụ đề hai dòng, chữ nằm ngoài vùng dưới, tiếng ồn, mạng mất giữa lúc tải model, thiết bị thiếu bộ nhớ.

## 4. Giới hạn hiện tại của dự án

Bản dự án hiện có các luồng riêng cho OCR, STT, dịch và TTS; chưa phải pipeline đầu-cuối hoàn chỉnh. OCR hiện lấy mẫu thumbnail 1,5 giây và tối đa 400 khung hình mỗi lượt. STT hiện chia timeline gần đúng thay vì dùng timestamp segment chính xác. Việc tham khảo APK không tự động bổ sung các engine hay làm APK hiện tại thay đổi; cần sửa mã nguồn và build/test APK mới.


## 5. Bản cập nhật Video Studio

Màn `Video Studio` mới cho phép chọn video một lần và chọn OCR, STT hoặc cả hai. URI video được chuyển qua Expo Router sang các màn xử lý hiện có để người dùng không phải chọn lại tệp. Kết quả OCR/STT vẫn cần rà soát và xuất SRT/VTT. Đây chưa phải bộ dựng video hoàn chỉnh: ghép/burn-in phụ đề và xuất MP4 cần thêm native media encoder đã được kiểm tra tương thích Expo SDK và Android.
