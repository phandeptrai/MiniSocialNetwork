package com.mini.socialnetwork.modules.chat.dto;

import lombok.Data;

/**
 * DTO chứa yêu cầu xóa tin nhắn qua WebSocket.
 * <p>
 * Client gửi request này đến endpoint /app/chat.deleteMessage
 * để yêu cầu xóa một tin nhắn. Server sẽ xác minh quyền
 * (chỉ người gửi mới được xóa) trước khi thực hiện.
 * </p>
 *
 * <h2>Quy trình xóa tin nhắn:</h2>
 * <ol>
 *   <li>Client gửi DeleteMessageRequest với messageId</li>
 *   <li>Server kiểm tra user có phải sender của message không</li>
 *   <li>Nếu hợp lệ, soft-delete tin nhắn (đánh dấu isDeleted = true)</li>
 *   <li>Broadcast DeleteMessageEvent đến tất cả participant</li>
 * </ol>
 *
 * @author MiniSocialNetwork Team
 * @version 1.0
 * @see DeleteMessageEvent
 * @see com.mini.socialnetwork.modules.chat.controller.ChatSocketController#deleteMessage
 */
@Data
public class DeleteMessageRequest {

    /**
     * ID của tin nhắn cần xóa.
     * <p>
     * Phải là tin nhắn do chính người gửi request tạo ra.
     * Server sẽ trả về 403 Forbidden nếu không phải.
     * </p>
     */
    private Long messageId;
}
