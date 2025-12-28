# Tài Liệu Hệ Thống Mini Social Network

## Thông Tin Tổng Quan

**Tên dự án:** Mini Social Network  
**Loại ứng dụng:** Mạng xã hội thu nhỏ (Web Application)  
**Kiến trúc:** Client-Server (Frontend Angular + Backend Spring Boot)  
**Triển khai:** Docker Containerization

---

## 1. Mô Tả Hệ Thống

Mini Social Network là một ứng dụng mạng xã hội web cho phép người dùng:
- Đăng ký, đăng nhập và quản lý profile
- Đăng bài viết (text + hình ảnh)
- Tương tác với bài viết (like, comment)
- Follow/Unfollow người dùng khác
- Chat real-time với người dùng khác
- Nhận thông báo (notification) về các hoạt động

---

## 2. Công Nghệ Sử Dụng

### 2.1. Frontend
| Công nghệ | Phiên bản | Mô tả |
|-----------|----------|-------|
| Angular | 17+ | Framework chính |
| TypeScript | 5.x | Ngôn ngữ lập trình |
| STOMP.js | - | WebSocket client cho chat real-time |
| Keycloak-js | - | Authentication library |

### 2.2. Backend
| Công nghệ | Phiên bản | Mô tả |
|-----------|----------|-------|
| Spring Boot | 3.x | Framework chính |
| Spring Security | - | Authentication/Authorization |
| Spring Data JPA | - | ORM Layer |
| Spring WebSocket | - | Real-time communication |
| Lombok | - | Giảm boilerplate code |

### 2.3. Database & Storage
| Công nghệ | Phiên bản | Mô tả |
|-----------|----------|-------|
| MySQL | 8.0 | Relational Database |
| MinIO | Latest | Object Storage (images, files) |
| Cloudinary | - | Cloud Image Storage (alternative) |

### 2.4. Authentication
| Công nghệ | Phiên bản | Mô tả |
|-----------|----------|-------|
| Keycloak | 21.1 | Identity & Access Management |
| OAuth 2.0 / OIDC | - | Authentication Protocol |
| JWT | - | Token-based Authentication |

### 2.5. DevOps
| Công nghệ | Mô tả |
|-----------|-------|
| Docker | Containerization |
| Docker Compose | Multi-container orchestration |

---

## 3. Kiến Trúc Hệ Thống

### 3.1. Biểu Đồ Kiến Trúc Tổng Quan

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           CLIENT LAYER                                   │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │                    Angular Frontend (Port 4200)                  │    │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐   │    │
│  │  │  Auth   │ │  Feed   │ │  Chat   │ │ Profile │ │  People │   │    │
│  │  │ Module  │ │  Module │ │  Module │ │  Module │ │  Module │   │    │
│  │  └────┬────┘ └────┬────┘ └────┬────┘ └────┬────┘ └────┬────┘   │    │
│  │       │           │           │           │           │         │    │
│  │  ┌────▼───────────▼───────────▼───────────▼───────────▼────┐   │    │
│  │  │                   Core Services                          │   │    │
│  │  │  (AuthService, PostService, UserService, ChatService)    │   │    │
│  │  └────────────────────────────┬────────────────────────────┘   │    │
│  └───────────────────────────────┼─────────────────────────────────┘    │
└──────────────────────────────────┼──────────────────────────────────────┘
                                   │ HTTP/WebSocket
                                   ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                          SERVER LAYER                                    │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │              Spring Boot Backend (Port 8080)                     │    │
│  │  ┌────────────────────────────────────────────────────────────┐ │    │
│  │  │                    Controller Layer                         │ │    │
│  │  │ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐       │ │    │
│  │  │ │   User   │ │   Post   │ │  Comment │ │  Follow  │       │ │    │
│  │  │ │Controller│ │Controller│ │Controller│ │Controller│       │ │    │
│  │  │ └──────────┘ └──────────┘ └──────────┘ └──────────┘       │ │    │
│  │  │ ┌──────────┐ ┌──────────┐ ┌──────────┐                    │ │    │
│  │  │ │  Chat    │ │Conversa- │ │Notifica- │                    │ │    │
│  │  │ │ Socket   │ │  tion    │ │  tion    │                    │ │    │
│  │  │ │Controller│ │Controller│ │Controller│                    │ │    │
│  │  │ └──────────┘ └──────────┘ └──────────┘                    │ │    │
│  │  └────────────────────────────────────────────────────────────┘ │    │
│  │  ┌────────────────────────────────────────────────────────────┐ │    │
│  │  │                    Service Layer                            │ │    │
│  │  │ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐       │ │    │
│  │  │ │  User    │ │   Post   │ │  Comment │ │  Follow  │       │ │    │
│  │  │ │ Profile  │ │  Service │ │  Service │ │  Service │       │ │    │
│  │  │ │ Service  │ │          │ │          │ │          │       │ │    │
│  │  │ └──────────┘ └──────────┘ └──────────┘ └──────────┘       │ │    │
│  │  │ ┌──────────┐ ┌──────────┐ ┌──────────┐                    │ │    │
│  │  │ │ Conversa-│ │  Message │ │Notifica- │                    │ │    │
│  │  │ │  tion    │ │  Service │ │  tion    │                    │ │    │
│  │  │ │ Service  │ │          │ │  Service │                    │ │    │
│  │  │ └──────────┘ └──────────┘ └──────────┘                    │ │    │
│  │  └────────────────────────────────────────────────────────────┘ │    │
│  │  ┌────────────────────────────────────────────────────────────┐ │    │
│  │  │                   Repository Layer                          │ │    │
│  │  │ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐       │ │    │
│  │  │ │   User   │ │   Post   │ │  Comment │ │  Follow  │       │ │    │
│  │  │ │   Repo   │ │   Repo   │ │   Repo   │ │   Repo   │       │ │    │
│  │  │ └──────────┘ └──────────┘ └──────────┘ └──────────┘       │ │    │
│  │  │ ┌──────────┐ ┌──────────┐ ┌──────────┐                    │ │    │
│  │  │ │ Conversa-│ │  Message │ │Notifica- │                    │ │    │
│  │  │ │  tion    │ │   Repo   │ │  tion    │                    │ │    │
│  │  │ │   Repo   │ │          │ │   Repo   │                    │ │    │
│  │  │ └──────────┘ └──────────┘ └──────────┘                    │ │    │
│  │  └────────────────────────────────────────────────────────────┘ │    │
│  └─────────────────────────────────────────────────────────────────┘    │
└──────────────────────────────────┬──────────────────────────────────────┘
                                   │
                                   ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         DATA & AUTH LAYER                                │
