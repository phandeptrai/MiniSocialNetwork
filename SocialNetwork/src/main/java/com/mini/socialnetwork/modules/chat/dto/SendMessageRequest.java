package com.mini.socialnetwork.modules.chat.dto;

import java.util.List;

import lombok.Data;

/**
 * DTO chứa yêu cầu gửi tin nhắn mới qua WebSocket.
 * <p>
 * Client gửi request này đến endpoint /app/chat.sendMessage để gửi tin nhắn.
 * Hỗ trợ hai trường hợp: gửi vào cuộc hội thoại đã tồn tại (có conversationId)
 * hoặc bắt đầu cuộc hội thoại mới (có recipientId).
 * </p>
 *
 * <h2>Các trường hợp sử dụng:</h2>
 * <ul>
 *   <li><strong>Gửi vào conversation có sẵn:</strong> Set conversationId, để recipientId null</li>
 *   <li><strong>Bắt đầu chat mới:</strong> Set recipientId, để conversationId null</li>
 * </ul>
 *
 * <h2>Giới hạn:</h2>
 * <ul>
 *   <li>Tối đa 5 file đính kèm mỗi tin nhắn</li>
 *   <li>Phải cung cấp ít nhất conversationId hoặc recipientId</li>
 * </ul>
 *
 * @author MiniSocialNetwork Team
 * @version 1.0
 * @see com.mini.socialnetwork.modules.chat.controller.ChatSocketController#sendMessage
 */
@Data
public class SendMessageRequest {

    /**
     * ID của cuộc hội thoại để gửi tin nhắn vào.
     * <p>
     * Null nếu muốn bắt đầu cuộc hội thoại mới với recipientId.
     * Nếu set cả hai, conversationId được ưu tiên.
     * </p>
     */
    private Long conversationId;

    /**
     * ID của người nhận để bắt đầu cuộc hội thoại mới.
     * <p>
     * Server sẽ tìm hoặc tạo cuộc hội thoại 1-1 giữa sender và recipient.
     * Null nếu gửi vào conversationId đã có.
     * </p>
     */
    private String recipientId;

    /**
     * Nội dung văn bản của tin nhắn.
     * <p>
     * Có thể null hoặc rỗng nếu tin nhắn chỉ chứa file đính kèm.
     * </p>
     */
    private String content;

    /**
     * Danh sách file đính kèm đã upload trước đó.
     * <p>
     * Chứa metadata của các file đã upload qua AttachmentController.
     * Tối đa 5 file. Có thể null hoặc rỗng nếu không có đính kèm.
     * </p>
     *
     * @see AttachmentRequest
     */
    private List<AttachmentRequest> attachments;
}