package com.mini.socialnetwork.modules.chat.dto;

import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO đại diện cho thông tin file đính kèm trong yêu cầu gửi tin nhắn.
 * <p>
 * Lớp này chứa metadata của file đã được upload lên MinIO trước đó.
 * Client gửi DTO này như một phần của SendMessageRequest để đính kèm
 * file vào tin nhắn.
 * </p>
 *
 * <h2>Quy trình sử dụng:</h2>
 * <ol>
 *   <li>Client upload file qua AttachmentController, nhận về objectKey</li>
 *   <li>Client tạo AttachmentRequest với objectKey và metadata</li>
 *   <li>Client gửi SendMessageRequest chứa danh sách AttachmentRequest</li>
 *   <li>Server tạo entity Attachment từ DTO và liên kết với Message</li>
 * </ol>
 *
 * @author MiniSocialNetwork Team
 * @version 1.0
 * @see SendMessageRequest
 * @see com.mini.socialnetwork.modules.chat.entity.Message.Attachment
 */
@Data
@NoArgsConstructor
public class AttachmentRequest {

    /**
     * Key của object trong MinIO bucket.
     * <p>
     * Định dạng: conversations/{conversationId}/{uuid}_{filename}
     * Được trả về từ API upload attachment.
     * </p>
     */
    private String objectKey;

    /**
     * Tên file gốc do người dùng upload.
     * <p>
     * Hiển thị cho người nhận khi xem tin nhắn.
     * </p>
     */
    private String fileName;

    /**
     * MIME type của file.
     * <p>
     * Ví dụ: image/jpeg, application/pdf, video/mp4
     * Dùng để xác định cách hiển thị file trên client.
     * </p>
     */
    private String fileType;

    /**
     * Kích thước file tính bằng bytes.
     * <p>
     * Hiển thị cho người dùng và dùng để validate giới hạn.
     * </p>
     */
    private long fileSize;
}
