# Biểu Đồ Mermaid - Mini Social Network

Tài liệu này cung cấp các biểu đồ Mermaid để dễ dàng render trong các công cụ hỗ trợ Markdown.

---

## 1. Biểu Đồ Kiến Trúc Hệ Thống (System Architecture)

```mermaid
flowchart TB
    subgraph Client["🖥️ Client Layer"]
        FE["Angular Frontend<br/>(Port 4200)"]
    end
    
    subgraph Backend["⚙️ Server Layer"]
        BE["Spring Boot Backend<br/>(Port 8080)"]
        WS["WebSocket Server<br/>(STOMP)"]
    end
    
    subgraph Data["🗄️ Data Layer"]
        MySQL[(MySQL 8.0<br/>Port 3309)]
        MinIO[(MinIO<br/>Port 9000)]
    end
    
    subgraph Auth["🔐 Auth Layer"]
        KC["Keycloak 21.1<br/>(Port 8180)"]
    end
    
    subgraph External["☁️ External Services"]
        Cloudinary["Cloudinary<br/>(Image Storage)"]
    end
    
    FE -->|HTTP/REST API| BE
    FE -->|WebSocket| WS
    FE <-->|OAuth 2.0/OIDC| KC
    BE -->|JPA| MySQL
    BE -->|S3 API| MinIO
    BE -->|Upload Images| Cloudinary
    BE <-->|Validate JWT| KC
    WS -->|Save Messages| MySQL
    
    style Client fill:#e1f5fe
    style Backend fill:#fff3e0
    style Data fill:#e8f5e9
    style Auth fill:#fce4ec
    style External fill:#f3e5f5
```

---

## 2. Biểu Đồ ERD (Entity Relationship Diagram)

```mermaid
erDiagram
    USER {
        string id PK
        string username
        string email
        string name
        string bio
        string avatarUrl
        datetime createdAt
        datetime updatedAt
        boolean isActive
    }
    
    USER_ROLES {
        string user_id FK
        string role
    }
    
    USER_FOLLOWERS {
        string user_id FK
        string follower_id
    }
    
    USER_FOLLOWING {
        string user_id FK
        string following_id
    }
    
    POST {
        string id PK
        string authorId FK
        string content
        int likeCount
        int commentCount
        datetime createdAt
        datetime updatedAt
        boolean isDeleted
    }
    
    POST_IMAGE_URLS {
        string post_id FK
        string imageUrl
    }
    
    POST_LIKES {
        string post_id FK
        string user_id
    }
    
    COMMENT {
        string id PK
        string postId FK
        string userId FK
        string content
        string imageUrl
        datetime createdAt
        datetime updatedAt
        boolean isDeleted
    }
    
    FOLLOW {
        string followerId PK
        string followingId PK
        datetime createdAt
    }
    
    NOTIFICATION {
        string id PK
        string receiverId FK
        string senderId FK
        string senderName
        string senderAvatarUrl
        string type
        string postId FK
        string conversationId
        string message
        boolean isRead
        datetime createdAt
    }
    
    CONVERSATION {
        int id PK
        string name
        string type
        string createdBy
        string lastMessageContent
        string lastMessageSenderId
        string lastMessageType
        datetime createdAt
        datetime updatedAt
    }
    
    CONVERSATION_PARTICIPANTS {
        int conversation_id FK
        string user_id
    }
    
    MESSAGE {
        int id PK
        int conversationId FK
        string senderId
        string content
        string messageType
        boolean isDeleted
        datetime createdAt
    }
    
    ATTACHMENT {
        int id PK
        string fileName
        string objectKey
        string fileType
        int fileSize
        string fileUrl
        int messageId FK
    }
    
    USER ||--o{ USER_ROLES : has
    USER ||--o{ USER_FOLLOWERS : has
    USER ||--o{ USER_FOLLOWING : has
    USER ||--o{ POST : creates
    USER ||--o{ COMMENT : writes
    USER ||--o{ NOTIFICATION : receives
    
    POST ||--o{ POST_IMAGE_URLS : has
    POST ||--o{ POST_LIKES : has
    POST ||--o{ COMMENT : has
    POST ||--o{ NOTIFICATION : triggers
    
    FOLLOW }o--|| USER : follower
    FOLLOW }o--|| USER : following
    
    CONVERSATION ||--o{ CONVERSATION_PARTICIPANTS : has
    CONVERSATION ||--o{ MESSAGE : contains
    CONVERSATION ||--o{ NOTIFICATION : triggers
    MESSAGE ||--o{ ATTACHMENT : has
```

