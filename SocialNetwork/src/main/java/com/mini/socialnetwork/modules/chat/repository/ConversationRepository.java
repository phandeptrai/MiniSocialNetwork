package com.mini.socialnetwork.modules.chat.repository;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import com.mini.socialnetwork.modules.chat.entity.Conversation;
import com.mini.socialnetwork.modules.chat.entity.Conversation.ConversationType;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.Set;

// Bước 1: Thay đổi kế thừa từ MongoRepository -> JpaRepository
// và thay đổi kiểu ID từ String -> Long
public interface ConversationRepository extends JpaRepository<Conversation, Long> {

    /**
     * Lấy trang đầu tiên các cuộc hội thoại của một user.
     * Spring Data JPA có thể tự tạo query này từ tên phương thức.
     * `Containing` sẽ được dịch thành một subquery hoặc JOIN để kiểm tra trong bảng conversation_participants.
     */
    List<Conversation> findByParticipantIdsContainingOrderByUpdatedAtDescIdDesc(String userId, Pageable pageable);

    /**
     * Lấy các cuộc hội thoại cũ hơn dựa trên cursor kết hợp (updatedAt, id).
     * Query này phải được viết bằng JPQL vì sự phức tạp của nó.
     * :userId MEMBER OF c.participantIds -> Kiểm tra xem user có trong danh sách participant không.
     * (c.updatedAt < :cursorUpdatedAt OR (c.updatedAt = :cursorUpdatedAt AND c.id < :cursorId)) -> Logic của cursor-based pagination.
     */
    @Query("SELECT c FROM Conversation c WHERE :userId MEMBER OF c.participantIds " +
           "AND (c.updatedAt < :cursorUpdatedAt OR (c.updatedAt = :cursorUpdatedAt AND c.id < :cursorId)) " +
           "ORDER BY c.updatedAt DESC, c.id DESC")
    List<Conversation> findByParticipantIdsWithCursor(
            @Param("userId") String userId,
            @Param("cursorUpdatedAt") Instant cursorUpdatedAt,
            @Param("cursorId") Long cursorId, // ID bây giờ là Long
            Pageable pageable
    );

    /**
     * Tìm một cuộc hội thoại dựa trên loại và một tập hợp chính xác những người tham gia.
     * Query này đảm bảo cuộc hội thoại tìm được có số lượng thành viên và danh sách thành viên
     * khớp chính xác với những gì được cung cấp.
     */
    @Query("SELECT c FROM Conversation c JOIN c.participantIds p " +
           "WHERE c.type = :type " +
           "AND p IN :participantIds " +
           "AND size(c.participantIds) = :participantCount " +
           "GROUP BY c " +
           "HAVING COUNT(p) = :participantCount")
    Optional<Conversation> findByTypeAndExactParticipants(
            @Param("type") ConversationType type,
            @Param("participantIds") Set<String> participantIds,
            @Param("participantCount") int participantCount
    );
}