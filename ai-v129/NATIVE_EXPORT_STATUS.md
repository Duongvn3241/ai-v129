# Android Media3 export — v1.2.6

## Đã bổ sung
- Expo local Android module `modules/video-export` dùng AndroidX Media3 Transformer.
- Nút **Xuất MP4 ngay trong APK (video gốc)** trong màn ghép video.
- Xuất MP4 ra cache và mở bảng chia sẻ Android.
- Chặn rõ ràng các cấu hình mà native module chưa hỗ trợ, tránh xuất sai nội dung.

## Giới hạn quan trọng
- Native Media3 mới hỗ trợ xuất video gốc kèm âm gốc; **chưa** chèn phụ đề, che chữ, zoom hay trộn giọng đọc. Các tác vụ đó tiếp tục dùng `tools/render_video.py` trên Termux/máy tính.
- Chưa kiểm thử Gradle, EAS build hoặc HONOR Win thật. Phiên bản Media3, Expo Modules API và lockfile cần được kiểm tra trong môi trường có cài dependencies.
- Nút native cần development build/APK, không chạy trong Expo Go.
- Cần giữ ứng dụng mở trong lúc xuất; chưa có foreground service, hủy tác vụ hoặc progress native.

## Kiểm tra khi build
```sh
pnpm install --no-frozen-lockfile
pnpm dlx expo-doctor
pnpm exec expo prebuild --platform android --clean
pnpm exec expo run:android
```
Kiểm tra module được Expo autolink. Nếu báo lỗi phiên bản Media3/Expo Modules, lấy log Gradle đầy đủ trước khi thay dependency.
