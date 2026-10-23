# ITIS Academy - E-Learning Platform Backend

**ITIS Academy** là một hệ thống backend được xây dựng trên nền tảng Spring Boot (Java 21) nhằm cung cấp các API dịch vụ cho một nền tảng học trực tuyến (E-Learning) tương tự như Udemy hay Coursera. Hệ thống được thiết kế với độ bảo mật cao, khả năng xử lý bất đồng bộ tốt và tích hợp các công nghệ lưu trữ, truyền thông điệp thời gian thực hiện đại.

---

## 🚀 Công Nghệ & Kỹ Thuật Sử Dụng

Dự án áp dụng các công nghệ và giải pháp kỹ thuật tiên tiến trong hệ sinh thái Java và Cloud:

### 1. Công Nghệ Cốt Lõi (Core Backend)
*   **Java 21**: Tận dụng các tính năng mới của phiên bản LTS (như Virtual Threads, Pattern Matching, Record patterns).
*   **Spring Boot 3.5.10**: Sử dụng các starter phổ biến bao gồm Web, Security, Mail, Validation, Data JPA, Data Redis.
*   **PostgreSQL**: Cơ sở dữ liệu quan hệ chính dùng để lưu trữ dữ liệu người dùng, khóa học, tiến độ và đăng ký học tập.
*   **Liquibase**: Quản lý và kiểm soát lịch sử thay đổi schema cơ sở dữ liệu (`db/changelog`), đảm bảo tính nhất quán giữa các môi trường phát triển và sản xuất.

### 2. Bảo Mật & Xác Thực (Security & Authentication)
*   **Spring Security & JWT (JSON Web Token)**: Triển khai cơ chế xác thực không trạng thái (Stateless).
*   **Double-token Mechanism**: 
    *   *Access Token*: Trả về trong JSON Response body dùng cho các yêu cầu API ngắn hạn.
    *   *Refresh Token*: Lưu trữ trong **HttpOnly Cookie** phía client nhằm tăng khả năng bảo mật chống lại các cuộc tấn công XSS (Cross-Site Scripting).
*   **OTP & Rate Limiting**: Sử dụng **Redis** để lưu mã OTP tạm thời cho luồng khôi phục mật khẩu (Quên mật khẩu) và cấu hình giới hạn tần suất gửi OTP (Rate Limiting) dựa trên địa chỉ email để chống spam/brute-force.

### 3. Lưu Trữ File & Media (Object Storage)
*   **MinIO**: Sử dụng MinIO Java SDK (`io.minio:minio`) để tích hợp và upload ảnh thumbnail khóa học hoặc tệp tin đa phương tiện lên MinIO Object Storage (self-hosted, chạy qua `docker-compose`).
*   **Presigned URLs**: Sinh các URL tạm thời có thời hạn (Presigned URL) trực tiếp từ server gửi cho client, giúp client tải tài nguyên trực tiếp một cách an toàn mà không cần load tải qua API Gateway/Backend Server.

### 4. Bất Đồng Bộ (Async)
*   **Async Processing (`@Async`)**: Gửi email thông báo (ví dụ: mã OTP đặt lại mật khẩu) bất đồng bộ thông qua `JavaMailSender`, không gây nghẽn (blocking) luồng xử lý API chính.

### 5. Tiện Ích & Công Cụ Khác
*   **MapStruct 1.6.3**: Tự động sinh mã nguồn ánh xạ (mapping) giữa Entity và DTO giúp nâng cao hiệu năng so với các thư viện reflection thông thường.
*   **Lombok**: Giảm thiểu boilerplate code (Getter, Setter, Constructor, Builder).
*   **Apache Commons CSV**: Đọc và ghi dữ liệu có cấu trúc từ file CSV (hỗ trợ import/export hàng loạt).
*   **Springdoc OpenAPI (Swagger UI)**: Tự động tạo tài liệu API tại đường dẫn `/swagger-ui.html` giúp quá trình phát triển frontend và tích hợp dễ dàng hơn.
*   **Docker & Docker Compose**: Đóng gói dự án (`Dockerfile`) và thiết lập nhanh môi trường phát triển (PostgreSQL, Redis, MinIO) bằng `docker-compose.yml`.