│  ┌─────────────┐   ┌─────────────┐   ┌─────────────┐                    │
│  │   MySQL     │   │    MinIO    │   │  Keycloak   │                    │
│  │  (Port 3309)│   │ (Port 9000) │   │ (Port 8180) │                    │
│  │  Database   │   │Object Store │   │    IAM      │                    │
│  └─────────────┘   └─────────────┘   └─────────────┘                    │
└─────────────────────────────────────────────────────────────────────────┘
                                   │
                                   ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                      EXTERNAL CLOUD SERVICES                             │
│  ┌─────────────────────────────────────┐                                │
│  │           ☁️ Cloudinary              │                                │
│  │    (Cloud Image Storage Service)    │                                │
│  │  - Upload ảnh bài viết/comment      │                                │
│  │  - CDN delivery                     │                                │
│  │  - Image transformation             │                                │
│  └─────────────────────────────────────┘                                │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 4. Mô Hình Dữ Liệu (Entity Relationship)

### 4.1. Biểu Đồ ERD

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         ENTITY RELATIONSHIP DIAGRAM                      │
│       (Bao gồm các bảng phụ được tạo từ @ElementCollection)             │
└─────────────────────────────────────────────────────────────────────────┘

┌──────────────────┐         ┌──────────────────┐
│      USER        │         │   USER_ROLES     │
├──────────────────┤         ├──────────────────┤
│ id: UUID (PK)    │◄────────│ user_id: FK      │
│ username: String │   1:N   │ role: String     │
│  (unique, 50)    │         └──────────────────┘
│ email: String    │         ┌──────────────────┐
│  (unique)        │         │ USER_FOLLOWERS   │
│ name: String     │◄────────├──────────────────┤
│ bio: String      │   1:N   │ user_id: FK      │
│ avatarUrl: TEXT  │         │ follower_id: UUID│
│ createdAt: Inst  │         └──────────────────┘
│ updatedAt: Inst  │         ┌──────────────────┐
│ isActive: Bool   │         │ USER_FOLLOWING   │
└──────────────────┘◄────────├──────────────────┤
         │             1:N   │ user_id: FK      │
         │                   │ following_id:UUID│
         │                   └──────────────────┘
         │
         │ 1:N
         ▼
┌──────────────────┐         ┌──────────────────┐
│      POST        │         │  POST_IMAGE_URLS │
├──────────────────┤         ├──────────────────┤
│ id: UUID (PK)    │◄────────│ post_id: FK      │
│ authorId: UUID   │   1:N   │ imageUrl: String │
│ content: String  │         └──────────────────┘
│ likeCount: Int   │         ┌──────────────────┐
│ commentCount: Int│         │   POST_LIKES     │
│ createdAt: Inst  │◄────────├──────────────────┤
│ updatedAt: Inst  │   1:N   │ post_id: FK      │
│ isDeleted: Bool  │         │ user_id: UUID    │
└────────┬─────────┘         └──────────────────┘
         │
         │ 1:N
         ▼
┌──────────────────┐
│     COMMENT      │
├──────────────────┤
│ id: UUID (PK)    │
│ postId: UUID (FK)│
│ userId: UUID (FK)│
│ content: String  │
│ imageUrl: String │ ← max 1 image, 5MB
│ createdAt: Inst  │
│ updatedAt: Inst  │
│ isDeleted: Bool  │
└──────────────────┘


┌──────────────────────────────────────────────────────────────────────────┐
│                         FOLLOW RELATIONSHIP                               │
│         (Composite Primary Key via @EmbeddedId - FollowId)               │
└──────────────────────────────────────────────────────────────────────────┘

┌────────────────────────┐
│   FOLLOW (user_follows)│
├────────────────────────┤
│ followerId: String (PK)│ ← Keycloak User ID
│ followingId: String(PK)│ ← Keycloak User ID
│ createdAt: LocalDateTime│
├────────────────────────┤
│ Note: Composite PK     │
│ (followerId,followingId)│
└────────────────────────┘