### Ghi Chú ERD:
- **Bảng phụ `*_ROLES`, `*_FOLLOWERS`, `*_FOLLOWING`, `*_IMAGE_URLS`, `*_LIKES`**: Được tạo tự động bởi JPA `@ElementCollection`
- **FOLLOW**: Sử dụng composite primary key (`followerId` + `followingId`) qua `@EmbeddedId`
- **CONVERSATION**: Có các trường denormalized (`lastMessageContent`, `lastMessageSenderId`, `lastMessageType`) để tối ưu hiệu suất khi hiển thị danh sách chat
- **Soft Delete**: Các entity `POST`, `COMMENT`, `MESSAGE` sử dụng cờ `isDeleted` thay vì xóa thật
- **NOTIFICATION Types**: 
  - `LIKE` → link đến `POST` (qua `postId`)
  - `COMMENT` → link đến `POST` (qua `postId`)
  - `FOLLOW` → không có relation ngoài `senderId`/`receiverId`
  - `MESSAGE` → link đến `CONVERSATION` (qua `conversationId`)

---

## 3. Luồng Xác Thực (Authentication Flow)

```mermaid
sequenceDiagram
    autonumber
    participant U as 👤 User
    participant F as 🌐 Frontend
    participant K as 🔐 Keycloak
    participant B as ⚙️ Backend
    
    Note over U,B: Login Flow
    U->>F: Click Login
    F->>K: Redirect to Keycloak Login
    U->>K: Enter credentials
    K->>K: Validate credentials
    K->>F: Return JWT Token
    F->>F: Store token in localStorage
    F->>U: Redirect to Feed
    
    Note over U,B: API Request with Auth
    U->>F: Request (e.g., Get Feed)
    F->>B: API Request + JWT Bearer Token
    B->>K: Validate JWT
    K-->>B: Token Valid
    B->>B: Process Request
    B-->>F: Return Data
    F-->>U: Display Content
```

---

## 4. Luồng Tạo Bài Viết (Create Post Flow)

```mermaid
sequenceDiagram
    autonumber
    participant U as 👤 User
    participant FE as 🌐 Frontend
    participant BE as ⚙️ Backend
    participant Cloud as ☁️ Cloudinary
    participant DB as 🗄️ MySQL
    participant KC as 🔐 Keycloak
    participant WS as 📡 WebSocket
    participant FL as 👥 Followers
    
    U->>FE: Nhập nội dung + ảnh → Đăng
    FE->>BE: POST /api/posts (FormData)
    
    alt Có ảnh
        BE->>Cloud: Upload images
        Cloud-->>BE: imageUrls[]
    end
    
    BE->>DB: Lưu Post
    
    alt Author chưa có trong MySQL
        BE->>KC: Lấy thông tin user
        BE->>DB: Sync user vào MySQL
    end
    
    rect rgb(200, 230, 255)
        Note over BE,FL: Broadcast Real-time
        BE->>DB: Lấy danh sách followers
        BE->>WS: Gửi post đến followers
        WS->>FL: Bài viết mới xuất hiện
    end
    
    BE-->>FE: PostResponse
    FE-->>U: Hiển thị bài viết
```

### Mô tả:
1. User nhập nội dung/ảnh và nhấn Đăng
2. Nếu có ảnh → upload lên Cloudinary
3. Lưu bài viết vào MySQL
4. Nếu user chưa có trong MySQL → sync từ Keycloak
5. Broadcast bài viết mới đến followers qua WebSocket
6. Hiển thị bài viết trên Feed

---

## 5. Luồng Like và Thông Báo (Like & Notification Flow)

```mermaid
sequenceDiagram
    autonumber
    participant A as 👤 User A (Liker)
    participant F1 as 🌐 Frontend A
    participant B as ⚙️ Backend
    participant D as 🗄️ MySQL
    participant WS as 📡 WebSocket
    participant F2 as 🌐 Frontend B
    participant O as 👤 User B (Author)
    
    A->>F1: Click Like on Post
    F1->>B: POST /api/posts/{id}/like
    B->>D: Toggle like (add/remove userId from likes)
    D-->>B: Updated Post
    
    alt New Like (not self-like)
        B->>D: Create Notification
        B->>WS: Send to /user/{B}/queue/notifications
        WS->>F2: Push Notification
        F2-->>O: Show notification badge/toast
    end
    
    B-->>F1: PostResponse
    F1-->>A: Update like button UI
```

---

## 6. Luồng Chat Real-time (Real-time Chat Flow)