---

## ✨ Danh Sách Tính Năng (Features)

### 1. Các Tính Năng Hiện Tại (Core Features)
*   **Xác thực và Phân quyền**:
    *   Đăng ký, Đăng nhập, Đăng xuất tài khoản.
    *   Phân quyền chi tiết cho 3 nhóm đối tượng: `ADMIN` (Quản trị viên), `USER` (Học viên thông thường), và `ITIS_MEMBER` (Thành viên thuộc ITIS).
    *   Luồng đổi mật khẩu và cấp lại mật khẩu thông qua mã OTP bảo mật gửi qua Email.
*   **Quản Lý Khóa Học & Giáo Trình (Curriculum)**:
    *   Tìm kiếm, lọc danh sách khóa học (phân trang, lọc theo danh mục, độ khó, trạng thái).
    *   Tự động tạo Slug duy nhất và chuẩn hóa tiếng Việt cho khóa học (tốt cho SEO URL).
    *   Quản lý cấu trúc bài học 2 cấp: Phần học (`Section`) -> Bài học (`Lesson`).
    *   Thiết lập thuộc tính xem thử (`isPreview`) cho phép học viên trải nghiệm trước một số bài học mà không cần đăng ký.
    *   Upload và quản lý ảnh Thumbnail của khóa học qua MinIO Object Storage.
*   **Đăng Ký Học & Theo Dõi Tiến Độ**:
    *   Học viên đăng ký khóa học (`Enrollment`).
    *   Theo dõi tiến độ học tập: Đánh dấu hoàn thành bài học qua REST (`POST /api/v1/lessons/{lessonId}/complete`).
    *   Tính toán tự động phần trăm (%) hoàn thành khóa học dựa trên tổng số bài học và số bài học đã xem của từng cá nhân.

### 2. Các Tính Năng Định Hướng Tương Lai (Future Backlog)
*   **Hệ Thống Thanh Toán (Payment Gateway)**: Tích hợp cổng thanh toán trực tuyến (VNPAY, MoMo, Stripe) để xử lý thanh toán mua khóa học có phí.
*   **Video Streaming Bảo Mật**: Tích hợp các dịch vụ video chuyên nghiệp (như Cloudflare Stream, Vimeo Pro) hỗ trợ mã hóa luồng phát (HLS/DASH) và ngăn chặn việc tải lậu video.
*   **Học Tập Tương Tác (Interactivities)**: Thêm các bài trắc nghiệm nhanh (Quiz) và bài tập thực hành (Assignment) kèm chấm điểm tự động.
*   **Đánh Giá & Phản Hồi (Reviews & Ratings)**: Cho phép học viên đã đăng ký gửi đánh giá 5 sao kèm nhận xét dưới mỗi khóa học.
*   **Thống Kê Chi Tiết (Analytics Dashboard)**: Tạo bảng điều khiển cho giảng viên và admin thống kê doanh thu, số học viên mới, tỉ lệ hoàn thành bài học của học viên.
*   **Chứng Chỉ Hoàn Thành (Certificates)**: Tự động sinh file PDF chứng chỉ hoàn thành khóa học khi tiến độ của học viên đạt 100% và gửi email chúc mừng.
*   **Diễn Đàn Thảo Luận (Discussion Forum)**: Tạo mục thảo luận trực tiếp bên dưới mỗi bài học để học viên trao đổi bài với giảng viên và các bạn học khác.

---

## 📂 Các Module Chính Của Dự Án

Hệ thống được thiết kế theo hướng **Domain-Driven Design (DDD)** thu nhỏ, mỗi thư mục lớn đại diện cho một nghiệp vụ (Bounded Context) tự quản lý từ Entity, Repository, Service cho đến Controller.

