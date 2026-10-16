# Bản v1.2.9 dựa trên nghiên cứu sâu

Nguồn: tài liệu người dùng **Hoàn thiện AI Subtitle Studio cho HONOR Win**, mục ProjectStore, ROI mapping, test và kiến trúc 4 tab.

## Đã triển khai trong mã nguồn
- Giữ preview duy nhất ở trên và 4 tab OCR/STT/Dịch thuật/Xưởng Video; các công cụ con ở Xưởng Video.
- Thêm `lib/studio-project.ts`: kiểu dữ liệu chung cho video/ROI/cues, kiểm tra timestamp, tự động lưu và khôi phục video/ROI bằng AsyncStorage. Chú ý: URI tạm từ DocumentPicker có thể hết hạn sau khi Android dọn cache; khi đó cần chọn lại video.
- Thêm `lib/roi-geometry.ts`: toán học `contain`/rotation/ROI upright pixel, chuẩn bị cho native crop; chưa được nối vào native frame extractor.
- Thêm test kiểm tra ROI video dọc, xoay 90 độ, SRT milliseconds, bất biến timestamp dịch.
- Thay nút `Frame*` giả định 30 fps bằng bước thời gian 0.1 giây, không tuyên bố frame accurate.

## Chưa hoàn thiện / không được quảng cáo là đã chạy
- OCR native crop bitmap trước ML Kit; STT native streaming + timestamp thật; tự động đồng bộ cues từ màn OCR/STT về ProjectStore.
- Dịch trực tiếp trong tab và giữ checkpoint; hiện vẫn mở màn dịch có sẵn.
- Các công cụ Xưởng Video vẫn mở màn render hiện có; Media3 chưa burn-in subtitle/cover/zoom/voice. FFmpeg bên ngoài vẫn cần cho video đầy đủ hiệu ứng.
- Chưa chạy Gradle/EAS APK trên thiết bị HONOR Win; không có APK xác nhận hoạt động.

## Build
`pnpm install --frozen-lockfile` → `pnpm check` → `pnpm test` → `pnpm build:apk` (cần đăng nhập Expo/EAS và Android native build environment).

Đây là bản mã nguồn tiếp tục phát triển theo nghiên cứu, **không phải bản hoàn thiện tất cả tính năng**.