```mermaid
sequenceDiagram
    autonumber
    participant A as 👤 User A
    participant F1 as 🌐 Frontend A
    participant WS as 📡 WebSocket Server
    participant D as 🗄️ MySQL
    participant F2 as 🌐 Frontend B
    participant Bu as 👤 User B
    
    Note over A,Bu: Connection Setup
    A->>F1: Open Chat
    F1->>WS: CONNECT /ws-chat + JWT
    WS-->>F1: CONNECTED
    F1->>WS: SUBSCRIBE /topic/conversation/{id}
    
    Bu->>F2: Open Chat
    F2->>WS: CONNECT + SUBSCRIBE
    
    Note over A,Bu: Send Message
    A->>F1: Type & Send message
    F1->>WS: STOMP SEND /app/chat.send
    WS->>D: Save message
    D-->>WS: Saved
    
    WS->>F1: BROADCAST to /topic/conversation/{id}
    WS->>F2: BROADCAST to /topic/conversation/{id}
    
    F1-->>A: Display own message
    F2-->>Bu: Display new message + notification
```

---

## 7. Luồng Follow (Follow Flow)

```mermaid
sequenceDiagram
    autonumber
    participant A as 👤 User A
    participant F as 🌐 Frontend
    participant B as ⚙️ Backend
    participant D as 🗄️ MySQL
    
    A->>F: Click Follow on User B's profile
    F->>B: POST /api/follows/{B}?followerId={A}
    
    B->>D: Check existing follow relationship
    D-->>B: Not following
    
    B->>D: Create Follow record
    D-->>B: Saved
    
    B-->>F: Success response
    F-->>A: Update button to "Unfollow"
    F->>F: Update follower count display
```

---

## 8. Luồng Comment và Thông Báo (Comment & Notification Flow)

```mermaid
sequenceDiagram
    autonumber
    participant A as 👤 User A (Commenter)
    participant F1 as 🌐 Frontend A
    participant B as ⚙️ Backend
    participant S as 📦 Storage
    participant D as 🗄️ MySQL
    participant WS as 📡 WebSocket
    participant F2 as 🌐 Frontend B
    participant O as 👤 User B (Author)
    
    A->>F1: Write comment (+ optional image)
    F1->>B: POST /api/comments (multipart)
    
    opt Has Image
        B->>S: Upload image
        S-->>B: Image URL
    end
    
    B->>D: Save Comment
    D-->>B: Saved Comment
    
    B->>D: Update Post commentCount
    
    alt Not commenting on own post
        B->>D: Create Notification (type: COMMENT)
        B->>WS: Send to /user/{B}/queue/notifications
        WS->>F2: Push Notification
        F2-->>O: Show notification
    end
    
    B-->>F1: CommentResponse
    F1-->>A: Display new comment
```

---

## 9. Sơ Đồ Thành Phần Frontend (Frontend Component Diagram)

```mermaid
flowchart TB
    subgraph App["Angular App"]
        direction TB
        
        subgraph Core["Core Module"]
            AuthGuard["Auth Guard"]
            AuthService["Auth Service"]
            Interceptor["HTTP Interceptor"]
        end
        
        subgraph Features["Feature Modules"]
            direction LR
            
            subgraph AuthFeature["Auth"]
                LoginPage["Login Page"]
                RegisterPage["Register Page"]
            end
            
            subgraph FeedFeature["Feed"]
                FeedPage["Feed Page"]
                PostCard["Post Card"]
                PostEditor["Post Editor"]
                CommentSection["Comment Section"]
            end
            
            subgraph ChatFeature["Chat"]
                ChatPage["Chat Page"]
                ConversationList["Conversation List"]
                MessageArea["Message Area"]
                MessageInput["Message Input"]
            end
            
            subgraph ProfileFeature["Profile"]
                ProfilePage["Profile Page"]
                EditProfile["Edit Profile Popup"]
                FollowButton["Follow Button"]
            end
            
            subgraph NotifFeature["Notifications"]
                NotifPage["Notifications Page"]
                NotifItem["Notification Item"]
            end
            
            subgraph PeopleFeature["People"]
                PeoplePage["People Page"]
            end
        end
        
        subgraph Shared["Shared"]
            MainLayout["Main Layout"]
            Sidebar["Sidebar"]
        end
    end
    
    AuthGuard --> FeedPage
    AuthGuard --> ChatPage
    AuthGuard --> ProfilePage
    MainLayout --> Sidebar
    MainLayout --> FeedPage
    MainLayout --> ChatPage
```

---

## 10. Sơ Đồ Thành Phần Backend (Backend Component Diagram)

