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
 * Cung cấp các endpoint để quản lý Users, Posts, Comments
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
        log.info("Admin: Permanently deleting user: {}", id);
        adminService.deleteUser(id);
        return ResponseEntity.ok(Map.of("message", "User permanently deleted from system"));
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
}
