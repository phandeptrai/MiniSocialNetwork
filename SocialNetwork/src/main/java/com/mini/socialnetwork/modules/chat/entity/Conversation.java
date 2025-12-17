package com.mini.socialnetwork.modules.chat.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;
import java.time.Instant;
import java.util.Set;

/**
 * Entity đại diện cho một cuộc hội thoại (chat room).
 * <p>
 * Cuộc hội thoại là nơi chứa các tin nhắn giữa hai hoặc nhiều người dùng.
 * Hỗ trợ hai loại: ONE_TO_ONE (chat 1-1) và GROUP (chat nhóm).
 * </p>
 *
 * <h2>Denormalization:</h2>
 * <p>
 * Các trường lastMessageContent, lastMessageSenderId, lastMessageType được lưu trực tiếp
 * trong Conversation để tối ưu hiệu suất khi hiển thị danh sách cuộc hội thoại
 * mà không cần JOIN với bảng messages.
 * </p>
 *
 * <h2>Quan hệ:</h2>
 * <ul>
 *   <li>participantIds: Many-to-Many với User (lưu qua bảng conversation_participants)</li>
 *   <li>Message: One-to-Many (message có conversationId reference đến conversation)</li>
 * </ul>
 *
 * @author MiniSocialNetwork Team
 * @version 1.0
 */
@Data
@Entity
@Builder
@Table(name = "conversations")
@EntityListeners(AuditingEntityListener.class)
@NoArgsConstructor
@AllArgsConstructor
public class Conversation {

    /**
     * ID duy nhất của cuộc hội thoại, auto-generated.
     */
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id; 

    /**
     * Tên cuộc hội thoại.
     * <p>
     * Chỉ dùng cho GROUP conversation. Với ONE_TO_ONE, client tự hiển thị
     * tên người còn lại dựa trên participantIds.
     * </p>
     */
    private String name;

    /**
     * Tập hợp ID của các thành viên tham gia cuộc hội thoại.
     * <p>
     * Lưu trong bảng riêng conversation_participants với EAGER fetch
     * để luôn có sẵn khi load conversation.
     * </p>
     */
    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "conversation_participants", joinColumns = @JoinColumn(name = "conversation_id"))
    @Column(name = "user_id")
    private Set<String> participantIds;

    /**
     * Loại cuộc hội thoại: ONE_TO_ONE hoặc GROUP.
     */
    @Enumerated(EnumType.STRING)
    private ConversationType type;

    /**
     * ID của người tạo cuộc hội thoại.
     * <p>
     * Người này có thể có quyền đặc biệt như đổi tên nhóm, thêm/xóa thành viên.
     * </p>
     */
    private String createdBy;

    /**
     * Thời điểm cập nhật cuối cùng (khi có tin nhắn mới).
     * <p>
     * Dùng để sắp xếp danh sách cuộc hội thoại theo thời gian hoạt động.
     * Tự động cập nhật bởi JPA Auditing.
     * </p>
     */
    @LastModifiedDate
    private Instant updatedAt;

    /**
     * Thời điểm tạo cuộc hội thoại.
     * <p>
     * Không thể cập nhật sau khi tạo. Tự động set bởi JPA Auditing.
     * </p>
     */
    @CreatedDate
    @Column(nullable = false, updatable = false)
    private Instant createdAt;

    /**
     * Nội dung tin nhắn cuối cùng (denormalized).
     * <p>
     * Hiển thị preview trong danh sách cuộc hội thoại.
     * Cập nhật mỗi khi có tin nhắn mới.
     * </p>
     */
    private String lastMessageContent;

    /**
     * ID người gửi tin nhắn cuối cùng (denormalized).
     * <p>
     * Dùng để hiển thị "Bạn: ..." hoặc "{Tên}: ..." trong preview.
     * </p>
     */
    private String lastMessageSenderId;
    
    /**
     * Loại tin nhắn cuối cùng (denormalized).
     * <p>
     * Dùng để hiển thị icon phù hợp (text, image, file) trong preview.
     * </p>
     */
    @Enumerated(EnumType.STRING)
    private Message.MessageType lastMessageType;

    /**
     * Enum định nghĩa các loại cuộc hội thoại.
     */
    public enum ConversationType {
        /** Cuộc hội thoại 1-1 giữa hai người */
        ONE_TO_ONE, 
        /** Cuộc hội thoại nhóm nhiều người */
        GROUP
    }
}


