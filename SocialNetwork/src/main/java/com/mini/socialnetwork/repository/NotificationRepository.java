package com.mini.socialnetwork.repository;

import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import com.mini.socialnetwork.model.Notification;

/**
 * Repository truy cập dữ liệu Notification.
 * Cung cấp các phương thức để lấy và quản lý thông báo của người dùng.
 */
@Repository
public interface NotificationRepository extends JpaRepository<Notification, UUID> {

    /**
     * Lấy danh sách notifications của một user, sắp xếp theo thời gian mới nhất.
     * 
     * @param receiverId ID của người nhận thông báo
     * @param pageable   thông tin phân trang
     * @return Page chứa các notifications
     */
    Page<Notification> findByReceiverIdOrderByCreatedAtDesc(UUID receiverId, Pageable pageable);

    /**
     * Đếm số thông báo chưa đọc của một user.
     * 
     * @param receiverId ID của người nhận thông báo
     * @return số lượng thông báo chưa đọc
     */
    long countByReceiverIdAndIsReadFalse(UUID receiverId);

    /**
     * Lấy tất cả notifications chưa đọc của một user.
     * 
     * @param receiverId ID của người nhận thông báo
     * @return danh sách notifications chưa đọc
     */
    java.util.List<Notification> findByReceiverIdAndIsReadFalse(UUID receiverId);

    /**
     * Xóa tất cả notifications mà user là người nhận
     */
    @Modifying
    @Transactional
    void deleteByReceiverId(UUID receiverId);

    /**
     * Xóa tất cả notifications mà user là người gửi
     */
    @Modifying
    @Transactional
    void deleteBySenderId(UUID senderId);
}