┌──────────────────────────────────────────────────────────────────────────┐
│                            CHAT MODULE                                    │
└──────────────────────────────────────────────────────────────────────────┘

┌────────────────────────┐      ┌────────────────────────┐
│   CONVERSATION         │      │ CONVERSATION_PARTICIPANTS│
├────────────────────────┤      ├────────────────────────┤
│ id: Long (PK)          │◄─────│ conversation_id: FK    │
│ name: String           │ 1:N  │ user_id: String        │
│ type: Enum             │      └────────────────────────┘
│  (ONE_TO_ONE | GROUP)  │
│ createdBy: String      │ ← ID người tạo
│ lastMessageContent: Str│ ← Denormalized
│ lastMessageSenderId:Str│ ← Denormalized  
│ lastMessageType: Enum  │ ← Denormalized
│ createdAt: Instant     │
│ updatedAt: Instant     │
└────────────┬───────────┘
             │
             │ 1:N
             ▼
┌────────────────────────┐
│       MESSAGE          │
├────────────────────────┤
│ id: Long (PK)          │
│ conversationId: Long FK│
│ senderId: String       │ ← Keycloak User ID
│ content: TEXT          │
│ messageType: Enum      │ ← TEXT|IMAGE|FILE|ATTACHMENT
│ isDeleted: Bool        │ ← Soft delete
│ createdAt: Instant     │
└────────────┬───────────┘
             │
             │ 1:N
             ▼
┌────────────────────────┐
│      ATTACHMENT        │
├────────────────────────┤
│ id: Long (PK)          │
│ fileName: String       │
│ objectKey: String      │ ← MinIO object key
│ fileType: String       │ ← MIME type
│ fileSize: Long         │ ← bytes
│ fileUrl: TEXT          │ ← Public URL
│ message_id: Long (FK)  │
└────────────────────────┘


┌──────────────────────────────────────────────────────────────────────────┐
│                         NOTIFICATION SYSTEM                               │
└──────────────────────────────────────────────────────────────────────────┘

┌────────────────────────┐
│     NOTIFICATION       │
├────────────────────────┤
│ id: UUID (PK)          │
│ receiverId: UUID       │ ← Người nhận thông báo
│ senderId: UUID         │ ← Người gây ra hành động
│ senderName: String     │ ← Denormalized
│ senderAvatarUrl: String│ ← Denormalized
│ type: Enum             │ ← LIKE | COMMENT | FOLLOW | MESSAGE
│ postId: UUID           │ ← Null nếu FOLLOW hoặc MESSAGE
│ conversationId: String │ ← Chỉ dùng cho MESSAGE
│ message: String        │ ← Nội dung thông báo
│ isRead: Boolean        │
│ createdAt: Instant     │
└────────────────────────┘
```

### 4.2. Ghi Chú ERD

| Đặc điểm | Mô tả |
|----------|-------|
| **@ElementCollection** | Các trường `roles`, `followers`, `following` trong USER và `imageUrls`, `likes` trong POST được lưu trong bảng phụ riêng |
| **Composite Key** | FOLLOW sử dụng `@EmbeddedId` với `FollowId` chứa `followerId` + `followingId` làm khóa chính kết hợp |
| **Denormalization** | CONVERSATION lưu `lastMessage*` fields để tối ưu hiệu suất hiển thị danh sách chat |
| **Soft Delete** | POST, COMMENT, MESSAGE sử dụng cờ `isDeleted` thay vì xóa thật |
| **User ID** | Sử dụng Keycloak User ID (UUID dạng String) để tích hợp với hệ thống authentication |


---

## 5. API Endpoints

### 5.1. User APIs (`/api/users`)
| Method | Endpoint | Mô tả | Auth |
|--------|----------|-------|------|
| GET | `/me` | Lấy profile người dùng hiện tại | ✓ |
| PUT | `/me` | Cập nhật profile | ✓ |
| GET | `/` | Lấy tất cả users (debug) | ✓ |
| GET | `/{id}` | Lấy user theo ID | ✓ |
| GET | `/count` | Đếm số lượng users | ✓ |

### 5.2. Post APIs (`/api/posts`)
| Method | Endpoint | Mô tả | Auth |
|--------|----------|-------|------|
| POST | `/` | Tạo bài viết mới (multipart) | ✓ |
| GET | `/{id}` | Lấy bài viết theo ID | - |
| GET | `/author/{authorId}` | Lấy bài viết theo author | - |
| GET | `/feed` | Lấy feed của người dùng | ✓ |
| POST | `/{id}/like` | Toggle like bài viết | ✓ |
| PUT | `/{id}` | Cập nhật bài viết | ✓ |
| DELETE | `/{id}` | Xóa bài viết | ✓ |

### 5.3. Comment APIs (`/api/comments`)
| Method | Endpoint | Mô tả | Auth |
|--------|----------|-------|------|
| POST | `/` | Tạo comment mới (multipart) | ✓ |
| GET | `/{id}` | Lấy comment theo ID | - |
| GET | `/post/{postId}` | Lấy comments của bài viết | - |
| GET | `/count/{postId}` | Đếm comments của bài viết | - |
| PUT | `/{id}` | Cập nhật comment | ✓ |
| DELETE | `/{id}` | Xóa comment | ✓ |

### 5.4. Follow APIs (`/api/follows`)
| Method | Endpoint | Mô tả | Auth |
|--------|----------|-------|------|
| POST | `/{followingId}` | Follow user | ✓ |
| DELETE | `/{followingId}` | Unfollow user | ✓ |
| GET | `/status/{followingId}` | Kiểm tra trạng thái follow | ✓ |
| GET | `/count/followers/{userId}` | Đếm followers | - |
| GET | `/count/following/{userId}` | Đếm following | - |
| GET | `/followers/{userId}` | Lấy danh sách followers | - |
| GET | `/following/{userId}` | Lấy danh sách following | - |
| GET | `/suggestions/{userId}` | Gợi ý người dùng để follow | ✓ |

### 5.5. Notification APIs (`/api/notifications`)
| Method | Endpoint | Mô tả | Auth |
|--------|----------|-------|------|
| GET | `/` | Lấy danh sách notifications | ✓ |
| GET | `/unread-count` | Đếm notifications chưa đọc | ✓ |
| PUT | `/{id}/read` | Đánh dấu đã đọc | ✓ |
| PUT | `/read-all` | Đánh dấu tất cả đã đọc | ✓ |
| PUT | `/conversation/{id}/read` | Đánh dấu conversation đã đọc | ✓ |

### 5.6. Chat APIs (`/api/conversations`)
| Method | Endpoint | Mô tả | Auth |
|--------|----------|-------|------|
| GET | `/` | Lấy danh sách conversations | ✓ |
| GET | `/{conversationId}` | Lấy chi tiết conversation | ✓ |
| GET | `/{conversationId}/messages` | Lấy tin nhắn (cursor pagination) | ✓ |

### 5.7. WebSocket Endpoints
| Endpoint | Mô tả |
|----------|-------|
| `/ws-chat` | WebSocket connection endpoint |
| `/app/chat.send` | Gửi tin nhắn mới |
| `/app/chat.delete` | Xóa tin nhắn |
| `/topic/conversation/{id}` | Subscribe để nhận tin nhắn |
| `/user/{id}/queue/notifications` | Subscribe notifications cá nhân |

---

## 6. Luồng Dữ Liệu (Data Flow Diagrams)

### 6.1. Luồng Đăng Nhập/Đăng Ký (Authentication Flow)

```
┌─────────────────────────────────────────────────────────────────────────┐
│                      AUTHENTICATION FLOW                                 │
└─────────────────────────────────────────────────────────────────────────┘

