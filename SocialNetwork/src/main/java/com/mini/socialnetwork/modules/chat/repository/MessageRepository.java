package com.mini.socialnetwork.modules.chat.repository;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import com.mini.socialnetwork.modules.chat.entity.Message;

import java.util.List;

public interface MessageRepository extends JpaRepository<Message, Long> {
    /**
     * Tìm các tin nhắn trong một cuộc hội thoại, phân trang và sắp xếp theo ID giảm dần (mới nhất trước).
     * Dùng cho lần tải đầu tiên.
     */
    List<Message> findByConversationIdOrderByIdDesc(Long conversationId, Pageable pageable);

    /**
     * Tìm các tin nhắn trong một cuộc hội thoại có ID nhỏ hơn một cursor cho trước.
     * Dùng cho infinite scroll.
     */
    List<Message> findByConversationIdAndIdLessThanOrderByIdDesc(Long conversationId, Long cursorId, Pageable pageable);
}
