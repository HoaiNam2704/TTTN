# ITIS — Backend và Frontend

Source chung tại `D:\PTIT\TTTN\FINAL`:

- `Backend/`: dự án Spring Boot / Java 21, trước đây là `itis-academy`.
- `Frontend/`: dự án Next.js, trước đây là `itis-course`.
- `docker-compose.yml`: chạy cả ứng dụng và PostgreSQL, Redis, MinIO, Mailpit.
- `.env.example`: cấu hình chạy local; `.env` không được đưa vào Git.

## Chạy hệ thống

Cần Docker Desktop đang chạy Linux containers, Node.js 20.9+ và JDK 21.
Script dùng `JAVA_HOME`, hoặc tìm JDK 21 trong `%USERPROFILE%\.jdks`.
Mở PowerShell tại thư mục này:

```powershell
.\start.ps1
```

`start.ps1` chạy PostgreSQL, Redis, MinIO và Mailpit trong Docker, build Backend
bằng Maven Wrapper, rồi chạy Backend và Frontend ở nền trên Windows. Frontend
tự cập nhật khi sửa source. Sau khi sửa Backend, chạy `stop.ps1` rồi `start.ps1`.
Nếu Backend đã build và chưa sửa code, dùng `start.ps1 -SkipBuild`.

Log ứng dụng nằm trong `.runtime/`. Các tiến trình được ghi nhận để `stop.ps1`
dừng đúng ứng dụng của source này.

## Tùy chọn chạy hoàn toàn bằng Docker

```powershell
.\start.ps1 -Docker
```

Hoặc chạy trực tiếp Compose:

```powershell
Copy-Item .env.example .env  # chỉ thực hiện lần đầu nếu chưa có .env
docker compose up -d --build --wait --wait-timeout 300
```

Chế độ này cần tải và build thêm image Java/Node cùng dependencies, có thể mất
nhiều thời gian ở lần đầu. Frontend chạy development trong container; sau khi sửa
source phải build lại. Cấu hình Docker đã được chuẩn bị; phiên chạy đã kiểm tra
trên máy này dùng Java/Node local và các dịch vụ dữ liệu Docker.

Chức năng chuyển mã video cần `ffmpeg` và `ffprobe` trong PATH khi chạy local.
Image Backend Docker có bước cài hai công cụ này.

## Địa chỉ truy cập

| Dịch vụ | Địa chỉ |
| --- | --- |
| Giao diện | http://localhost:3000 |
| Backend API | http://localhost:8080 |
| Swagger | http://localhost:8080/swagger-ui/index.html |
| Kiểm tra backend | http://localhost:8080/actuator/health |
| Hộp thư local / OTP | http://localhost:8025 |
| SMTP local | localhost:1025 |
| MinIO Console | http://localhost:9001 |
| PostgreSQL | localhost:5433 |
| Redis | localhost:6379 |

Thông tin đăng nhập PostgreSQL và MinIO nằm trong `.env`. Database được tạo riêng
trong Docker volume; không sử dụng PostgreSQL có sẵn trên cổng 5432 của máy.
Email thử nghiệm được chuyển tới Mailpit, không gửi đến hộp thư thật.
Cookie local dùng `SameSite=Lax`, `Secure=false` để đăng nhập và làm mới phiên
hoạt động trên HTTP localhost. Mặc định Backend cho triển khai HTTPS vẫn là
`SameSite=None`, `Secure=true`.

Nếu đổi cổng frontend/backend/MinIO trong `.env`, cập nhật đồng thời
`CORS_ALLOWED_ORIGINS`, `NEXT_PUBLIC_API_URL`, `MINIO_URL` và `CDN_URL` tương ứng.
Các cổng Docker chỉ mở trên máy local; cấu hình này dành cho phát triển.

## Dừng và xem log

```powershell
.\stop.ps1
docker compose ps
Get-Content .runtime/backend.log -Tail 50
Get-Content .runtime/frontend.log -Tail 50
```

`stop.ps1` giữ nguyên dữ liệu. `docker compose down` cũng giữ các named volume;
không thêm `-v` nếu cần giữ database và file đã upload.

## Tài khoản thử nghiệm local

Tài khoản học viên đã tạo khi kiểm tra trên database local của máy này:

- Username: `local_demo`
- Password: `LocalDemo@2026`
- Email: `local-demo@example.test`

Có thể đăng ký tài khoản mới tại `/register`. Tài khoản demo không được tự động
seed khi tạo database khác. Email quên mật khẩu xuất hiện trong Mailpit.

## Git và source gốc

Thư mục `FINAL` là một Git repository chung, chưa tạo commit hay cấu hình remote.
Git metadata gốc của hai dự án được giữ tại:
`D:\PTIT\TTTN\FINAL-git-backup-20261023-120107`.

Các cấu hình triển khai cũ trong `Backend` được giữ để tham khảo. Khi chạy hệ thống
đã gộp, sử dụng Compose tại thư mục `FINAL`.

MinIO dùng image được build từ source MinIO bởi
[coollabsio/minio](https://github.com/coollabsio/minio), cố định release
`RELEASE.2025-10-15T17-29-55Z`, vì các image `minio/minio` và `minio/mc` cũ
không còn tải được tại thời điểm thiết lập.
# Th-c-T-p-T-t-Nghi-p