┌────────┐                    ┌────────────┐                ┌───────────┐
│  User  │                    │  Frontend  │                │ Keycloak  │
└───┬────┘                    └─────┬──────┘                └─────┬─────┘
    │                               │                              │
    │ 1. Click Login                │                              │
    ├──────────────────────────────►│                              │
    │                               │                              │
    │                               │ 2. Redirect to Keycloak      │
    │                               ├─────────────────────────────►│
    │                               │                              │
    │ 3. Enter credentials          │                              │
    ├──────────────────────────────────────────────────────────────►
    │                               │                              │
    │                               │     4. Validate & Generate   │
    │                               │        JWT Token             │
    │                               │◄─────────────────────────────┤
    │                               │                              │
    │                               │ 5. Store Token in            │
    │                               │    Local Storage             │
    │                               │                              │
    │ 6. Redirect to Feed           │                              │
    │◄──────────────────────────────┤                              │
    │                               │                              │
    │                               │                              │
    │                               │                              │
┌───▼────┐                    ┌─────▼──────┐                ┌──────▼─────┐
│ [HOME] │                    │  [LOGGED]  │                │  [TOKEN]   │
│  Feed  │                    │    IN      │                │  ISSUED    │
└────────┘                    └────────────┘                └────────────┘

    ─────────────────────────────────────────────────────────────────────
                            SUBSEQUENT REQUESTS
    ─────────────────────────────────────────────────────────────────────

┌────────┐      ┌────────────┐      ┌────────────┐      ┌───────────┐
│  User  │      │  Frontend  │      │  Backend   │      │ Keycloak  │
└───┬────┘      └─────┬──────┘      └─────┬──────┘      └─────┬─────┘
    │                 │                   │                   │
    │ 1. Request      │                   │                   │
    │    (e.g., Feed) │                   │                   │
    ├────────────────►│                   │                   │
    │                 │                   │                   │
    │                 │ 2. API Request    │                   │
    │                 │    + JWT Token    │                   │
    │                 ├──────────────────►│                   │
    │                 │                   │                   │
    │                 │                   │ 3. Validate JWT   │
    │                 │                   ├──────────────────►│
    │                 │                   │                   │
    │                 │                   │ 4. Token Valid    │
    │                 │                   │◄──────────────────┤
    │                 │                   │                   │
    │                 │ 5. Return Data    │                   │
    │                 │◄──────────────────┤                   │
    │                 │                   │                   │
    │ 6. Render UI    │                   │                   │
    │◄────────────────┤                   │                   │
    │                 │                   │                   │
