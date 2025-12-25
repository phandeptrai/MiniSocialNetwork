package com.mini.socialnetwork.modules.chat.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import com.fasterxml.jackson.annotation.JsonBackReference;
import com.fasterxml.jackson.annotation.JsonManagedReference;
import com.fasterxml.jackson.annotation.JsonProperty;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

/**
 * Entity đại diện cho một tin nhắn trong cuộc hội thoại.
 * <p>
 * Tin nhắn có thể chứa nội dung văn bản, file đính kèm, hoặc cả hai.
 * Hỗ trợ soft-delete để giữ lại record nhưng ẩn nội dung.
 * </p>
 *
 * <h2>Quan hệ:</h2>
 * <ul>
 * <li>Conversation: Many-to-One qua conversationId (không dùng FK entity để tối
 * ưu)</li>
 * <li>Attachment: One-to-Many với cascade ALL và orphanRemoval</li>
 * </ul>
 *
 * <h2>Serialization:</h2>
 * <p>
 * Sử dụng @JsonManagedReference/@JsonBackReference để tránh infinite loop
 * khi serialize Message - Attachment relationship.
 * </p>
 *
 * @author MiniSocialNetwork Team
 * @version 1.0
 */
@Data
@Builder
@Entity
@Table(name = "messages")
@EntityListeners(AuditingEntityListener.class)
@NoArgsConstructor
@AllArgsConstructor
public class Message {

    /**
     * ID duy nhất của tin nhắn, auto-generated.
     */
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * ID của cuộc hội thoại chứa tin nhắn này.
     * <p>
     * Sử dụng ID thay vì entity reference để tối ưu query.
     * </p>
     */
    private Long conversationId;

    /**
     * ID của người gửi tin nhắn (từ Keycloak).
     */
    private String senderId;

    /**
     * Nội dung văn bản của tin nhắn.
     * <p>
     * Lưu dạng TEXT để hỗ trợ tin nhắn dài.
     * Có thể null nếu tin nhắn chỉ chứa file đính kèm.
     * Khi xóa, content được thay bằng "This message has been deleted."
     * </p>
     */
    @Column(columnDefinition = "TEXT")
    private String content;

    /**
     * Loại tin nhắn: TEXT, IMAGE, FILE, hoặc ATTACHMENT.
     * <p>
     * Client sử dụng để hiển thị UI phù hợp.
     * </p>
     */
    @Enumerated(EnumType.STRING)
    private Message.MessageType messageType;

    /**
     * Danh sách file đính kèm của tin nhắn.
     * <p>
     * Cascade ALL: Attachment được tạo/xóa cùng Message.
     * OrphanRemoval: Attachment bị xóa khỏi DB khi remove khỏi list.
     * </p>
     */
    @JsonManagedReference
    @Builder.Default
    @OneToMany(cascade = CascadeType.ALL, mappedBy = "message", orphanRemoval = true)
    private List<Attachment> attachments = new ArrayList<>();

    /**
     * Cờ đánh dấu tin nhắn đã bị xóa (soft-delete).
     * <p>
     * Khi true, nội dung được ẩn và hiển thị "Tin nhắn đã bị xóa".
     * Record vẫn được giữ để duy trì tính toàn vẹn dữ liệu.
     * </p>
     */
    @JsonProperty("isDeleted")
    @Builder.Default
    private boolean isDeleted = false;

    /**
     * Thời điểm tạo tin nhắn.
     * <p>
     * Không thể cập nhật. Dùng để sắp xếp và hiển thị thời gian.
     * </p>
     */
    @CreatedDate
    @Column(nullable = false, updatable = false)
    private Instant createdAt;

    /**
     * Enum định nghĩa các loại tin nhắn.
     */
    public enum MessageType {
        /** Tin nhắn văn bản thuần */
        TEXT,
        /** Tin nhắn chứa hình ảnh */
        IMAGE,
        /** Tin nhắn chứa file (không phải ảnh) */
        FILE,
        /** Tin nhắn có file đính kèm (chung) */
        ATTACHMENT
    }

    /**
     * Entity đại diện cho file đính kèm của tin nhắn.
     * <p>
     * Lưu trữ metadata và URL công khai của file trên MinIO.
     * Mỗi attachment thuộc về một message duy nhất.
     * </p>
     *
     * <h2>Lưu trữ:</h2>
     * <p>
     * File thực sự được lưu trên MinIO, entity này chỉ lưu metadata
     * và objectKey để truy cập.
     * </p>
     *
     * @author MiniSocialNetwork Team
     * @version 1.0
     */
    @Data
    @Builder
    @Entity
    @Table(name = "attachments")
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Attachment {

        /**
         * ID duy nhất của attachment, auto-generated.
         */
        @Id
        @GeneratedValue(strategy = GenerationType.IDENTITY)
        private Long id;

        /**
         * Tên file gốc do người dùng upload.
         */
        private String fileName;

        /**
         * Key của object trong MinIO bucket.
         * <p>
         * Định dạng: conversations/{conversationId}/{uuid}_{filename}
         * </p>
         */
        private String objectKey;

        /**
         * MIME type của file.
         * <p>
         * Ví dụ: image/jpeg, application/pdf
         * </p>
         */
        private String fileType;

        /**
         * Kích thước file tính bằng bytes.
         */
        private long fileSize;

        /**
         * URL công khai để truy cập file.
         * <p>
         * URL cố định, không hết hạn vì bucket có policy public read.
         * Client sử dụng URL này để hiển thị/tải file.
         * </p>
         */
        @Column(columnDefinition = "TEXT")
        private String fileUrl;

        /**
         * Reference đến tin nhắn chứa attachment này.
         * <p>
         * LAZY fetch để tối ưu performance. Sử dụng @JsonBackReference
         * để tránh infinite loop khi serialize.
         * </p>
         */
        @JsonBackReference
        @ManyToOne(fetch = FetchType.LAZY)
        @JoinColumn(name = "message_id")
        private Message message;
    }
}
