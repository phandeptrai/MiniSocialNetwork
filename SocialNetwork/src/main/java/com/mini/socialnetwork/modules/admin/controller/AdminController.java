package com.mini.socialnetwork.modules.admin.controller;

import com.mini.socialnetwork.modules.admin.dto.*;
import com.mini.socialnetwork.modules.admin.service.AdminService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * REST Controller cho Admin panel
 * Cung cấp các endpoint để quản lý toàn bộ entities trong hệ thống
 */
@Slf4j
@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminController {

    private final AdminService adminService;

    // ==================== DASHBOARD ====================

    @GetMapping("/dashboard")
    public ResponseEntity<AdminDashboardDto> getDashboard() {
        log.info("Admin: Getting dashboard statistics");
        return ResponseEntity.ok(adminService.getDashboard());
    }

    // ==================== USER MANAGEMENT ====================

    @GetMapping("/users")
    public ResponseEntity<List<UserAdminDto>> getAllUsers() {
        log.info("Admin: Getting all users");
        return ResponseEntity.ok(adminService.getAllUsers());
    }

    @GetMapping("/users/{id}")
    public ResponseEntity<UserAdminDto> getUserById(@PathVariable UUID id) {
        log.info("Admin: Getting user by id: {}", id);
        return ResponseEntity.ok(adminService.getUserById(id));
    }

    @PutMapping("/users/{id}")
    public ResponseEntity<UserAdminDto> updateUser(@PathVariable UUID id, @RequestBody UserAdminDto dto) {
        log.info("Admin: Updating user: {}", id);
        return ResponseEntity.ok(adminService.updateUser(id, dto));
    }

    @DeleteMapping("/users/{id}")
    public ResponseEntity<Map<String, String>> deleteUser(@PathVariable UUID id) {
        log.info("Admin: Deleting user: {}", id);
        adminService.deleteUser(id);
        return ResponseEntity.ok(Map.of("message", "User deactivated successfully"));
    }

    // ==================== POST MANAGEMENT ====================

    @GetMapping("/posts")
    public ResponseEntity<List<PostAdminDto>> getAllPosts() {
        log.info("Admin: Getting all posts");
        return ResponseEntity.ok(adminService.getAllPosts());
    }

    @GetMapping("/posts/{id}")
    public ResponseEntity<PostAdminDto> getPostById(@PathVariable UUID id) {
        log.info("Admin: Getting post by id: {}", id);
        return ResponseEntity.ok(adminService.getPostById(id));
    }

    @PutMapping("/posts/{id}")
    public ResponseEntity<PostAdminDto> updatePost(@PathVariable UUID id, @RequestBody PostAdminDto dto) {
        log.info("Admin: Updating post: {}", id);
        return ResponseEntity.ok(adminService.updatePost(id, dto));
    }

    @DeleteMapping("/posts/{id}")
    public ResponseEntity<Map<String, String>> deletePost(@PathVariable UUID id) {
        log.info("Admin: Deleting post: {}", id);
        adminService.deletePost(id);
        return ResponseEntity.ok(Map.of("message", "Post deleted successfully"));
    }

    // ==================== COMMENT MANAGEMENT ====================

    @GetMapping("/comments")
    public ResponseEntity<List<CommentAdminDto>> getAllComments() {
        log.info("Admin: Getting all comments");
        return ResponseEntity.ok(adminService.getAllComments());
    }

    @GetMapping("/comments/{id}")
    public ResponseEntity<CommentAdminDto> getCommentById(@PathVariable UUID id) {
        log.info("Admin: Getting comment by id: {}", id);
        return ResponseEntity.ok(adminService.getCommentById(id));
    }

    @PutMapping("/comments/{id}")
    public ResponseEntity<CommentAdminDto> updateComment(@PathVariable UUID id, @RequestBody CommentAdminDto dto) {
        log.info("Admin: Updating comment: {}", id);
        return ResponseEntity.ok(adminService.updateComment(id, dto));
    }

    @DeleteMapping("/comments/{id}")
    public ResponseEntity<Map<String, String>> deleteComment(@PathVariable UUID id) {
        log.info("Admin: Deleting comment: {}", id);
        adminService.deleteComment(id);
        return ResponseEntity.ok(Map.of("message", "Comment deleted successfully"));
    }

    // ==================== NOTIFICATION MANAGEMENT ====================

    @GetMapping("/notifications")
    public ResponseEntity<List<NotificationAdminDto>> getAllNotifications() {
        log.info("Admin: Getting all notifications");
        return ResponseEntity.ok(adminService.getAllNotifications());
    }

    @DeleteMapping("/notifications/{id}")
    public ResponseEntity<Map<String, String>> deleteNotification(@PathVariable UUID id) {
        log.info("Admin: Deleting notification: {}", id);
        adminService.deleteNotification(id);
        return ResponseEntity.ok(Map.of("message", "Notification deleted successfully"));
    }

    // ==================== FOLLOW MANAGEMENT ====================

    @GetMapping("/follows")
    public ResponseEntity<List<FollowAdminDto>> getAllFollows() {
        log.info("Admin: Getting all follows");
        return ResponseEntity.ok(adminService.getAllFollows());
    }

    @DeleteMapping("/follows")
    public ResponseEntity<Map<String, String>> deleteFollow(
            @RequestParam String followerId,
            @RequestParam String followingId) {
        log.info("Admin: Deleting follow: {} -> {}", followerId, followingId);
        adminService.deleteFollow(followerId, followingId);
        return ResponseEntity.ok(Map.of("message", "Follow relationship deleted successfully"));
    }

    // ==================== CONVERSATION MANAGEMENT ====================

    @GetMapping("/conversations")
    public ResponseEntity<List<ConversationAdminDto>> getAllConversations() {
        log.info("Admin: Getting all conversations");
        return ResponseEntity.ok(adminService.getAllConversations());
    }

    @DeleteMapping("/conversations/{id}")
    public ResponseEntity<Map<String, String>> deleteConversation(@PathVariable Long id) {
        log.info("Admin: Deleting conversation: {}", id);
        adminService.deleteConversation(id);
        return ResponseEntity.ok(Map.of("message", "Conversation deleted successfully"));
    }

    // ==================== MESSAGE MANAGEMENT ====================

    @GetMapping("/messages")
    public ResponseEntity<List<MessageAdminDto>> getAllMessages() {
        log.info("Admin: Getting all messages");
        return ResponseEntity.ok(adminService.getAllMessages());
    }

    @GetMapping("/messages/conversation/{conversationId}")
    public ResponseEntity<List<MessageAdminDto>> getMessagesByConversation(@PathVariable Long conversationId) {
        log.info("Admin: Getting messages for conversation: {}", conversationId);
        return ResponseEntity.ok(adminService.getMessagesByConversation(conversationId));
    }

    @DeleteMapping("/messages/{id}")
    public ResponseEntity<Map<String, String>> deleteMessage(@PathVariable Long id) {
        log.info("Admin: Deleting message: {}", id);
        adminService.deleteMessage(id);
        return ResponseEntity.ok(Map.of("message", "Message deleted successfully"));
    }
}
