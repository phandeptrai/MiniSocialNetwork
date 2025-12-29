package com.mini.socialnetwork.modules.admin.service;

import com.mini.socialnetwork.model.Follow;
import com.mini.socialnetwork.model.FollowId;
import com.mini.socialnetwork.model.Notification;
import com.mini.socialnetwork.model.User;
import com.mini.socialnetwork.modules.admin.dto.*;
import com.mini.socialnetwork.modules.auth.service.KeycloakAdminService;
import com.mini.socialnetwork.modules.chat.entity.Conversation;
import com.mini.socialnetwork.modules.chat.entity.Message;
import com.mini.socialnetwork.modules.chat.repository.ConversationRepository;
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
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Service xử lý business logic cho Admin panel
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
    private final ConversationRepository conversationRepository;
    private final MessageRepository messageRepository;
    private final KeycloakAdminService keycloakAdminService;

    private static final DateTimeFormatter formatter = DateTimeFormatter.ISO_INSTANT;

    // ==================== DASHBOARD ====================

    public AdminDashboardDto getDashboard() {
        return AdminDashboardDto.builder()
                .totalUsers(userRepository.count())
                .totalPosts(postRepository.count())
                .totalComments(commentRepository.count())
                .totalNotifications(notificationRepository.count())
                .totalFollows(followRepository.count())
                .totalConversations(conversationRepository.count())
                .totalMessages(messageRepository.count())
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

    @Transactional
    public void deleteUser(UUID id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found: " + id));
        user.setActive(false);
        user.setUpdatedAt(Instant.now());
        userRepository.save(user);
        log.info("Deactivated user: {}", id);
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
            userRepository.findById(post.getAuthorId()).ifPresent(user -> {
                // Using local variables, need to set via builder
            });
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

    // ==================== NOTIFICATION MANAGEMENT ====================

    public List<NotificationAdminDto> getAllNotifications() {
        return notificationRepository.findAll(Sort.by(Sort.Direction.DESC, "createdAt")).stream()
                .map(this::toNotificationAdminDto)
                .collect(Collectors.toList());
    }

    @Transactional
    public void deleteNotification(UUID id) {
        notificationRepository.deleteById(id);
        log.info("Deleted notification: {}", id);
    }

    private NotificationAdminDto toNotificationAdminDto(Notification notification) {
        String receiverName = "";
        if (notification.getReceiverId() != null) {
            var receiver = userRepository.findById(notification.getReceiverId()).orElse(null);
            if (receiver != null) {
                receiverName = receiver.getName();
            }
        }

        return NotificationAdminDto.builder()
                .id(notification.getId())
                .receiverId(notification.getReceiverId())
                .receiverName(receiverName)
                .senderId(notification.getSenderId())
                .senderName(notification.getSenderName())
                .type(notification.getType() != null ? notification.getType().name() : null)
                .postId(notification.getPostId())
                .conversationId(notification.getConversationId())
                .message(notification.getMessage())
                .isRead(notification.isRead())
                .createdAt(formatInstant(notification.getCreatedAt()))
                .build();
    }

    // ==================== FOLLOW MANAGEMENT ====================

    public List<FollowAdminDto> getAllFollows() {
        return followRepository.findAll().stream()
                .map(this::toFollowAdminDto)
                .collect(Collectors.toList());
    }

    @Transactional
    public void deleteFollow(String followerId, String followingId) {
        followRepository.deleteByFollowId_FollowerIdAndFollowId_FollowingId(followerId, followingId);
        log.info("Deleted follow relationship: {} -> {}", followerId, followingId);
    }

    private FollowAdminDto toFollowAdminDto(Follow follow) {
        String followerName = "";
        String followerUsername = "";
        String followingName = "";
        String followingUsername = "";

        try {
            UUID followerId = UUID.fromString(follow.getFollowId().getFollowerId());
            var follower = userRepository.findById(followerId).orElse(null);
            if (follower != null) {
                followerName = follower.getName();
                followerUsername = follower.getUsername();
            }
        } catch (Exception e) {
            // FollowerId might be Keycloak ID stored as string, try to get from Keycloak
            try {
                var keycloakUser = keycloakAdminService.getUserById(follow.getFollowId().getFollowerId());
                if (keycloakUser != null) {
                    followerName = (String) keycloakUser.getOrDefault("firstName", "") + " "
                            + keycloakUser.getOrDefault("lastName", "");
                    followerUsername = (String) keycloakUser.getOrDefault("username", "");
                }
            } catch (Exception ex) {
                log.debug("Could not fetch follower info: {}", ex.getMessage());
            }
        }

        try {
            UUID followingId = UUID.fromString(follow.getFollowId().getFollowingId());
            var following = userRepository.findById(followingId).orElse(null);
            if (following != null) {
                followingName = following.getName();
                followingUsername = following.getUsername();
            }
        } catch (Exception e) {
            try {
                var keycloakUser = keycloakAdminService.getUserById(follow.getFollowId().getFollowingId());
                if (keycloakUser != null) {
                    followingName = (String) keycloakUser.getOrDefault("firstName", "") + " "
                            + keycloakUser.getOrDefault("lastName", "");
                    followingUsername = (String) keycloakUser.getOrDefault("username", "");
                }
            } catch (Exception ex) {
                log.debug("Could not fetch following info: {}", ex.getMessage());
            }
        }

        return FollowAdminDto.builder()
                .followerId(follow.getFollowId().getFollowerId())
                .followerName(followerName.trim())
                .followerUsername(followerUsername)
                .followingId(follow.getFollowId().getFollowingId())
                .followingName(followingName.trim())
                .followingUsername(followingUsername)
                .createdAt(follow.getCreatedAt() != null ? follow.getCreatedAt().toString() : null)
                .build();
    }

    // ==================== CONVERSATION MANAGEMENT ====================

    public List<ConversationAdminDto> getAllConversations() {
        return conversationRepository.findAll(Sort.by(Sort.Direction.DESC, "updatedAt")).stream()
                .map(this::toConversationAdminDto)
                .collect(Collectors.toList());
    }

    @Transactional
    public void deleteConversation(Long id) {
        conversationRepository.deleteById(id);
        log.info("Deleted conversation: {}", id);
    }

    private ConversationAdminDto toConversationAdminDto(Conversation conversation) {
        return ConversationAdminDto.builder()
                .id(conversation.getId())
                .name(conversation.getName())
                .type(conversation.getType() != null ? conversation.getType().name() : null)
                .createdBy(conversation.getCreatedBy())
                .lastMessageContent(conversation.getLastMessageContent())
                .lastMessageSenderId(conversation.getLastMessageSenderId())
                .participantsCount(
                        conversation.getParticipantIds() != null ? conversation.getParticipantIds().size() : 0)
                .createdAt(formatInstant(conversation.getCreatedAt()))
                .updatedAt(formatInstant(conversation.getUpdatedAt()))
                .build();
    }

    // ==================== MESSAGE MANAGEMENT ====================

    public List<MessageAdminDto> getAllMessages() {
        Pageable pageable = PageRequest.of(0, 100, Sort.by(Sort.Direction.DESC, "createdAt"));
        return messageRepository.findAll(pageable).stream()
                .map(this::toMessageAdminDto)
                .collect(Collectors.toList());
    }

    public List<MessageAdminDto> getMessagesByConversation(Long conversationId) {
        Pageable pageable = PageRequest.of(0, 100, Sort.by(Sort.Direction.DESC, "id"));
        return messageRepository.findByConversationIdOrderByIdDesc(conversationId, pageable).stream()
                .map(this::toMessageAdminDto)
                .collect(Collectors.toList());
    }

    @Transactional
    public void deleteMessage(Long id) {
        Message message = messageRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Message not found: " + id));
        message.setDeleted(true);
        message.setContent("This message has been deleted by admin.");
        messageRepository.save(message);
        log.info("Soft deleted message: {}", id);
    }

    private MessageAdminDto toMessageAdminDto(Message message) {
        String senderName = "";
        try {
            var keycloakUser = keycloakAdminService.getUserById(message.getSenderId());
            if (keycloakUser != null) {
                senderName = (String) keycloakUser.getOrDefault("firstName", "") + " "
                        + keycloakUser.getOrDefault("lastName", "");
            }
        } catch (Exception e) {
            log.debug("Could not fetch sender info: {}", e.getMessage());
        }

        return MessageAdminDto.builder()
                .id(message.getId())
                .conversationId(message.getConversationId())
                .senderId(message.getSenderId())
                .senderName(senderName.trim())
                .content(message.getContent())
                .messageType(message.getMessageType() != null ? message.getMessageType().name() : null)
                .isDeleted(message.isDeleted())
                .createdAt(formatInstant(message.getCreatedAt()))
                .attachmentsCount(message.getAttachments() != null ? message.getAttachments().size() : 0)
                .build();
    }

    // ==================== HELPER METHODS ====================

    private String formatInstant(Instant instant) {
        return instant != null ? formatter.format(instant) : null;
    }
}
