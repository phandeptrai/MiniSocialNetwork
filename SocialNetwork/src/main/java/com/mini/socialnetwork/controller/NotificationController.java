package com.mini.socialnetwork.controller;

import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.mini.socialnetwork.model.Notification;
import com.mini.socialnetwork.service.NotificationService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * REST Controller quản lý thông báo.
 * Cung cấp các endpoint để lấy danh sách, đếm unread và đánh dấu đã đọc.
 */
@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
@Slf4j
public class NotificationController {

    private final NotificationService notificationService;

    /**
     * Lấy danh sách notifications của user hiện tại với phân trang.
     * 
     * @param jwt  JWT token chứa thông tin user
     * @param page số trang (bắt đầu từ 0)
     * @param size kích thước mỗi trang
     * @return Page chứa notifications
     */
    @GetMapping
    public ResponseEntity<Page<Notification>> getNotifications(
            @AuthenticationPrincipal Jwt jwt,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {

        String userId = jwt.getSubject();
        log.info("Getting notifications for user {}, page {}, size {}", userId, page, size);

        Pageable pageable = PageRequest.of(page, size);
        Page<Notification> notifications = notificationService.getNotifications(userId, pageable);

        return ResponseEntity.ok(notifications);
    }

    /**
     * Lấy số lượng notification chưa đọc.
     * 
     * @param jwt JWT token
     * @return số lượng unread
     */
    @GetMapping("/unread-count")
    public ResponseEntity<UnreadCountResponse> getUnreadCount(@AuthenticationPrincipal Jwt jwt) {
        String userId = jwt.getSubject();
        long count = notificationService.getUnreadCount(userId);
        log.info("Unread count for user {}: {}", userId, count);
        return ResponseEntity.ok(new UnreadCountResponse(count));
    }

    /**
     * Đánh dấu một notification đã đọc.
     * 
     * @param jwt JWT token
     * @param id  ID notification
     * @return OK nếu thành công
     */
    @PutMapping("/{id}/read")
    public ResponseEntity<Void> markAsRead(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable UUID id) {

        String userId = jwt.getSubject();
        boolean success = notificationService.markAsRead(id, userId);

        if (success) {
            return ResponseEntity.ok().build();
        }
        return ResponseEntity.notFound().build();
    }

    /**
     * Đánh dấu tất cả notifications đã đọc.
     * 
     * @param jwt JWT token
     * @return OK
     */
    @PutMapping("/read-all")
    public ResponseEntity<Void> markAllAsRead(@AuthenticationPrincipal Jwt jwt) {
        String userId = jwt.getSubject();
        notificationService.markAllAsRead(userId);
        return ResponseEntity.ok().build();
    }

    /**
     * Đánh dấu các notifications của một conversation đã đọc.
     * 
     * @param jwt            JWT token
     * @param conversationId ID conversation
     * @return OK
     */
    @PutMapping("/conversation/{conversationId}/read")
    public ResponseEntity<Void> markConversationAsRead(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable String conversationId) {

        String userId = jwt.getSubject();
        notificationService.markConversationNotificationsAsRead(userId, conversationId);
        return ResponseEntity.ok().build();
    }

    /**
     * Response object cho unread count.
     */
    public record UnreadCountResponse(long count) {
    }
}