```mermaid
flowchart TB
    subgraph Controllers["Controller Layer"]
        UC[UserController]
        PC[PostController]
        CC[CommentController]
        FC[FollowController]
        NC[NotificationController]
        CSC[ChatSocketController]
        ConvC[ConversationController]
    end
    
    subgraph Services["Service Layer"]
        UPS[UserProfileService]
        PS[PostService]
        CS[CommentService]
        FS[FollowService]
        NS[NotificationService]
        MS[MessageService]
        ConvS[ConversationService]
    end
    
    subgraph Repositories["Repository Layer"]
        UR[(UserRepository)]
        PR[(PostRepository)]
        CR[(CommentRepository)]
        FR[(FollowRepository)]
        NR[(NotificationRepository)]
        MR[(MessageRepository)]
        ConvR[(ConversationRepository)]
    end
    
    subgraph External["External Services"]
        KC["🔐 Keycloak"]
        MinIO["📦 MinIO"]
        Cloud["☁️ Cloudinary"]
    end
    
    UC --> UPS
    PC --> PS
    CC --> CS
    FC --> FS
    NC --> NS
    CSC --> MS
    ConvC --> ConvS
    
    UPS --> UR
    UPS --> KC
    PS --> PR
    PS --> MinIO
    PS --> Cloud
    CS --> CR
    FS --> FR
    NS --> NR
    MS --> MR
    ConvS --> ConvR
```

---

## 11. Use Case Diagram

```mermaid
flowchart LR
    subgraph Actors
        U((👤 User))
        G((👤 Guest))
    end
    
    subgraph AuthSystem["Authentication"]
        Login[Login]
        Register[Register]
        Logout[Logout]
    end
    
    subgraph PostSystem["Post Management"]
        CreatePost[Create Post]
        ViewFeed[View Feed]
        LikePost[Like Post]
        CommentPost[Comment Post]
        EditPost[Edit Post]
        DeletePost[Delete Post]
    end
    
    subgraph SocialSystem["Social Features"]
        FollowUser[Follow User]
        UnfollowUser[Unfollow User]
        ViewProfile[View Profile]
        EditProfile[Edit Profile]
        ViewPeople[View Suggestions]
    end
    
    subgraph ChatSystem["Chat System"]
        ViewChats[View Conversations]
        SendMessage[Send Message]
        ViewMessages[View Messages]
        DeleteMessage[Delete Message]
    end
    
    subgraph NotifSystem["Notifications"]
        ViewNotifs[View Notifications]
        MarkRead[Mark as Read]
    end
    
    G --> Login
    G --> Register
    
    U --> Logout
    U --> CreatePost
    U --> ViewFeed
    U --> LikePost
    U --> CommentPost
    U --> EditPost
    U --> DeletePost
    U --> FollowUser
    U --> UnfollowUser
    U --> ViewProfile
    U --> EditProfile
    U --> ViewPeople
    U --> ViewChats
    U --> SendMessage
    U --> ViewMessages
    U --> DeleteMessage
    U --> ViewNotifs
    U --> MarkRead
```

---

## 12. Deployment Diagram

```mermaid
flowchart TB
    subgraph Docker["Docker Environment"]
        subgraph FrontendContainer["Frontend Container"]
            NG["Angular App<br/>:4200"]
        end
        
        subgraph BackendContainer["Backend Container"]
            SB["Spring Boot<br/>:8080"]
        end
        
        subgraph DatabaseContainer["Database Container"]
            MY[(MySQL 8.0<br/>:3306)]
        end
        
        subgraph StorageContainer["Storage Container"]
            MN["MinIO<br/>:9000/:9001"]
        end
        
        subgraph AuthContainer["Auth Container"]
            KC["Keycloak 21.1<br/>:8080"]
        end
    end
    
    subgraph Volumes["Docker Volumes"]
        V1[(mysql_data)]
        V2[(minio_data)]
        V3[(keycloak_data)]
    end
    
    User((User)) -->|:4200| NG
    NG -->|:8080| SB
    SB --> MY
    SB --> MN
    SB --> KC
    NG --> KC
    
    MY --- V1
    MN --- V2
    KC --- V3
```

---

## 13. Notification Types State Diagram

```mermaid
stateDiagram-v2
    [*] --> Created: User Action
    
    state Created {
        [*] --> LIKE: User likes a post
        [*] --> COMMENT: User comments
        [*] --> FOLLOW: User follows
        [*] --> MESSAGE: User sends message
    }
    
    Created --> Pending: Save to Database
    Pending --> Sent: Push via WebSocket
    Sent --> Displayed: Frontend receives
    
    Displayed --> Unread: Badge shown
    Unread --> Read: User clicks
    Read --> [*]
    
    Displayed --> ReadAll: Mark all read
    ReadAll --> [*]
```

---

## Ghi Chú

Các biểu đồ Mermaid trên có thể được render trong:
- **GitHub** (README.md, Issue, PR)
- **GitLab** 
- **VS Code** (với extension Markdown Preview Mermaid Support)
- **Notion**
- **Obsidian**
- **Mermaid Live Editor**: https://mermaid.live/

Để sử dụng trong báo cáo Word/PDF, có thể:
1. Export từ Mermaid Live Editor
2. Screenshot từ VS Code preview
3. Sử dụng tool như `mermaid-cli` để generate images
