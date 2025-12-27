# BÁO CÁO ĐỒ ÁN MÔN HỌC

## TRANG BÌA

**TRƯỜNG ĐẠI HỌC [TÊN TRƯỜNG]**
**KHOA [TÊN KHOA]**

---

### **ĐỒ ÁN MÔN HỌC**

## **ĐỀ TÀI: XÂY DỰNG MẠNG XÃ HỘI MINI (MINISOCIALNETWORK)**

---

**Loại báo cáo:** Báo cáo đồ án môn học

**Sinh viên thực hiện:**
1. [Họ và tên] – [MSSV]
2. [Họ và tên] – [MSSV]

**Giảng viên hướng dẫn:**
[Học hàm/Học vị] [Họ và tên giảng viên]

**Năm học:** 2024 – 2025
**Học kỳ:** 7

---

## NHẬN XÉT & ĐÁNH GIÁ

### 1. Nhận xét của giảng viên hướng dẫn
...................................................................................................................................
...................................................................................................................................
...................................................................................................................................
...................................................................................................................................
...................................................................................................................................

### 2. Nhận xét của giảng viên phản biện (nếu có)
...................................................................................................................................
...................................................................................................................................
...................................................................................................................................

### 3. Điểm số
Bằng số: .....................  Bằng chữ: .......................................

---

## LỜI CAM ĐOAN

Chúng tôi xin cam đoan đây là công trình nghiên cứu và thực hiện của nhóm đồ án. Các kết quả nêu trong báo cáo là trung thực và chưa từng được công bố trong bất kỳ công trình nào khác.

Mọi tài liệu tham khảo, trích dẫn đều được ghi rõ nguồn gốc. Nếu phát hiện có sự sao chép không hợp lệ, chúng tôi xin chịu hoàn toàn trách nhiệm trước Hội đồng đánh giá và Nhà trường.

**Sinh viên thực hiện**
*(Ký và ghi rõ họ tên)*

---

## LỜI CẢM ƠN

Trước tiên, chúng tôi xin gửi lời cảm ơn chân thành đến Ban Giám hiệu trường Đại học [Tên Trường] và các thầy cô trong Khoa [Tên Khoa] đã tạo điều kiện thuận lợi cho chúng tôi trong suốt quá trình học tập và nghiên cứu.

Đặc biệt, chúng tôi xin bày tỏ lòng biết ơn sâu sắc đến giảng viên hướng dẫn – Thầy/Cô [Tên GVHD] đã tận tình chỉ bảo, định hướng và góp ý kiến quý báu để chúng tôi có thể hoàn thành đồ án này.

Cuối cùng, xin cảm ơn gia đình, bạn bè đã luôn động viên, hỗ trợ chúng tôi trong thời gian qua.

Trân trọng.

---

## MỤC LỤC

