# ITIS Academy — Nền tảng học trực tuyến

ITIS Academy là hệ thống học trực tuyến gồm **Backend Spring Boot / Java 21** và **Frontend Next.js**. Backend cung cấp API cho xác thực, quản lý khóa học, đăng ký học, theo dõi tiến độ và lưu trữ nội dung; Frontend cung cấp giao diện sử dụng hệ thống.

Hai dự án được gộp tại `D:\PTIT\TTTN\FINAL`: `itis-academy` đổi tên thành `Backend`, `itis-course` đổi tên thành `Frontend`.

## Mục lục

- [Cấu trúc source](#cau-truc-source)
- [Công nghệ và kỹ thuật](#cong-nghe)
- [Tính năng](#tinh-nang)
- [Các module Backend](#module-backend)
- [Chuẩn bị môi trường](#moi-truong)
- [Cấu hình](#cau-hinh)
- [Chạy hệ thống](#chay-he-thong)
- [Địa chỉ truy cập](#dia-chi-truy-cap)
- [Tài khoản thử nghiệm](#tai-khoan-thu-nghiem)
- [Dừng hệ thống và xem log](#dung-va-xem-log)
- [Định hướng phát triển](#dinh-huong)

<a id="cau-truc-source"></a>

## Cấu trúc source

```text
FINAL/
├── Backend/             # Spring Boot, Java 21, Maven Wrapper
├── Frontend/            # Next.js, React, TypeScript
├── docker-compose.yml   # Ứng dụng và các dịch vụ hỗ trợ
├── .env.example         # Cấu hình mẫu cho môi trường local
├── .env                 # Cấu hình đang sử dụng, không đưa vào Git
├── start.ps1            # Khởi động hệ thống
├── stop.ps1             # Dừng hệ thống
├── .runtime/            # Log và thông tin tiến trình khi chạy local
└── README.md
```

Các lệnh trong tài liệu này được chạy tại thư mục `FINAL`, trừ khi có ghi chú khác. Khi chạy source đã gộp, sử dụng `docker-compose.yml` ở thư mục này.

<a id="cong-nghe"></a>

## Công nghệ và kỹ thuật

### Nền tảng ứng dụng

| Thành phần | Công nghệ | Vai trò |
| --- | --- | --- |
| Backend | Java 21, Spring Boot 3.5.10 | Cung cấp API; sử dụng các starter Web, Security, Mail, Validation, Data JPA và Data Redis |
| Frontend | Next.js 16.2.9, React 19.2.4, TypeScript | Xây dựng giao diện web |
| Giao diện và dữ liệu phía client | Tailwind CSS, TanStack Query | Định dạng giao diện và quản lý truy vấn dữ liệu |
| Database | PostgreSQL | Lưu người dùng, khóa học, đăng ký học và tiến độ |
| Database migration | Liquibase | Quản lý lịch sử thay đổi schema trong `Backend/src/main/resources/db/changelog` |
| Cache và hàng đợi | Redis | Lưu OTP, phục vụ giới hạn tần suất và hàng đợi chuyển mã video |
| Lưu trữ file | MinIO | Lưu thumbnail, video, phụ đề và các tệp đa phương tiện |
| Email local | Mailpit | Nhận email thử nghiệm và OTP trên máy |
| Môi trường chạy | Docker, Docker Compose | Khởi động các dịch vụ hỗ trợ hoặc toàn bộ ứng dụng |

### Bảo mật và xác thực

- **Spring Security và JWT**: xác thực không trạng thái, kết hợp phân quyền theo vai trò.
- **Access token**: trả về trong JSON response để sử dụng cho các yêu cầu API.
- **Refresh token**: lưu trong cookie `HttpOnly`, phục vụ việc gia hạn phiên đăng nhập.
- **OTP và rate limiting**: dùng Redis để lưu OTP có thời hạn và giới hạn tần suất yêu cầu, bao gồm luồng quên mật khẩu.

### Lưu trữ, media và xử lý bất đồng bộ

- **MinIO Java SDK** (`io.minio:minio`): upload và quản lý file trên object storage.
- **Presigned URL**: cấp URL truy cập tài nguyên có thời hạn, giúp client tải file trực tiếp từ storage.
- **FFmpeg / FFprobe**: hỗ trợ xử lý và chuyển mã video; worker sử dụng hàng đợi Redis.
- **WebSocket / STOMP**: hỗ trợ cập nhật trạng thái theo thời gian thực.
- **`@Async` và `JavaMailSender`**: gửi email thông báo, OTP bất đồng bộ.

### Công cụ hỗ trợ

| Công cụ | Vai trò |
| --- | --- |
| MapStruct 1.6.3 | Sinh mã ánh xạ giữa entity và DTO |
| Lombok | Giảm mã lặp cho getter, setter, constructor và builder |
| Apache Commons CSV | Đọc, ghi CSV phục vụ import/export dữ liệu |
| Springdoc OpenAPI / Swagger UI | Cung cấp tài liệu và giao diện thử API |
| Maven Wrapper | Build và chạy Backend mà không cần cài Maven riêng |

<a id="tinh-nang"></a>

## Tính năng

### Xác thực và quản lý người dùng

- Đăng ký, đăng nhập và đăng xuất tài khoản.
- Phân quyền theo ba nhóm: `ADMIN`, `USER` và `ITIS_MEMBER`.
- Đổi mật khẩu, khôi phục mật khẩu bằng OTP gửi qua email.
- Quản lý thông tin cá nhân của người dùng.

### Khóa học và giáo trình

- Tìm kiếm, lọc và phân trang khóa học theo danh mục, cấp độ, trạng thái.
- Tạo slug duy nhất và chuẩn hóa tiếng Việt cho khóa học.
- Quản lý giáo trình theo cấu trúc phần học (`Section`) → bài học (`Lesson`).
- Thiết lập bài học xem thử bằng thuộc tính `isPreview`.
- Upload, quản lý thumbnail và nội dung đa phương tiện qua MinIO.

### Đăng ký học và theo dõi tiến độ

- Đăng ký tham gia khóa học (`Enrollment`).
- Đánh dấu hoàn thành bài học qua `POST /api/v1/lessons/{lessonId}/complete`.
- Tính phần trăm hoàn thành dựa trên số bài học đã hoàn thành và tổng số bài học của khóa học.

### Các module chức năng bổ sung trong source

Source hiện có các module trắc nghiệm (`Topic`, `Quiz`, `Question`, `QuizOption`, `QuizAttempt`), đánh giá khóa học (`Review`), kiểm soát truy cập nội dung (`ContentAccess`) và chuyển mã video (`VideoTranscode`). Các hướng mở rộng của những chức năng này nằm ở phần [Định hướng phát triển](#dinh-huong).

<a id="module-backend"></a>

## Các module Backend

Backend tổ chức mã nguồn theo từng nghiệp vụ trong `Backend/src/main/java/vhuwng/itisacademy/`. Mỗi module tập hợp các thành phần liên quan như controller, service, repository, entity và DTO.

| Nhóm nghiệp vụ | Module / đường dẫn | Trách nhiệm |
| --- | --- | --- |
| Xác thực và bảo mật | `Authentication/`, `Security/`, `RefreshToken/` | Đăng ký, đăng nhập, JWT, cookie và gia hạn token |
| OTP và giới hạn tần suất | `Otp/`, `ratelimit/` | OTP trong Redis và giới hạn yêu cầu |
| Khóa học và giáo trình | `Category/`, `Course/`, `Section/`, `Lesson/` | Danh mục, khóa học, phần học và bài học |
| Người dùng và vai trò | `User/`, `common/enums/Role.java` | Thông tin người dùng và các vai trò |
| Đăng ký học và tiến độ | `Enrollment/`, `LessonProgress/` | Đăng ký khóa học, hoàn thành bài học và tiến độ |
| Trắc nghiệm | `Topic/`, `Quiz/`, `Question/`, `QuizOption/`, `QuizAttempt/` | Chủ đề, bộ câu hỏi, lựa chọn và lượt làm bài |
| Đánh giá | `Review/` | Đánh giá và phản hồi về khóa học |
| Nội dung và video | `ContentAccess/`, `VideoTranscode/` | Kiểm soát truy cập nội dung và xử lý video |
| Lưu trữ và email | `Storage/`, `Mail/` | Kết nối MinIO, presigned URL và gửi email |
| Thành phần dùng chung | `common/` | Cấu hình, xử lý lỗi, enum và tích hợp dùng chung |

<a id="moi-truong"></a>

## Chuẩn bị môi trường

| Yêu cầu | Chạy Java/Node local + dịch vụ Docker | Chạy toàn bộ bằng Docker |
| --- | --- | --- |
| Docker Desktop với Linux containers và Docker Compose | Bắt buộc | Bắt buộc |
| JDK 21 | Bắt buộc trên máy | Được cung cấp trong image |
| Node.js 20.9+ và npm | Bắt buộc trên máy | Được cung cấp trong image |
| Maven | Dùng Maven Wrapper trong `Backend/` | Được cung cấp trong image build |
| FFmpeg và FFprobe | Cần có trong PATH để chuyển mã video | Dockerfile Backend có bước cài đặt |

Các script `.ps1` dành cho Windows PowerShell. `start.ps1` sử dụng `JAVA_HOME`; nếu chưa có đường dẫn hợp lệ, script tìm JDK 21 trong `%USERPROFILE%\.jdks`.

<a id="cau-hinh"></a>

## Cấu hình

### File môi trường

`start.ps1` tự tạo `.env` từ `.env.example` nếu file chưa tồn tại. Nếu muốn chỉnh cấu hình trước khi chạy, mở PowerShell tại `FINAL` và thực hiện:

```powershell
if (-not (Test-Path .env)) {
    Copy-Item .env.example .env
}
```

`.env` không được đưa vào Git. Các nhóm cấu hình chính:

| Nhóm | Biến môi trường |
| --- | --- |
| Cổng ứng dụng | `FRONTEND_PORT`, `APP_PORT` |
| PostgreSQL | `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`, `POSTGRES_PORT` |
| Redis | `REDIS_PORT` |
| JWT | `JWT_SECRET`, `JWT_EXPIRATION_MS`, `JWT_REFRESH_TOKEN_EXPIRATION_MS` |
| CORS và cookie | `CORS_ALLOWED_ORIGINS`, `COOKIE_SECURE`, `COOKIE_SAME_SITE` |
| API phía Frontend | `NEXT_PUBLIC_API_URL` |
| MinIO | `MINIO_ACCESS_KEY`, `MINIO_SECRET_KEY`, `MINIO_REGION`, `MINIO_BUCKET`, `MINIO_PORT`, `MINIO_CONSOLE_PORT`, `MINIO_URL`, `CDN_URL` |
| Email | `SMTP_HOST`, `SMTP_PORT`, `SMTP_USERNAME`, `SMTP_PASSWORD`, `EMAIL_FROM`, `MAIL_UI_PORT`, `MAIL_SMTP_PORT` |
| Múi giờ Java | `JAVA_TOOL_OPTIONS` |

`JWT_SECRET` là khóa ký token, cần có độ dài tối thiểu 256 bit. MinIO sử dụng region mặc định `ap-southeast-1` trong cấu hình local.

### Kết nối giữa các dịch vụ

`start.ps1` và Docker Compose thiết lập `DATABASE_URL`, `REDIS_HOST`, `MINIO_ENDPOINT` theo chế độ chạy. Khi chạy local, script kết nối tới các cổng trên `localhost`; khi chạy Backend trong Docker, Compose sử dụng tên service như `postgres`, `redis`, `minio`.

Database được tạo riêng trong Docker volume, mặc định mở cổng `5433` trên máy để tránh xung đột với PostgreSQL tại cổng `5432`. Thông tin đăng nhập PostgreSQL và MinIO lấy từ `.env`.

Service `minio-init` tạo bucket và mở quyền đọc công khai cho prefix `courses/` phục vụ thumbnail. Video/HLS ngoài prefix này giữ quyền truy cập riêng tư.

### Email, cookie và thay đổi cổng

Email thử nghiệm được chuyển tới Mailpit, không gửi đến hộp thư thật. Khi chạy local, script thiết lập SMTP qua `localhost` và `MAIL_SMTP_PORT`.

Cookie local dùng `SameSite=Lax`, `Secure=false` để đăng nhập và làm mới phiên trên HTTP localhost. Mặc định Backend cho triển khai HTTPS vẫn là `SameSite=None`, `Secure=true`.

Nếu đổi cổng Frontend, Backend hoặc MinIO, cập nhật đồng thời các biến liên quan: `CORS_ALLOWED_ORIGINS`, `NEXT_PUBLIC_API_URL`, `MINIO_URL`, `CDN_URL`. Các cổng Docker trong Compose chỉ mở trên máy local; cấu hình này dành cho phát triển.

<a id="chay-he-thong"></a>

## Chạy hệ thống

### Cách 1: Java/Node local và các dịch vụ dữ liệu trong Docker

Mở PowerShell tại thư mục source chung:

```powershell
Set-Location D:\PTIT\TTTN\FINAL
.\start.ps1
```

Script thực hiện:

1. Đọc cấu hình `.env`, kiểm tra các cổng ứng dụng.
2. Khởi động PostgreSQL, Redis, MinIO và Mailpit trong Docker.
3. Khởi tạo bucket MinIO.
4. Build Backend bằng Maven Wrapper và cài dependencies Frontend nếu chưa có.
5. Chạy Backend và Frontend ở nền, chờ ứng dụng sẵn sàng.

Nếu Backend đã build và chưa sửa code:

```powershell
.\start.ps1 -SkipBuild
```

Frontend chạy development và tự cập nhật khi sửa source. Sau khi sửa Backend, dừng rồi khởi động lại để build bản mới:

```powershell
.\stop.ps1
.\start.ps1
```

Đây là cách chạy đã được kiểm tra trên máy local. Log và thông tin tiến trình nằm trong `.runtime/` để `stop.ps1` dừng đúng các tiến trình của source này.

### Cách 2: Chạy toàn bộ bằng Docker

Nếu đang chạy hệ thống theo cách 1, dùng `stop.ps1` trước khi chuyển chế độ để giải phóng các cổng ứng dụng.

```powershell
.\start.ps1 -Docker
```

Hoặc chạy trực tiếp Compose sau khi đã tạo `.env`:

```powershell
docker compose up -d --build --wait --wait-timeout 300
```

Lần đầu cần tải và build thêm image Java/Node cùng dependencies, có thể mất nhiều thời gian. Frontend chạy development trong container; sau khi sửa source cần build lại image.

Cấu hình Docker đã được chuẩn bị. Phiên chạy đã kiểm tra trên máy này sử dụng Java/Node local và các dịch vụ dữ liệu Docker.

### Chạy riêng Backend bằng Maven Wrapper

Nếu cần chạy Backend riêng để phát triển hoặc debug, vào thư mục `Backend` và cung cấp đầy đủ biến môi trường phù hợp với các dịch vụ đang chạy. Maven Wrapper không tự đọc file `.env` ở thư mục `FINAL` như `start.ps1`.

Windows PowerShell:

```powershell
Set-Location Backend
.\mvnw.cmd spring-boot:run
```

Linux/macOS, từ thư mục `Backend`:

```bash
./mvnw spring-boot:run
```

Đặt `SPRING_DOCKER_COMPOSE_ENABLED=false` nếu dùng các dịch vụ đã khởi động bằng Compose ở thư mục `FINAL`. Dừng instance Backend hiện tại trước khi chạy riêng để tránh trùng cổng.

<a id="dia-chi-truy-cap"></a>

## Địa chỉ truy cập

Các địa chỉ mặc định khi chạy trên máy local:

| Dịch vụ | Địa chỉ |
| --- | --- |
| Giao diện | http://localhost:3000 |
| Backend API | http://localhost:8080 |
| Swagger UI | http://localhost:8080/swagger-ui/index.html |
| Kiểm tra Backend | http://localhost:8080/actuator/health |
| Hộp thư local / OTP | http://localhost:8025 |
| SMTP local | `localhost:1025` |
| MinIO API | http://localhost:9000 |
| MinIO Console | http://localhost:9001 |
| PostgreSQL | `localhost:5433` |
| Redis | `localhost:6379` |

<a id="tai-khoan-thu-nghiem"></a>

## Tài khoản thử nghiệm

Tài khoản học viên đã tạo khi kiểm tra trên database local của máy này:

| Thông tin | Giá trị |
| --- | --- |
| Username | `local_demo` |
| Password | `LocalDemo@2026` |
| Email | `local-demo@example.test` |

Có thể đăng ký tài khoản mới tại http://localhost:3000/register. Tài khoản demo không được tự động seed khi tạo database khác. Email quên mật khẩu xuất hiện trong Mailpit tại http://localhost:8025.

<a id="dung-va-xem-log"></a>

## Dừng hệ thống và xem log

Dừng các tiến trình ứng dụng local và dịch vụ Docker:

```powershell
.\stop.ps1
```

Kiểm tra trạng thái các container:

```powershell
docker compose ps
```

Xem log ứng dụng khi chạy local:

```powershell
Get-Content .runtime/backend.log -Tail 50
Get-Content .runtime/backend-error.log -Tail 50
Get-Content .runtime/frontend.log -Tail 50
Get-Content .runtime/frontend-error.log -Tail 50
```

Xem log ứng dụng khi chạy toàn bộ bằng Docker:

```powershell
docker compose logs --tail 100 backend frontend
```

`stop.ps1` giữ nguyên dữ liệu. `docker compose down` cũng giữ các named volume; không thêm `-v` nếu cần giữ database và file đã upload.

<a id="dinh-huong"></a>

## Định hướng phát triển

Các hướng bổ sung hoặc mở rộng chức năng:

| Hạng mục | Định hướng |
| --- | --- |
| Thanh toán | Tích hợp VNPAY, MoMo hoặc Stripe cho khóa học có phí |
| Video streaming | Mở rộng bảo vệ nội dung và tích hợp dịch vụ video như Cloudflare Stream hoặc Vimeo Pro; xem xét HLS/DASH và kiểm soát truy cập |
| Học tập tương tác | Mở rộng trắc nghiệm, bổ sung bài tập thực hành và chấm điểm tự động |
| Đánh giá và phản hồi | Hoàn thiện trải nghiệm đánh giá 5 sao, nhận xét và quản lý phản hồi khóa học |
| Thống kê | Dashboard doanh thu, học viên mới và tỷ lệ hoàn thành khóa học |
| Chứng chỉ | Sinh PDF chứng chỉ và gửi email khi học viên hoàn thành khóa học |
| Thảo luận | Trao đổi giữa học viên và giảng viên bên dưới bài học |
