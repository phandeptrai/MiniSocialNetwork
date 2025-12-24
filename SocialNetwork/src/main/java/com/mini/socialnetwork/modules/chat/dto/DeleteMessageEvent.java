package com.mini.socialnetwork.modules.chat.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Event thông báo việc xóa tin nhắn qua WebSocket.
 * <p>
 * Event này được broadcast đến tất cả participant trong cuộc hội thoại
 * khi một tin nhắn bị xóa. Client nhận event này để cập nhật UI,
 * ví dụ hiển thị "Tin nhắn đã bị xóa" thay vì nội dung gốc.
 * </p>
 *
 * <h2>Destination:</h2>
 * <p>Event được gửi đến: /topic/conversation/{conversationId}</p>
 *
 * <h2>Xử lý phía client:</h2>
 * <ol>
 *   <li>Subscribe vào topic của cuộc hội thoại đang mở</li>
 *   <li>Khi nhận DeleteMessageEvent, tìm tin nhắn theo messageId</li>
 *   <li>Cập nhật UI để đánh dấu tin nhắn đã xóa</li>
 * </ol>
 *
 * @author MiniSocialNetwork Team
 * @version 1.0
 * @see com.mini.socialnetwork.modules.chat.controller.ChatSocketController#deleteMessage
 */
@Data
@AllArgsConstructor
@NoArgsConstructor
public class DeleteMessageEvent {

    /**
     * ID của tin nhắn đã bị xóa.
     * <p>
     * Client sử dụng ID này để tìm và cập nhật tin nhắn trong list.
     * </p>
     */
    private Long messageId;

    /**
     * ID của cuộc hội thoại chứa tin nhắn.
     * <p>
     * Giúp client xác định context và cập nhật đúng conversation.
     * </p>
     */
    private Long conversationId;
}