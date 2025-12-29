package com.mini.socialnetwork.modules.admin.service;

import com.mini.socialnetwork.model.User;
import com.mini.socialnetwork.modules.admin.dto.*;
import com.mini.socialnetwork.modules.auth.service.KeycloakAdminService;
import com.mini.socialnetwork.modules.chat.repository.MessageRepository;
import com.mini.socialnetwork.modules.comment.entity.Comment;
import com.mini.socialnetwork.modules.comment.repository.CommentRepository;
import com.mini.socialnetwork.modules.post.entity.Post;
import com.mini.socialnetwork.modules.post.repository.PostRepository;
import com.mini.socialnetwork.repository.FollowRepository;
import com.mini.socialnetwork.repository.NotificationRepository;
import com.mini.socialnetwork.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Service xử lý business logic cho Admin panel
 * Quản lý Users, Posts, Comments
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class AdminService {

    private final UserRepository userRepository;
    private final PostRepository postRepository;
    private final CommentRepository commentRepository;
    private final NotificationRepository notificationRepository;
    private final FollowRepository followRepository;
    private final MessageRepository messageRepository;
    private final KeycloakAdminService keycloakAdminService;

    private static final DateTimeFormatter formatter = DateTimeFormatter.ISO_INSTANT;
    private static final DateTimeFormatter dateFormatter = DateTimeFormatter.ofPattern("dd/MM");

    // ==================== DASHBOARD ====================

    public AdminDashboardDto getDashboard() {
        return AdminDashboardDto.builder()
                .totalUsers(userRepository.count())
                .totalPosts(postRepository.countByIsDeletedFalse())
                .totalComments(commentRepository.countByIsDeletedFalse())
                .build();
    }

    /**
     * Sync users từ Keycloak vào MySQL database
     * Lấy tất cả users từ Keycloak và tạo các user chưa tồn tại trong MySQL
     * 
     * @return số lượng users được sync
     */
    @Transactional
    public int syncUsersFromKeycloak() {
        log.info("Starting sync users from Keycloak to MySQL...");

        List<Map<String, Object>> keycloakUsers = keycloakAdminService.getAllUsers();
        int syncedCount = 0;

        for (Map<String, Object> kcUser : keycloakUsers) {
            try {
                String idStr = (String) kcUser.get("id");
                UUID userId = UUID.fromString(idStr);

                // Check if user already exists in MySQL
                if (userRepository.findById(userId).isEmpty()) {
                    User user = User.builder()
                            .id(userId)
                            .username((String) kcUser.get("username"))
                            .email((String) kcUser.get("email"))
                            .name(buildFullName(kcUser))
                            .bio("")
                            .avatarUrl(null)
                            .isActive(Boolean.TRUE.equals(kcUser.get("enabled")))
                            .createdAt(Instant.now())
                            .updatedAt(Instant.now())
                            .build();

                    userRepository.save(user);
                    syncedCount++;
                    log.info("Synced user: {} ({})", user.getUsername(), userId);
                }
            } catch (Exception e) {
                log.warn("Failed to sync user: {}", e.getMessage());
            }
        }

        log.info("Sync completed. {} users synced from Keycloak", syncedCount);
        return syncedCount;
    }

    private String buildFullName(Map<String, Object> kcUser) {
        String firstName = (String) kcUser.get("firstName");
        String lastName = (String) kcUser.get("lastName");

        if (firstName != null && lastName != null) {
            return firstName + " " + lastName;
        } else if (firstName != null) {
            return firstName;
        } else if (lastName != null) {
            return lastName;
        }
        return (String) kcUser.get("username");
    }

    /**
     * Lấy thống kê số lượng bài đăng theo ngày trong khoảng thời gian
     * 
     * @param days Số ngày cần thống kê (ví dụ: 7, 30, 90)
     * @return PostStatisticsDto chứa labels và values để vẽ biểu đồ
     */
    public PostStatisticsDto getPostStatistics(int days) {
        ZoneId zoneId = ZoneId.systemDefault();
        LocalDate today = LocalDate.now(zoneId);
        LocalDate startLocalDate = today.minusDays(days - 1);

        Instant endDate = today.plusDays(1).atStartOfDay(zoneId).toInstant();
        Instant startDate = startLocalDate.atStartOfDay(zoneId).toInstant();

        log.info("Getting post statistics from {} to {}", startDate, endDate);

        List<Object[]> results = postRepository.countPostsByDateRange(startDate, endDate);

        // Tạo map để điền các ngày không có bài đăng với giá trị 0
        Map<LocalDate, Long> dateCountMap = new LinkedHashMap<>();
        LocalDate currentDate = startLocalDate;

        while (!currentDate.isAfter(today)) {
            dateCountMap.put(currentDate, 0L);
            currentDate = currentDate.plusDays(1);
        }

        // Điền dữ liệu từ kết quả query
        for (Object[] row : results) {
            try {
                LocalDate date;
                if (row[0] instanceof java.sql.Date) {
                    date = ((java.sql.Date) row[0]).toLocalDate();
                } else if (row[0] instanceof java.time.LocalDate) {
                    date = (LocalDate) row[0];
                } else {
                    // Fallback: parse string
                    date = LocalDate.parse(row[0].toString());
                }
                Long count = ((Number) row[1]).longValue();
                dateCountMap.put(date, count);
            } catch (Exception e) {
                log.warn("Error parsing date from result: {}", e.getMessage());
            }
        }

        List<String> labels = new ArrayList<>();
        List<Long> values = new ArrayList<>();

        for (Map.Entry<LocalDate, Long> entry : dateCountMap.entrySet()) {
            labels.add(entry.getKey().format(dateFormatter));
            values.add(entry.getValue());
        }

        long totalPosts = values.stream().mapToLong(Long::longValue).sum();

        log.info("Post statistics: {} days, {} total posts", days, totalPosts);

        return PostStatisticsDto.builder()
                .labels(labels)
                .values(values)
                .totalPosts(totalPosts)
                .build();
    }

    // ==================== USER MANAGEMENT ====================

    public List<UserAdminDto> getAllUsers() {
        return userRepository.findAll().stream()
                .map(this::toUserAdminDto)
                .collect(Collectors.toList());
    }

    public UserAdminDto getUserById(UUID id) {
        return userRepository.findById(id)
                .map(this::toUserAdminDto)
                .orElseThrow(() -> new RuntimeException("User not found: " + id));
    }

    @Transactional
    public UserAdminDto updateUser(UUID id, UserAdminDto dto) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found: " + id));

        if (dto.getName() != null)
            user.setName(dto.getName());
        if (dto.getBio() != null)
            user.setBio(dto.getBio());
        if (dto.getAvatarUrl() != null)
            user.setAvatarUrl(dto.getAvatarUrl());
        user.setActive(dto.isActive());
        user.setUpdatedAt(Instant.now());

        return toUserAdminDto(userRepository.save(user));
    }

    /**
     * Xóa hoàn toàn user và tất cả nội dung liên quan:
     * - Posts của user
     * - Comments của user
     * - Messages của user
     * - Notifications liên quan đến user
     * - Follow relationships
     * - User từ Keycloak
     * - User từ MySQL
     */
    @Transactional
    public void deleteUser(UUID id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found: " + id));

        String userId = id.toString();
        log.info("Starting complete deletion of user: {} ({})", user.getUsername(), id);

        // 1. Xóa tất cả comments của user
        try {
            commentRepository.deleteByUserId(id);
            log.info("Deleted all comments by user: {}", id);
        } catch (Exception e) {
            log.warn("Error deleting comments: {}", e.getMessage());
        }

        // 2. Lấy tất cả posts của user và xóa comments trên các posts đó
        try {
            List<Post> userPosts = postRepository.findByAuthorId(id);
            for (Post post : userPosts) {
                commentRepository.deleteByPostId(post.getId());
            }
            // Xóa tất cả posts của user
            postRepository.deleteByAuthorId(id);
            log.info("Deleted {} posts by user: {}", userPosts.size(), id);
        } catch (Exception e) {
            log.warn("Error deleting posts: {}", e.getMessage());
        }

        // 3. Xóa tất cả messages của user
        try {
            messageRepository.deleteBySenderId(userId);
            log.info("Deleted all messages by user: {}", id);
        } catch (Exception e) {
            log.warn("Error deleting messages: {}", e.getMessage());
        }

        // 4. Xóa tất cả notifications liên quan đến user
        try {
            notificationRepository.deleteByReceiverId(id);
            notificationRepository.deleteBySenderId(id);
            log.info("Deleted all notifications related to user: {}", id);
        } catch (Exception e) {
            log.warn("Error deleting notifications: {}", e.getMessage());
        }

        // 5. Xóa tất cả follow relationships
        try {
            followRepository.deleteByFollowId_FollowerId(userId);
            followRepository.deleteByFollowId_FollowingId(userId);
            log.info("Deleted all follow relationships for user: {}", id);
        } catch (Exception e) {
            log.warn("Error deleting follows: {}", e.getMessage());
        }

        // 6. Xóa user khỏi Keycloak
        try {
            keycloakAdminService.deleteUser(userId);
            log.info("Deleted user from Keycloak: {}", id);
        } catch (Exception e) {
            log.warn("Failed to delete user from Keycloak (may already be deleted): {}", e.getMessage());
        }

        // 7. Xóa user khỏi MySQL
        userRepository.delete(user);
        log.info("Permanently deleted user and all related content: {} ({})", user.getUsername(), id);
    }

    private UserAdminDto toUserAdminDto(User user) {
        return UserAdminDto.builder()
                .id(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .name(user.getName())
                .bio(user.getBio())
                .avatarUrl(user.getAvatarUrl())
                .isActive(user.isActive())
                .createdAt(formatInstant(user.getCreatedAt()))
                .updatedAt(formatInstant(user.getUpdatedAt()))
                .followersCount(user.getFollowers() != null ? user.getFollowers().size() : 0)
                .followingCount(user.getFollowing() != null ? user.getFollowing().size() : 0)
                .build();
    }

    // ==================== POST MANAGEMENT ====================

    public List<PostAdminDto> getAllPosts() {
        return postRepository.findAll(Sort.by(Sort.Direction.DESC, "createdAt")).stream()
                .map(this::toPostAdminDto)
                .collect(Collectors.toList());
    }

    public PostAdminDto getPostById(UUID id) {
        return postRepository.findById(id)
                .map(this::toPostAdminDto)
                .orElseThrow(() -> new RuntimeException("Post not found: " + id));
    }

    @Transactional
    public PostAdminDto updatePost(UUID id, PostAdminDto dto) {
        Post post = postRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Post not found: " + id));

        if (dto.getContent() != null)
            post.setContent(dto.getContent());
        post.setDeleted(dto.isDeleted());
        post.setUpdatedAt(Instant.now());

        return toPostAdminDto(postRepository.save(post));
    }

    @Transactional
    public void deletePost(UUID id) {
        Post post = postRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Post not found: " + id));
        post.setDeleted(true);
        post.setUpdatedAt(Instant.now());
        postRepository.save(post);
        log.info("Soft deleted post: {}", id);
    }

    private PostAdminDto toPostAdminDto(Post post) {
        // Try to get author info
        String authorName = "";
        String authorUsername = "";
        if (post.getAuthorId() != null) {
            var author = userRepository.findById(post.getAuthorId()).orElse(null);
            if (author != null) {
                authorName = author.getName();
                authorUsername = author.getUsername();
            }
        }

        return PostAdminDto.builder()
                .id(post.getId())
                .authorId(post.getAuthorId())
                .authorName(authorName)
                .authorUsername(authorUsername)
                .content(post.getContent())
                .likeCount(post.getLikeCount())
                .commentCount(post.getCommentCount())
                .isDeleted(post.isDeleted())
                .createdAt(formatInstant(post.getCreatedAt()))
                .updatedAt(formatInstant(post.getUpdatedAt()))
                .build();
    }

    // ==================== COMMENT MANAGEMENT ====================

    public List<CommentAdminDto> getAllComments() {
        return commentRepository.findAll(Sort.by(Sort.Direction.DESC, "createdAt")).stream()
                .map(this::toCommentAdminDto)
                .collect(Collectors.toList());
    }

    public CommentAdminDto getCommentById(UUID id) {
        return commentRepository.findById(id)
                .map(this::toCommentAdminDto)
                .orElseThrow(() -> new RuntimeException("Comment not found: " + id));
    }

    @Transactional
    public CommentAdminDto updateComment(UUID id, CommentAdminDto dto) {
        Comment comment = commentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Comment not found: " + id));

        if (dto.getContent() != null)
            comment.setContent(dto.getContent());
        comment.setDeleted(dto.isDeleted());
        comment.setUpdatedAt(Instant.now());

        return toCommentAdminDto(commentRepository.save(comment));
    }

    @Transactional
    public void deleteComment(UUID id) {
        Comment comment = commentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Comment not found: " + id));
        comment.setDeleted(true);
        comment.setUpdatedAt(Instant.now());
        commentRepository.save(comment);
        log.info("Soft deleted comment: {}", id);
    }

    private CommentAdminDto toCommentAdminDto(Comment comment) {
        String userName = "";
        String userUsername = "";
        if (comment.getUserId() != null) {
            var user = userRepository.findById(comment.getUserId()).orElse(null);
            if (user != null) {
                userName = user.getName();
                userUsername = user.getUsername();
            }
        }

        return CommentAdminDto.builder()
                .id(comment.getId())
                .postId(comment.getPostId())
                .userId(comment.getUserId())
                .userName(userName)
                .userUsername(userUsername)
                .content(comment.getContent())
                .imageUrl(comment.getImageUrl())
                .isDeleted(comment.isDeleted())
                .createdAt(formatInstant(comment.getCreatedAt()))
                .updatedAt(formatInstant(comment.getUpdatedAt()))
                .build();
    }

    // ==================== HELPER METHODS ====================

    private String formatInstant(Instant instant) {
        return instant != null ? formatter.format(instant) : null;
    }
}
