package com.mini.socialnetwork.modules.chat.repository;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.transaction.annotation.Transactional;

import com.mini.socialnetwork.modules.chat.entity.Message;

import java.util.List;

/**
 * Repository truy cập dữ liệu tin nhắn.
 * <p>
 * Kế thừa JpaRepository để có các method CRUD cơ bản.
 * Định nghĩa thêm các query tùy chỉnh cho cursor-based pagination
 * khi load lịch sử tin nhắn trong cuộc hội thoại.
 * </p>
 *
 * <h2>Pagination Strategy:</h2>
 * <p>
 * Sử dụng message ID làm cursor vì ID là auto-increment và unique.
 * Tin nhắn mới có ID lớn hơn, nên sắp xếp DESC để hiển thị mới nhất trước.
 * </p>
 *
 * @author MiniSocialNetwork Team
 * @version 1.0
 */
public interface MessageRepository extends JpaRepository<Message, Long> {

    /**
     * Lấy tin nhắn trong cuộc hội thoại, sắp xếp theo ID giảm dần.
     * <p>
     * Dùng cho lần tải đầu tiên khi chưa có cursor.
     * Spring Data JPA tự động tạo query từ tên method.
     * </p>
     *
     * @param conversationId ID của cuộc hội thoại
     * @param pageable       thông tin phân trang (size)
     * @return danh sách tin nhắn mới nhất trong conversation
     */
    List<Message> findByConversationIdOrderByIdDesc(Long conversationId, Pageable pageable);

    /**
     * Lấy các tin nhắn cũ hơn một cursor trong cuộc hội thoại.
     * <p>
     * Dùng cho infinite scroll: client scroll lên để load tin nhắn cũ hơn.
     * Truyền ID của tin nhắn cuối cùng trong list hiện tại làm cursor.
     * </p>
     *
     * @param conversationId ID của cuộc hội thoại
     * @param cursorId       ID của tin nhắn cuối cùng từ lần load trước
     * @param pageable       thông tin phân trang (size)
     * @return danh sách tin nhắn có ID nhỏ hơn cursor (cũ hơn)
     */
    List<Message> findByConversationIdAndIdLessThanOrderByIdDesc(Long conversationId, Long cursorId, Pageable pageable);

    /**
     * Xóa tất cả messages của một sender
     */
    @Modifying
    @Transactional
    void deleteBySenderId(String senderId);
}
