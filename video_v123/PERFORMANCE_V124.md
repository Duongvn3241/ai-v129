# Tăng tốc dựng video v1.2.4

## Tùy chọn trong render-job.json

```json
"performance": { "mode": "fast", "encoder": "auto", "threads": 0 }
```

- `mode`: `fast` (x264 ultrafast/CRF 25), `balanced` (veryfast/CRF 21), `quality` (medium/CRF 18). CRF thấp hơn thường cho chất lượng và kích thước tệp cao hơn.
- `encoder`: `auto`, `software`, `mediacodec`. MediaCodec chỉ khả dụng nếu bản FFmpeg có `h264_mediacodec` và phần cứng Android hỗ trợ. Tùy chọn `auto` thử MediaCodec ở chế độ `fast` khi encoder được liệt kê; lỗi runtime có thể vẫn xảy ra tùy thiết bị.
- `threads`: 0 để FFmpeg tự quyết định; hoặc 1–32 để giới hạn luồng x264. Không đặt bằng toàn bộ số nhân CPU nếu điện thoại quá nóng hoặc RAM hạn chế.
- Nếu **không có zoom, che phụ đề gốc hoặc chèn phụ đề mới**, video được sao chép nguyên luồng (`-c:v copy`) thay vì mã hóa lại, thường nhanh hơn rất nhiều. Ghép âm thanh vẫn có thể cần mã hóa AAC.
- Có xuất thông tin tiến trình FFmpeg qua stderr (`-progress pipe:2`).

## Giới hạn

Đây là tối ưu script FFmpeg chạy trên Termux/máy tính, **không phải GPU tăng tốc OCR/STT hoặc render MP4 trực tiếp trong APK**. Không có cách đảm bảo mọi điện thoại đều dùng GPU cho FFmpeg, ML Kit hay ONNX. Chưa đo tốc độ trên điện thoại thực tế. Lựa chọn tốc độ/encoder hiện được đọc từ JSON; chưa có điều khiển trong giao diện APK.
