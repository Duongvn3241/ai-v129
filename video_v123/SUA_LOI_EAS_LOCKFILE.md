# Sửa lỗi EAS Build chạy `npm ci` và báo lockfile không đồng bộ

## Nguyên nhân

Log `npm ci can only install packages when package.json and package-lock.json are in sync` cho biết EAS đã chọn npm và thấy `package-lock.json` cũ. Dự án này ghim `pnpm@9.12.0` và dùng `pnpm-lock.yaml`; không được trộn lockfile npm/yarn với pnpm.

## Điểm đã chuẩn bị trong ZIP

- `package.json` ghim `packageManager: pnpm@9.12.0`.
- `pnpm-lock.yaml` được giữ lại.
- Các lockfile npm/yarn không được đóng gói.
- `.easignore` loại `package-lock.json`, `npm-shrinkwrap.json` và `yarn.lock` khỏi gói gửi lên EAS, nhưng vẫn giữ `pnpm-lock.yaml` và thư mục `android/`.
- `eas.json` có profile `preview` tạo APK.

## Cách build trong Termux

Từ thư mục gốc đã giải nén ZIP:

```bash
npm install -g pnpm@9.12.0 eas-cli
pnpm install --frozen-lockfile
pnpm dlx expo-doctor
eas login
EAS_SKIP_AUTO_FINGERPRINT=1 eas build --platform android --profile preview
```

Hoặc chạy script kiểm tra và build:

```bash
bash scripts/build-apk-termux.sh
```

Script sẽ sao lưu rồi loại các lockfile npm/yarn cũ nếu còn sót, cài dependencies theo lockfile pnpm ở chế độ frozen, chạy `expo-doctor`, sau đó gửi build lên EAS. Nếu `pnpm install --frozen-lockfile` thất bại, script dừng để không âm thầm thay đổi phiên bản thư viện.

## Nếu EAS vẫn hiện `npm ci`

1. Đảm bảo đã giải nén và build đúng thư mục từ ZIP này.
2. Kiểm tra `package-lock.json` không còn trong thư mục gốc và `.easignore` có mặt.
3. Commit/push các file mới nếu build từ Git; nếu chạy `eas build` trực tiếp, chạy lệnh trong đúng thư mục dự án.
4. Chạy `eas build --platform android --profile preview --clear-cache` nếu log cho thấy cache cũ. Tùy chọn này chỉ làm sạch cache build; nó không sửa lockfile sai.

## Phạm vi xác nhận

Bản ZIP đã được kiểm tra về sự hiện diện của cấu hình và lockfile, nhưng không thể cam kết APK build thành công trước khi EAS chạy với môi trường và biến môi trường của tài khoản của bạn. Các lỗi native sau bước cài dependencies cần xử lý riêng.


## Sửa lỗi EAS project ID và fingerprint chậm

- `app.config.ts` đã khai báo `extra.eas.projectId` cho EAS project hiện tại: `26498a61-9b87-4bc4-8007-978eebb77004`.
- Script build Termux dùng `EAS_SKIP_AUTO_FINGERPRINT=1` vì bước fingerprint có thể bị treo/chạy rất lâu trên môi trường này.
- Cảnh báo Node.js `localStorage is not available because --localstorage-file was not provided` tự nó không phải lỗi build. Theo dõi lỗi thực tế trong trang logs của EAS nếu Gradle thất bại.