1. [Chương 1. Giới thiệu đề tài](#chương-1-giới-thiệu-đề-tài)
2. [Chương 2. Cơ sở lý thuyết & công nghệ](#chương-2-cơ-sở-lý-thuyết--công-nghệ)
3. [Chương 3. Phân tích và thiết kế hệ thống](#chương-3-phân-tích-và-thiết-kế-hệ-thống)
4. [Chương 4. Xây dựng và triển khai hệ thống](#chương-4-xây-dựng-và-triển-khai-hệ-thống)
5. [Chương 5. Kiểm thử và đánh giá](#chương-5-kiểm-thử-và-đánh-giá)
6. [Chương 6. Kết luận và hướng phát triển](#chương-6-kết-luận-và-hướng-phát-triển)
7. [Tài liệu tham khảo](#tài-liệu-tham-khảo)

---

## NỘI DUNG CHÍNH

### Chương 1. Giới thiệu đề tài

#### 1.1. Lý do chọn đề tài
Trong kỷ nguyên số, mạng xã hội đã trở thành một phần không thể thiếu trong đời sống hàng ngày, thay đổi cách con người kết nối, chia sẻ thông tin và giải trí.
Tuy nhiên, việc xây dựng một mạng xã hội hoàn chỉnh đòi hỏi kiến thức sâu rộng về nhiều lĩnh vực như kiến trúc hệ thống, cơ sở dữ liệu, bảo mật và trải nghiệm người dùng.
Đồ án "Xây dựng Mạng xã hội Mini" được thực hiện nhằm mục đích nghiên cứu và áp dụng các công nghệ lập trình web hiện đại (Spring Boot, Angular, Docker) để giải quyết bài toán cốt lõi của một mạng xã hội: kết nối và chia sẻ. Đây cũng là cơ hội để củng cố kiến thức về kiến trúc Microservices (hoặc Monolithic được dockerize), quản lý dữ liệu và triển khai ứng dụng.

#### 1.2. Mục tiêu đề tài
**Mục tiêu tổng quát:**
- Xây dựng một website mạng xã hội hoạt động ổn định với các chức năng cơ bản.
- Hiểu và vận dụng quy trình phát triển phần mềm chuyên nghiệp.

**Mục tiêu cụ thể:**
- **Chức năng:** Đăng ký/đăng nhập, cập nhật thông tin cá nhân, đăng bài viết (kèm ảnh), bình luận, thả tim (like), kết bạn/theo dõi.
- **Kỹ thuật:** Sử dụng Spring Boot làm Backend API, Angular làm Frontend, MySQL lưu trữ dữ liệu, Keycloak quản lý định danh (Identity Provider), và Docker để đóng gói triển khai.

#### 1.3. Đối tượng & phạm vi nghiên cứu
- **Đối tượng sử dụng:** Người dùng internet có nhu cầu kết nối, chia sẻ nội dung cá nhân.
- **Phạm vi chức năng:** Tập trung vào các tính năng cốt lõi của mạng xã hội (Newfeed, Profile, Post interaction). Chưa bao gồm các tính năng nâng cao như Chat realtime (nếu chưa làm), Livestream hay AI gợi ý nội dung phức tạp.

#### 1.4. Phương pháp thực hiện
- Sử dụng mô hình thác nước (Waterfall) hoặc Agile/Scrum đơn giản để quản lý tiến độ.
- Phân tích yêu cầu -> Thiết kế CSDL -> Lập trình Backend -> Lập trình Frontend -> Tích hợp & Kiểm thử.
- Tham khảo tài liệu chính hãng của Spring, Angular và các mẫu thiết kế UI/UX hiện đại.

#### 1.5. Bố cục báo cáo
Báo cáo gồm 6 chương đi từ tổng quan lý thuyết, phân tích thiết kế đến hiện thực hóa và đánh giá kết quả.

---

### Chương 2. Cơ sở lý thuyết & công nghệ

#### 2.1. Cơ sở lý thuyết
- **RESTful API:** Nguyên lý thiết kế API phổ biến giúp giao tiếp giữa Client và Server.
- **Single Page Application (SPA):** Mô hình ứng dụng web giúp trải nghiệm người dùng mượt mà, giảm tải cho server.
- **Containerization (Docker):** Công nghệ đóng gói ứng dụng giúp đồng nhất môi trường phát triển và triển khai.
- **OAuth2 / OpenID Connect:** Chuẩn ủy quyền và xác thực an toàn, được các hệ thống lớn sử dụng.

#### 2.2. Công nghệ sử dụng
Dựa trên quá trình khảo sát thực tế dự án, nhóm sử dụng các công nghệ sau:

- **Backend:**
  - **Language:** Java 17+
  - **Framework:** Spring Boot (Spring Web, Spring Data JPA, Spring Security).
  - Nhiệm vụ: Xử lý nghiệp vụ, cung cấp REST API.

- **Frontend:**
  - **Framework:** Angular (TypeScript).
  - Nhiệm vụ: Xây dựng giao diện người dùng tương tác, gọi API backend.

- **Database & Storage:**
  - **MySQL 8.0:** Hệ quản trị cơ sở dữ liệu quan hệ (RDBMS) để lưu thông tin user, bài viết, comment.
  - **MinIO / Cloudinary:** Lưu trữ file (hình ảnh, video) của người dùng.

- **Authentication & Security:**
  - **Keycloak:** Server quản lý định danh và truy cập (IAM) mã nguồn mở, hỗ trợ SSO, OAuth2.

- **Công cụ & DevOps:**
  - **Docker & Docker Compose:** Quản lý các service (MySQL, Backend, Frontend, Keycloak, MinIO) trong môi trường container.
  - **Git/GitHub:** Quản lý mã nguồn.
  - **Postman:** Kiểm thử API.
  - **VS Code / IntelliJ IDEA:** IDE phát triển.

#### 2.3. Lý do lựa chọn công nghệ
- **Spring Boot & Angular:** Là cặp đôi công nghệ Enterprise phổ biến, mạnh mẽ, cộng đồng hỗ trợ lớn và tính ổn định cao.
- **MySQL:** Phổ biến, dễ sử dụng, phù hợp với dữ liệu có cấu trúc quan hệ rõ ràng trong mạng xã hội.
- **Docker:** Giúp việc cài đặt môi trường (đặc biệt là Keycloak và MinIO) trở nên dễ dàng, tránh lỗi "works on my machine".
- **Keycloak:** Giúp tách biệt phần xử lý đăng nhập/bảo mật khỏi code nghiệp vụ chính, tăng tính bảo mật và khả năng mở rộng.

---

### Chương 3. Phân tích và thiết kế hệ thống

#### 3.1. Phân tích yêu cầu
**Stakeholders:**
- Người dùng thường (Member): Sử dụng tính năng MXH.
- Quản trị viên (Admin): Quản lý người dùng, bài viết (nếu có).

**Yêu cầu chức năng:**
1.  **Quản lý tài khoản:** Đăng ký, đăng nhập (qua Keycloak), xem/sửa hồ sơ, đổi avatar.
2.  **Quản lý bài viết:** Tạo bài viết mới (text + ảnh), xem danh sách bài viết (Newfeed), xóa bài.
3.  **Tương tác:** Like/Unlike bài viết, Bình luận bài viết.
4.  **Kết nối:** Follow/Unfollow người dùng khác, tìm kiếm người dùng.

**Yêu cầu phi chức năng:**
- Giao diện Responsive (thích ứng mobile/desktop).
- Bảo mật thông tin người dùng.
- Tốc độ tải trang nhanh.

#### 3.2. Sơ đồ Use Case
*(Sinh viên chèn hình ảnh Sơ đồ Use Case tổng quát tại đây)*
- Use Case Đăng nhập/Đăng ký.
- Use Case Quản lý bài viết (CRUD).
- Use Case Tương tác (Like, Comment).

#### 3.3. Thiết kế hệ thống
**Sơ đồ kiến trúc tổng thể:**
Hệ thống hoạt động theo mô hình Client-Server với cấu trúc Container:
- **Client (Browser):** Chạy ứng dụng Angular.
- **Gateway/Proxy:** Nginx hoặc API Gateway (nếu có).
- **Identity Provider:** Keycloak.
- **Application Server:** Spring Boot Container.
- **Database Server:** MySQL Container.
- **File Server:** MinIO Container.

*(Sinh viên chèn hình ảnh sơ đồ kiến trúc tại đây)*

**Sơ đồ CSDL (ERD):**
Các bảng chính dự kiến:
- `users`: Lưu thông tin profile (id, username, email, avatar...).
- `posts`: Lưu nội dung bài viết, ảnh, người đăng.
- `comments`: Lưu nội dung bình luận, người bình luận, bài viết đích.
- `likes`: Lưu trạng thái like của user với post.
- `follows`: Lưu quan hệ theo dõi giữa các user.

*(Sinh viên chèn hình ảnh ERD tại đây)*

#### 3.4. Thiết kế chi tiết
- **Sequence Diagram:** Mô tả luồng Đăng nhập hoặc Luồng Đăng bài.
- **Class Diagram:** Mô tả các Entity (User, Post, Comment) và Controller/Service tương ứng trong Spring Boot.

---

### Chương 4. Xây dựng và triển khai hệ thống

#### 4.1. Mô hình triển khai
Môi trường phát triển sử dụng **Docker Compose**. File `docker-compose.yml` định nghĩa các services:
- `mysql`: Database.
- `keycloak`: Authentication Server.
- `minio`: Object Storage (giả lập AWS S3).
- `backend`: Ứng dụng Spring Boot.
- `frontend`: Ứng dụng Angular.

Lệnh khởi chạy: `docker-compose up -d --build`

#### 4.2. Thiết kế CSDL (Chi tiết)
Mô tả chi tiết các bảng trong MySQL:
- Bảng **User**: `id` (PK), `username`, `email`, `first_name`, `last_name`...
- Bảng **Post**: `id` (PK), `content`, `image_url`, `created_at`, `user_id` (FK)...
- Bảng **Comment**: `id`, `content`, `post_id`, `user_id`...

#### 4.3. Mô tả các chức năng chính
**1. Đăng nhập / Đăng ký:**
- Sử dụng trang login của Keycloak hoặc form custom gọi API Keycloak.
- Token (JWT) được trả về và lưu ở LocalStorage/Cookie để xác thực các request sau đó.

**2. Trang chủ (Newfeed):**
- Hiển thị danh sách bài viết của người mình follow hoặc bài viết mới nhất.
- Tại mỗi bài viết có nút Like, nút Comment.

**3. Đăng bài viết:**
- Người dùng nhập text, chọn ảnh.
- Ảnh được upload lên MinIO/Cloudinary -> lấy URL.
- URL và text được gửi về Backend để lưu vào DB.

**4. API Tiêu biểu:**
- `GET /api/posts`: Lấy danh sách bài viết.
- `POST /api/posts`: Tạo bài viết mới.
- `POST /api/posts/{id}/like`: Like bài viết.
- `GET /api/users/{id}`: Lấy thông tin user.

#### 4.4. Giao diện hệ thống
*(Khu vực dành cho Screenshot các màn hình thực tế của ứng dụng)*
- Hình 1: Màn hình Đăng nhập.
- Hình 2: Màn hình Trang chủ (Newfeed).
- Hình 3: Màn hình Trang cá nhân (Profile).
- Hình 4: Chức năng Đăng bài và Bình luận.

---

### Chương 5. Kiểm thử và đánh giá

#### 5.1. Chiến lược kiểm thử
- **Unit Test:** Kiểm tra các hàm xử lý logic nhỏ trong Service (nếu có viết test JUnit).
- **API Test:** Sử dụng Postman để gửi request kiểm tra các endpoint Backend (kết quả trả về JSON đúng cấu trúc, đúng status code 200/400/401/500).
- **Manual Test:** Chạy ứng dụng trên trình duyệt, đóng vai người dùng thật để test các luồng chức năng (đăng ký, login, post bài...).

#### 5.2. Test case tiêu biểu

| STT | Tên Test Case | Các bước thực hiện | Kết quả mong đợi | Kết quả thực tế |
|---|---|---|---|---|
| 1 | Đăng nhập thành công | Nhập user/pass đúng -> Bấm Login | Chuyển vào trang chủ, lưu token | Đạt |
| 2 | Đăng nhập thất bại | Nhập sai pass -> Bấm Login | Báo lỗi thông tin không đúng | Đạt |
| 3 | Đăng bài viết (có ảnh) | Nhập nội dung, chọn ảnh -> Bấm Đăng | Bài viết hiện lên đầu Newfeed | Đạt |
| 4 | Like bài viết | Bấm icon tim | Icon đổi màu đỏ, số like tăng 1 | Đạt |

#### 5.3. Đánh giá hệ thống
- **Kết quả đạt được:** Đã xây dựng được khung sườn của một mạng xã hội, các chức năng cơ bản hoạt động trơn tru. Docker hóa thành công giúp dễ dàng chạy thử.
- **So sánh mục tiêu:** Đạt được khoảng 80-90% mục tiêu chức năng đề ra ban đầu.

---

### Chương 6. Kết luận và hướng phát triển

#### 6.1. Kết luận
Đồ án đã giúp nhóm hiểu rõ quy trình xây dựng ứng dụng Fullstack từ A-Z. Chúng tôi đã làm chủ được các công nghệ Spring Boot, Angular và đặc biệt là tích hợp Keycloak cho bảo mật. Hệ thống có thể chạy ổn định trong môi trường development.

#### 6.2. Hạn chế
- Giao diện có thể chưa thực sự trau chuốt (cần cải thiện UI/UX).
- Chưa có tính năng Chat realtime (Socket.IO/WebSocket).
- Chưa tối ưu hiệu năng khi lượng dữ liệu lớn (chưa có Caching Redis, chưa phân trang tối ưu).

#### 6.3. Hướng phát triển
- Tích hợp WebSocket để làm tính năng Chat và Thông báo (Notification) realtime.
- Cải thiện giao diện đẹp và hiện đại hơn.
- Triển khai (Deploy) lên server thực tế (VPS/Cloud) thay vì chỉ chạy localhost.
- Phát triển thêm ứng dụng Mobile (React Native/Flutter) dùng chung API Backend.

---

### Tài liệu tham khảo

1. Tài liệu Spring Boot: [https://spring.io/projects/spring-boot](https://spring.io/projects/spring-boot)
2. Tài liệu Angular: [https://angular.io/docs](https://angular.io/docs)
3. Tài liệu Keycloak: [https://www.keycloak.org/documentation](https://www.keycloak.org/documentation)
4. Các nguồn hướng dẫn trên YouTube, StackOverflow, Baeldung...