```

### 6.2. Luồng Đăng Bài Viết (Create Post Flow)

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         CREATE POST FLOW                                 │
└─────────────────────────────────────────────────────────────────────────┘

┌────────┐     ┌────────────┐     ┌────────────┐     ┌────────┐   ┌───────┐
│  User  │     │  Frontend  │     │  Backend   │     │ MinIO/ │   │ MySQL │
│        │     │            │     │            │     │Cloudinary  │       │
└───┬────┘     └─────┬──────┘     └─────┬──────┘     └───┬────┘   └───┬───┘
    │                │                  │                │            │
    │ 1. Write Post  │                  │                │            │
    │    + Images    │                  │                │            │
    ├───────────────►│                  │                │            │
    │                │                  │                │            │
    │                │ 2. POST /api/posts                │            │
    │                │    (multipart form)               │            │
    │                ├─────────────────►│                │            │
    │                │                  │                │            │
    │                │                  │ 3. Upload Images            │
    │                │                  ├───────────────►│            │
    │                │                  │                │            │
    │                │                  │ 4. Return URLs │            │
    │                │                  │◄───────────────┤            │
    │                │                  │                │            │
    │                │                  │ 5. Save Post to DB          │
    │                │                  ├────────────────────────────►│
    │                │                  │                │            │
    │                │                  │ 6. Post Created│            │
    │                │                  │◄────────────────────────────┤
    │                │                  │                │            │
    │                │ 7. PostResponse  │                │            │
    │                │◄─────────────────┤                │            │
    │                │                  │                │            │
    │ 8. Show Post   │                  │                │            │
    │    in Feed     │                  │                │            │
    │◄───────────────┤                  │                │            │
    │                │                  │                │            │

    ─────────────────────────────────────────────────────────────────────
                        POST ENTITY STRUCTURE
    ─────────────────────────────────────────────────────────────────────

┌─────────────────────────────────────────────────────────────────┐
│                          POST ENTITY                            │
├─────────────────────────────────────────────────────────────────┤
│ {                                                               │
│   "id": "uuid",                                                 │
│   "authorId": "keycloak-user-id",                              │
│   "content": "Post text content",                              │
│   "imageUrls": ["url1", "url2", "url3", "url4"],  // max 4     │
│   "likes": ["userId1", "userId2"],                             │
│   "likeCount": 2,                                              │
│   "commentCount": 5,                                           │
│   "createdAt": "2024-01-01T12:00:00Z",                         │
│   "updatedAt": "2024-01-01T12:00:00Z",                         │
│   "isDeleted": false                                           │
│ }                                                               │
└─────────────────────────────────────────────────────────────────┘
```

### 6.3. Luồng Like và Notification

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    LIKE POST & NOTIFICATION FLOW                         │
└─────────────────────────────────────────────────────────────────────────┘

┌────────┐     ┌────────────┐     ┌────────────┐     ┌───────┐
│ User A │     │  Frontend  │     │  Backend   │     │ MySQL │
│(Liker) │     │            │     │            │     │       │
└───┬────┘     └─────┬──────┘     └─────┬──────┘     └───┬───┘
    │                │                  │                │
    │ 1. Click Like  │                  │                │
    ├───────────────►│                  │                │
    │                │                  │                │
    │                │ 2. POST /{id}/like               │
    │                ├─────────────────►│                │
    │                │                  │                │
    │                │                  │ 3. Toggle Like │
    │                │                  │    in DB       │
    │                │                  ├───────────────►│
    │                │                  │◄───────────────┤
    │                │                  │                │
    │                │                  │ 4. Create      │
    │                │                  │    Notification│
    │                │                  ├───────────────►│
    │                │                  │                │
    │ 5. UI Updated  │ PostResponse     │                │
    │◄───────────────│◄─────────────────┤                │
    │                │                  │                │


┌────────┐                        ┌────────────┐
│ User B │                        │  Backend   │
│(Author)│                        │ WebSocket  │
└───┬────┘                        └─────┬──────┘
    │                                   │
    │  6. WebSocket: /user/{B}/queue/notifications
    │◄──────────────────────────────────┤
    │                                   │
    │  {                                │
    │    "type": "LIKE",                │
    │    "senderId": "A",               │
    │    "senderName": "User A",        │
    │    "postId": "xxx",               │
    │    "message": "User A liked..."   │
    │  }                                │
    │                                   │
    │ 7. Show Notification              │
    │    Badge + Toast                  │
    │                                   │
```

### 6.4. Luồng Chat Real-time

```
┌─────────────────────────────────────────────────────────────────────────┐
│                      REAL-TIME CHAT FLOW                                 │
└─────────────────────────────────────────────────────────────────────────┘

┌────────┐     ┌────────────┐     ┌────────────────┐     ┌───────┐
│ User A │     │  Frontend  │     │Backend WebSocket│    │ MySQL │
│(Sender)│     │  (STOMP)   │     │   (Spring WS)   │    │       │
└───┬────┘     └─────┬──────┘     └───────┬────────┘     └───┬───┘
    │                │                     │                  │
    │ 1. Connect WS  │                     │                  │
    ├───────────────►│                     │                  │
    │                │ 2. CONNECT /ws-chat │                  │
    │                ├────────────────────►│                  │
    │                │                     │                  │
    │                │ 3. SUBSCRIBE        │                  │
    │                │ /topic/conversation/{id}               │
    │                ├────────────────────►│                  │
    │                │                     │                  │
    │ 4. Type &      │                     │                  │
    │    Send Message│                     │                  │
    ├───────────────►│                     │                  │
    │                │                     │                  │
    │                │ 5. STOMP SEND       │                  │
    │                │ /app/chat.send      │                  │
    │                ├────────────────────►│                  │
    │                │                     │                  │
    │                │                     │ 6. Save Message  │
    │                │                     ├─────────────────►│
    │                │                     │◄─────────────────┤
    │                │                     │                  │
    │                │                     │                  │
    │                │                     │                  │


