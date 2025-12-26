package com.mini.socialnetwork.service;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.mini.socialnetwork.model.Notification;
import com.mini.socialnetwork.model.Notification.Type;
import com.mini.socialnetwork.repository.NotificationRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * Service xử lý logic nghiệp vụ cho Notification.
 * Quản lý việc tạo, đọc và đánh dấu thông báo đã đọc.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class NotificationService {

    private final NotificationRepository notificationRepository;

    /**
     * Tạo notification khi có tin nhắn mới.
     * 
     * @param senderId        ID người gửi tin nhắn
     * @param receiverId      ID người nhận tin nhắn
     * @param senderName      Tên người gửi
     * @param senderAvatarUrl Avatar URL người gửi
     * @param conversationId  ID cuộc hội thoại
     * @param messagePreview  Nội dung preview tin nhắn
     * @return Notification đã được lưu
     */
    @Transactional
    public Notification createMessageNotification(
            String senderId,
            String receiverId,
            String senderName,
            String senderAvatarUrl,
            String conversationId,
            String messagePreview) {

        // Truncate message preview nếu quá dài
        String preview = messagePreview;
        if (preview != null && preview.length() > 100) {
            preview = preview.substring(0, 97) + "...";
        }

        Notification notification = Notification.builder()
                .receiverId(UUID.fromString(receiverId))
                .senderId(UUID.fromString(senderId))
                .senderName(senderName)
                .senderAvatarUrl(senderAvatarUrl)
                .type(Type.MESSAGE)
                .conversationId(conversationId)
                .message(preview)
                .isRead(false)
                .createdAt(Instant.now())
                .build();

        Notification saved = notificationRepository.save(notification);
        log.info("Created message notification: {} -> {}", senderId, receiverId);
        return saved;
    }

    /**
     * Lấy danh sách notifications của một user với phân trang.
     * 
     * @param userId   ID user
     * @param pageable thông tin phân trang
     * @return Page chứa notifications
     */
    public Page<Notification> getNotifications(String userId, Pageable pageable) {
        return notificationRepository.findByReceiverIdOrderByCreatedAtDesc(
                UUID.fromString(userId), pageable);
    }

    /**
     * Đếm số lượng notification chưa đọc của user.
     * 
     * @param userId ID user
     * @return số lượng unread notifications
     */
    public long getUnreadCount(String userId) {
        return notificationRepository.countByReceiverIdAndIsReadFalse(UUID.fromString(userId));
    }

    /**
     * Đánh dấu một notification đã đọc.
     * 
     * @param notificationId ID notification
     * @param userId         ID user (để verify ownership)
     * @return true nếu thành công
     */
    @Transactional
    public boolean markAsRead(UUID notificationId, String userId) {
        return notificationRepository.findById(notificationId)
                .filter(n -> n.getReceiverId().toString().equals(userId))
                .map(n -> {
                    n.setRead(true);
                    notificationRepository.save(n);
                    log.info("Marked notification {} as read", notificationId);
                    return true;
                })
                .orElse(false);
    }

    /**
     * Đánh dấu tất cả notifications của user đã đọc.
     * 
     * @param userId ID user
     */
    @Transactional
    public void markAllAsRead(String userId) {
        List<Notification> unreadNotifications = notificationRepository
                .findByReceiverIdAndIsReadFalse(UUID.fromString(userId));

        unreadNotifications.forEach(n -> n.setRead(true));
        notificationRepository.saveAll(unreadNotifications);
        log.info("Marked {} notifications as read for user {}", unreadNotifications.size(), userId);
    }

    /**
     * Đánh dấu các notifications của một conversation đã đọc.
     * Dùng khi user mở một conversation để xem tin nhắn.
     * 
     * @param userId         ID user
     * @param conversationId ID conversation
     */
    @Transactional
    public void markConversationNotificationsAsRead(String userId, String conversationId) {
        List<Notification> unreadNotifications = notificationRepository
                .findByReceiverIdAndIsReadFalse(UUID.fromString(userId))
                .stream()
                .filter(n -> conversationId.equals(n.getConversationId()))
                .toList();

        unreadNotifications.forEach(n -> n.setRead(true));
        notificationRepository.saveAll(unreadNotifications);
        log.info("Marked {} conversation notifications as read for user {} in conversation {}",
                unreadNotifications.size(), userId, conversationId);
    }
}