```
src/main/java/vhuwng/itisacademy/
│
├── 🔑 Authentication & Security
│   ├── Authentication/         # Controller, Service đăng ký, đăng nhập, OTP, reset pass
│   ├── Security/               # Cấu hình Spring Security, JWT filter, UserPrincipal
│   ├── RefreshToken/           # Lưu trữ và gia hạn token
│   └── Otp/                    # Xử lý mã OTP lưu trên Redis kèm Rate Limiting
│
├── 📚 Course Curriculum
│   ├── Category/               # Phân loại danh mục khóa học (Lập trình, Marketing,...)
│   ├── Course/                 # Lõi thông tin khóa học (Tiêu đề, cấp độ, trạng thái, giá)
│   ├── Section/                # Các phần/chương học trong một khóa học
│   └── Lesson/                 # Các bài học chi tiết (chứa nội dung, video url, thời lượng)
│
├── 👥 User & Member
│   ├── User/                   # Quản lý tài khoản, thông tin cá nhân học viên/giảng viên
│   └── Role/                   # Định nghĩa nhóm vai trò trong hệ thống
│
├── ⏱️ Enrollment & Progress Tracking
│   ├── Enrollment/             # Ghi nhận việc đăng ký học của học viên vào khóa học
│   └── LessonProgress/         # Đánh dấu hoàn thành bài học và cập nhật % tiến độ khóa học
│
└── ☁️ Infrastructure & Integration
    ├── Storage/                # Quản lý kết nối MinIO (S3-compatible), sinh Presigned URL
    ├── Mail/                   # Dịch vụ gửi email template HTML bất đồng bộ
    └── common/                 # Cấu hình chung, xử lý lỗi tập trung (Global Exception), Enums
```

---

## 🛠️ Hướng Dẫn Chạy Dự Án (Local Development)

### 1. Chuẩn Bị Môi Trường
*   Yêu cầu đã cài đặt **Java 21 SDK** và **Maven**.
*   Đã cài đặt **Docker** & **Docker Compose** (Khuyên dùng để khởi chạy nhanh PostgreSQL, Redis và MinIO).

### 2. Cấu Hình Biến Môi Trường
Tạo file `.env` từ file mẫu `.env.example` ở thư mục gốc và điền các thông tin kết nối tương ứng:
```bash
cp .env.example .env
```
Các thông số cần cấu hình bao gồm:
*   `DATABASE_URL`, `POSTGRES_USER`, `POSTGRES_PASSWORD`: Thông tin kết nối PostgreSQL.
*   `REDIS_HOST`, `REDIS_PORT`: Thông tin kết nối Redis.
*   `JWT_SECRET`: Khóa bí mật dùng để ký token JWT (Tối thiểu 256-bit).
*   `MINIO_ENDPOINT`, `MINIO_ACCESS_KEY`, `MINIO_SECRET_KEY`, `MINIO_REGION`, `MINIO_URL`, `MINIO_BUCKET`: Thông tin kết nối MinIO Object Storage để tải/lưu file (thumbnail khóa học, video/subtitle bài học). Region mặc định `ap-southeast-1`.
*   `SMTP_HOST`, `SMTP_PORT`, `SMTP_USERNAME`, `SMTP_PASSWORD`: Cấu hình máy chủ SMTP gửi mail.

### 3. Khởi Chạy Các Dịch Vụ Hỗ Trợ
Nếu máy đã cài sẵn Docker, hãy chạy lệnh sau để khởi động PostgreSQL, Redis và MinIO:
```bash
docker-compose up -d
```
Sau khi khởi động, MinIO Console có thể truy cập tại `http://localhost:9001` (mặc định `minioadmin` / `minioadmin`). Service `minio-init` sẽ tạo bucket và mở quyền đọc public cho prefix `courses/` (thumbnail CDN); video/HLS vẫn private.

### 4. Chạy Ứng Dụng Spring Boot
Sử dụng Maven Wrapper đi kèm dự án để chạy ứng dụng:
*   Trên Linux/macOS:
    ```bash
    ./mvnw spring-boot:run
    ```
*   Trên Windows:
    ```cmd
    mvnw.cmd spring-boot:run
    ```

Khi ứng dụng khởi chạy thành công:
*   API sẽ phục vụ tại: `http://localhost:8080` (hoặc cổng bạn cấu hình).
*   Tài liệu API Swagger UI có thể truy cập tại: `http://localhost:8080/swagger-ui/index.html`