┌────────┐     ┌────────────┐     ┌────────────────┐
│ User B │     │  Frontend  │     │Backend WebSocket│
│(Receiver)    │  (STOMP)   │     │   (Spring WS)   │
└───┬────┘     └─────┬──────┘     └───────┬────────┘
    │                │                     │
    │                │ 7. BROADCAST to     │
    │                │ /topic/conversation/{id}
    │                │◄────────────────────┤
    │                │                     │
    │ 8. Show New    │                     │
    │    Message     │                     │
    │◄───────────────┤                     │
    │                │                     │
    │                │ 9. Send to          │
    │                │ /user/{B}/queue/notifications
    │                │◄────────────────────┤
    │                │                     │
    │ 10. Show       │                     │
    │    Notification│                     │
    │◄───────────────┤                     │
    │                │                     │
```

### 6.5. Luồng Follow/Unfollow

```
┌─────────────────────────────────────────────────────────────────────────┐
│                      FOLLOW/UNFOLLOW FLOW                                │
└─────────────────────────────────────────────────────────────────────────┘

┌────────┐     ┌────────────┐     ┌────────────┐     ┌───────┐
│ User A │     │  Frontend  │     │  Backend   │     │ MySQL │
│        │     │            │     │            │     │       │
└───┬────┘     └─────┬──────┘     └─────┬──────┘     └───┬───┘
    │                │                  │                │
    │ 1. Click Follow│                  │                │
    │    on User B   │                  │                │
    ├───────────────►│                  │                │
    │                │                  │                │
    │                │ 2. POST /api/follows/{B}         │
    │                │    ?followerId={A}               │
    │                ├─────────────────►│                │
    │                │                  │                │
    │                │                  │ 3. Check if    │
    │                │                  │    already     │
    │                │                  │    following   │
    │                │                  ├───────────────►│
    │                │                  │◄───────────────┤
    │                │                  │                │
    │                │                  │ 4. Create      │
    │                │                  │    Follow      │
    │                │                  │    Record      │
    │                │                  ├───────────────►│
    │                │                  │◄───────────────┤
    │                │                  │                │
    │                │ 5. Success Response              │
    │ 6. Update UI   │◄─────────────────┤                │
    │    (Following) │                  │                │
    │◄───────────────┤                  │                │
    │                │                  │                │

    ─────────────────────────────────────────────────────────────────────
                           FOLLOW ENTITY
    ─────────────────────────────────────────────────────────────────────

