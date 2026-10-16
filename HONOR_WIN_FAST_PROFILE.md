# HONOR Win AAP-AN00 — profile 12 GB / fast

Cấu hình người dùng chọn: videoThreads=6, ocrWorkers=2, sttWorkers=1, sttChunkSeconds=25.

- Video render JSON mặc định: `performance: {mode: "fast", encoder: "auto", threads: 6}`. Trên Android, FFmpeg sẽ chọn `h264_mediacodec` **nếu bản FFmpeg cung cấp encoder**. Nếu không, sử dụng `libx264` ultrafast. Khi không có filter hình ảnh, dùng stream copy, không tái mã hóa video. MediaCodec có thể lỗi theo codec/độ phân giải và cần thử trên máy thật.
- STT: từng đoạn 25 giây, chạy tuần tự 1 luồng công việc; Whisper hiện cấu hình numThreads=2 cho suy luận. Mốc thời gian từng câu vẫn ước lượng.
- OCR: mục tiêu tối đa 2 workers, **chưa kích hoạt chạy song song** do ML Kit/giải mã khung hình cần đo tải và tránh OOM.
- Chưa có APK build/benchmark trên HONOR Win; GPU Adreno không tự động được dùng cho OCR/STT bởi profile này.
- FFmpeg renderer vẫn chạy qua Termux/PC, không phải render native trực tiếp trong APK.

Thử hiệu năng với video 30 giây, rồi 5 phút. Theo dõi nhiệt độ, bộ nhớ và lỗi encoder; khi MediaCodec lỗi, đặt `encoder: "software"`.
