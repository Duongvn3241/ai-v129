# Tạo và cài APK Android

## Bắt buộc tạo build native mới

Bản cập nhật thêm Google ML Kit Text Recognition, Sherpa ONNX, FFmpeg audio conversion và background model downloader. Các module này **không chạy trong Expo Go hoặc preview web**. APK đã cài từ trước không tự nhận thay đổi; hãy tạo APK mới từ mã nguồn cập nhật.

## Cách nhanh: Native Build / EAS

1. Lưu checkpoint mới nhất của dự án.
2. Mở **Dashboard → Builds / Native builds** (tên mục có thể hơi khác), hoặc dùng Expo EAS Build đã cấu hình cho dự án.
3. Chọn nền tảng **Android** và profile `preview`/**APK · Install directly** nếu muốn cài trực tiếp. `production` thường tạo AAB.
4. Chờ build native hoàn tất. Sherpa ONNX cần tải thư viện Android/FFmpeg khi Gradle build, nên build đầu tiên có thể lâu và APK lớn hơn bản UI-only.
5. Tải APK và cài trên thiết bị. Nếu Android yêu cầu, tạm cho phép trình duyệt/trình quản lý tệp cài ứng dụng không rõ nguồn gốc, sau đó có thể tắt lại quyền này.
6. Mở app → **Công cụ → Quản lý model** để tải Whisper Tiny (~111 MB) và/hoặc VIVOS tiếng Việt (~14 MB).

> Cần kiểm tra build thành công trên Android thật trước khi phát hành. Môi trường kiểm thử của bản mã nguồn không có Android SDK nên không tạo APK đã ký ở đây.

## Expo/EAS profile

Dự án có `eas.json` với profile `preview` tạo APK cài trực tiếp và `production` tạo Android App Bundle. Cấu hình tương đương:

```json
{
  "cli": { "version": ">= 15.0.0", "appVersionSource": "remote" },
  "build": {
    "preview": {
      "distribution": "internal",
      "android": { "buildType": "apk" }
    },
    "production": {
      "android": { "buildType": "app-bundle" }
    }
  }
}
```

`app.config.ts` khai báo `minSdkVersion: 24`, kiến trúc Android 32/64-bit và config plugin của background downloader. Nếu thay đổi package name hoặc signing credentials, hãy xử lý trong cấu hình dự án/EAS; không đưa secret vào mã nguồn.

## Quy trình sử dụng sau khi cài APK

- **OCR:** chọn video có chữ phụ đề trên hình; model ML Kit được Google Play Services tải tự động ở lần dùng đầu. OCR lấy mẫu mỗi 1,5 giây, tối đa khoảng 10 phút đầu (400 khung hình).
- **STT/TTS:** mở **Quản lý model** và tải model cần dùng; sau đó có thể nhận dạng/đọc offline.
- **Dịch:** lưu Gemini API key của riêng bạn trong **Cài đặt**. Khi dịch, nội dung cue được gửi tới Google Gemini.
- **Tải tệp:** Android dùng Storage Access Framework để người dùng chọn thư mục đích.

## Kiểm tra nhanh giao diện

`npx expo export --platform web` dùng để kiểm tra các route và giao diện. Bản web không thể thực thi ML Kit/Sherpa ONNX; chỉ APK native mới có OCR, STT, TTS và tải model local.