┌─────────────────────────────────────────────────────────────────┐
│                        FOLLOW ENTITY                            │
├─────────────────────────────────────────────────────────────────┤
│ {                                                               │
│   "id": {                                                       │
│     "followerId": "user-a-keycloak-id",                        │
│     "followingId": "user-b-keycloak-id"                        │
│   },                                                            │
│   "createdAt": "2024-01-01T12:00:00Z"                          │
│ }                                                               │
├─────────────────────────────────────────────────────────────────┤
│ Note: Uses composite primary key (FollowId)                     │
└─────────────────────────────────────────────────────────────────┘
```

---

## 7. Cấu Trúc Thư Mục

### 7.1. Backend (Spring Boot)

```
SocialNetwork/
├── src/main/java/com/mini/socialnetwork/
│   ├── SocialNetworkApplication.java      # Main Application
│   │
│   ├── config/                            # Cấu hình
│   │   ├── CloudinaryConfig.java          # Cloudinary image storage
│   │   ├── CorsConfig.java                # CORS policy
│   │   ├── MinioConfig.java               # MinIO object storage
│   │   ├── SecurityConfig.java            # Spring Security + JWT
│   │   ├── WebConfig.java                 # Web MVC config
│   │   └── WebSocketConfig.java           # WebSocket STOMP config
│   │
│   ├── controller/                        # REST Controllers
│   │   ├── CommentController.java
│   │   ├── FollowController.java
│   │   ├── NotificationController.java
│   │   ├── PostController.java
│   │   └── UserController.java
│   │
│   ├── dto/                               # Data Transfer Objects
│   │   ├── CommentResponse.java
│   │   ├── PostResponse.java
│   │   ├── SliceResponse.java
│   │   ├── UpdateProfileRequest.java
│   │   └── UserProfileDto.java
│   │
│   ├── exception/                         # Custom Exceptions
│   │   └── ...
│   │
│   ├── model/                             # JPA Entities
│   │   ├── Comment.java
│   │   ├── Follow.java
│   │   ├── FollowId.java
│   │   ├── Notification.java
│   │   ├── Post.java
│   │   └── User.java
│   │
│   ├── repository/                        # Spring Data JPA Repos
│   │   ├── CommentRepository.java
│   │   ├── FollowRepository.java
│   │   ├── NotificationRepository.java
│   │   ├── PostRepository.java
│   │   └── UserRepository.java
│   │
│   ├── service/                           # Business Logic
│   │   ├── CommentService.java
│   │   ├── FollowService.java
│   │   ├── NotificationService.java
│   │   ├── PostService.java
│   │   └── UserProfileService.java
│   │
│   └── modules/                           # Feature Modules
│       ├── auth/                          # Authentication Module
│       │   ├── controller/
│       │   │   └── AuthController.java
│       │   ├── dto/
│       │   │   └── RegisterRequest.java
│       │   └── service/
│       │       └── KeycloakAdminService.java
│       │
│       └── chat/                          # Chat Module
│           ├── controller/
│           │   ├── AttachmentController.java
│           │   ├── ChatSocketController.java
│           │   └── ConversationController.java
│           ├── dto/
│           │   ├── ConversationDTO.java
│           │   ├── DeleteMessageEvent.java
│           │   ├── DeleteMessageRequest.java
│           │   └── SendMessageRequest.java
│           ├── entity/
│           │   ├── Conversation.java
│           │   └── Message.java (incl. Attachment)
│           ├── repository/
│           │   ├── ConversationRepository.java
│           │   └── MessageRepository.java
│           ├── security/
│           │   └── WebSocketAuthInterceptor.java
│           └── service/
│               ├── ConversationService.java
│               └── MessageService.java
│
├── src/main/resources/
│   └── application.properties             # App configuration
│
├── Dockerfile                             # Docker build
└── pom.xml                                # Maven dependencies
```

### 7.2. Frontend (Angular)

```
MiniSocialNetwork_Fe/
├── src/
│   ├── app/
│   │   ├── app.ts                         # Root Component
│   │   ├── app.routes.ts                  # Routing Configuration
│   │   ├── app.config.ts                  # App Configuration
│   │   │
│   │   ├── core/                          # Core Module
│   │   │   ├── guards/
│   │   │   │   └── auth-guard.ts          # Route Protection
│   │   │   ├── interceptors/
│   │   │   │   └── auth.interceptor.ts    # HTTP Interceptor
│   │   │   └── services/
│   │   │       ├── auth.ts                # Keycloak Auth Service
│   │   │       ├── auth.config.ts         # Keycloak Config
│   │   │       ├── comment.service.ts
│   │   │       ├── post.service.ts
│   │   │       └── user.service.ts
│   │   │
│   │   ├── features/                      # Feature Modules
│   │   │   ├── auth/
│   │   │   │   └── pages/
│   │   │   │       ├── login-page/
│   │   │   │       └── register-page/
│   │   │   │
│   │   │   ├── chat/
│   │   │   │   ├── components/
│   │   │   │   │   ├── component-list/    # Conversation list
│   │   │   │   │   ├── message-area/      # Message display
│   │   │   │   │   ├── message-input/     # Message input
│   │   │   │   │   └── message-item/      # Single message
│   │   │   │   ├── pages/
│   │   │   │   │   └── chat-page/
│   │   │   │   └── services/
│   │   │   │       ├── chat-api.service.ts
│   │   │   │       └── chat-socket.service.ts
│   │   │   │
│   │   │   ├── feed/
│   │   │   │   ├── components/
│   │   │   │   │   ├── post-card/         # Post display
│   │   │   │   │   ├── post-editor/       # Create/Edit post
│   │   │   │   │   ├── comment-section/   # Comments
│   │   │   │   │   └── image-viewer/      # Image gallery
│   │   │   │   └── feed-page.component.ts
│   │   │   │
│   │   │   ├── notifications/
│   │   │   │   ├── components/
│   │   │   │   │   └── notification-item/
│   │   │   │   ├── pages/
│   │   │   │   │   └── notifications-page.component.ts
│   │   │   │   └── services/
│   │   │   │       └── notification.service.ts
│   │   │   │
│   │   │   ├── people/
│   │   │   │   └── people-page.component.ts
│   │   │   │
│   │   │   └── profile/
│   │   │       ├── components/
│   │   │       │   ├── edit-profile-popup/
│   │   │       │   └── follow-button/
│   │   │       └── pages/
│   │   │           └── profile-page/
│   │   │
│   │   ├── shared/                        # Shared Components
│   │   │   ├── components/
│   │   │   │   └── layout/
│   │   │   │       ├── main-layout.component.ts
│   │   │   │       └── sidebar.component.ts
│   │   │   └── models/
│   │   │       └── ...
│   │   │
│   │   └── pages/
│   │       └── follow/
│   │           └── follow.page.ts
│   │
│   ├── assets/                            # Static Assets
│   └── index.html                         # Entry HTML
│
├── angular.json                           # Angular CLI Config
├── package.json                           # NPM Dependencies
├── Dockerfile                             # Docker Build
└── proxy.conf.json                        # Dev Proxy Config
```

---

## 8. Các Tính Năng Chính

### 8.1. Authentication & Authorization
- **Đăng ký tài khoản mới** qua Keycloak
- **Đăng nhập** với OAuth 2.0 / OpenID Connect
- **JWT Token** cho stateless authentication
- **Protected routes** với AuthGuard

### 8.2. User Profile
- **Xem profile** của bản thân và người khác
- **Cập nhật profile**: tên, bio, avatar
- **Hiển thị thống kê**: số followers, following, posts

### 8.3. Posts & Feed
- **Tạo bài viết** với text và tối đa 4 hình ảnh
- **Xem feed** bài viết từ người đang follow
- **Like/Unlike** bài viết
- **Chỉnh sửa và xóa** bài viết của mình
- **Infinite scroll** với pagination

### 8.4. Comments
- **Bình luận** bài viết với text và/hoặc 1 hình ảnh
- **Chỉnh sửa và xóa** comment của mình
- **Hiển thị số lượng** comment trên mỗi bài

### 8.5. Follow System
- **Follow/Unfollow** người dùng khác
- **Xem danh sách** followers và following
- **Gợi ý người dùng** để follow

### 8.6. Real-time Chat
- **Chat 1-1** với người dùng khác
- **Gửi tin nhắn text** và file đính kèm
- **Real-time delivery** qua WebSocket/STOMP
- **Lịch sử tin nhắn** với cursor pagination
- **Xóa tin nhắn** (soft delete)

### 8.7. Notifications
- **Thông báo Like**: khi ai đó like bài viết
- **Thông báo Comment**: khi ai đó bình luận bài viết
- **Thông báo Follow**: khi có người follow mới
- **Thông báo Message**: khi có tin nhắn mới
- **Real-time delivery** qua WebSocket
- **Đánh dấu đã đọc**: từng notification hoặc tất cả

---

## 9. Cấu Hình Docker

### 9.1. Docker Compose Services

| Service | Image | Port | Mô tả |
|---------|-------|------|-------|
| mysql | mysql:8.0 | 3309 | Database |
| minio | minio/minio:latest | 9000, 9001 | Object Storage |
| keycloak | keycloak:21.1 | 8180 | Identity Provider |
| backend | Custom build | 8080 | Spring Boot API |
| frontend | Custom build | 4200 | Angular App |

### 9.2. Environment Variables

```env
# MySQL
MYSQL_ROOT_PASSWORD=xxx
MYSQL_DATABASE=social_network
MYSQL_USER=xxx
MYSQL_PASSWORD=xxx
MYSQL_PORT=3309

# MinIO
MINIO_ROOT_USER=xxx
MINIO_ROOT_PASSWORD=xxx
MINIO_PORT=9000
MINIO_CONSOLE_PORT=9001
MINIO_ACCESS_KEY=xxx
MINIO_SECRET_KEY=xxx
MINIO_BUCKET_NAME=social-network

# Keycloak
KEYCLOAK_ADMIN=admin
KEYCLOAK_ADMIN_PASSWORD=xxx
KEYCLOAK_PORT=8180
KEYCLOAK_REALM=social-network
KEYCLOAK_ADMIN_CLIENT_ID=xxx
KEYCLOAK_ADMIN_CLIENT_SECRET=xxx

# Cloudinary (optional)
CLOUDINARY_URL=xxx

# Ports
BACKEND_PORT=8080
FRONTEND_PORT=4200
```

---

## 10. Security

### 10.1. Authentication
- JWT Token validation via Keycloak
- Token stored in localStorage (Frontend)
- HTTP-only cookies alternative (recommended for production)

### 10.2. Authorization
- Protected endpoints require valid JWT
- User can only modify own resources (posts, comments, profile)
- WebSocket authentication via token in query/handshake

### 10.3. CORS
- Configured in `CorsConfig.java`
- Allows frontend origin (localhost:4200)

### 10.4. Input Validation
- DTO validation với Bean Validation
- File upload size limits (5MB for images)
- Content type validation cho uploads

---

## 11. Tóm Tắt Luồng Dữ Liệu Chính

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    MAIN DATA FLOWS SUMMARY                               │
└─────────────────────────────────────────────────────────────────────────┘

1. AUTHENTICATION FLOW:
   User → Frontend → Keycloak → JWT → Frontend → Backend (API with JWT)

2. FEED FLOW:
   User Request → Frontend → GET /api/posts/feed → Backend → MySQL
   ← Posts (paginated) ← Frontend ← Display

3. POST CREATION FLOW:
   User Input → Frontend → POST /api/posts (multipart)
   → Backend → Upload Images (MinIO/Cloudinary) → Save Post (MySQL)
   ← PostResponse ← Frontend ← Display New Post

4. LIKE/COMMENT FLOW:
   User Action → Frontend → POST /api/posts/{id}/like
   → Backend → Update DB → Create Notification → WebSocket Broadcast
   ← Response ← Frontend (Liker) ← Update UI
   ← WebSocket Notification → Frontend (Author) ← Show Notification

5. REAL-TIME CHAT FLOW:
   User Message → Frontend (STOMP) → /app/chat.send → Backend
   → Save Message (MySQL) → Broadcast /topic/conversation/{id}
   → Both Users' Frontends → Display Message

6. NOTIFICATION FLOW:
   Action (Like/Comment/Follow/Message) → Backend → Create Notification (MySQL)
   → WebSocket /user/{receiverId}/queue/notifications → Frontend → Show Badge/Toast
```

---

*Tài liệu này cung cấp cái nhìn toàn diện về hệ thống Mini Social Network, bao gồm kiến trúc, mô hình dữ liệu, API endpoints, và các luồng dữ liệu chính. Tài liệu này có thể được sử dụng để:*
1. *Hiểu tổng quan về hệ thống*
2. *Viết báo cáo đồ án/luận văn*
3. *Tham khảo khi phát triển thêm tính năng*
4. *Onboarding members mới vào team*
