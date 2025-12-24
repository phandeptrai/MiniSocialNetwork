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

/**
 * Repository truy cập dữ liệu cuộc hội thoại.
 * <p>
 * Kế thừa JpaRepository để có các method CRUD cơ bản.
 * Định nghĩa thêm các query tùy chỉnh cho cursor-based pagination
 * và tìm kiếm cuộc hội thoại theo participant.
 * </p>
 *
 * <h2>Cursor-based Pagination:</h2>
 * <p>
 * Sử dụng cursor (updatedAt, id) thay vì offset để đảm bảo tính nhất quán
 * khi dữ liệu thay đổi realtime. Tránh vấn đề skip/duplicate khi có item mới.
 * </p>
 *
 * @author MiniSocialNetwork Team
 * @version 1.0
 */
public interface ConversationRepository extends JpaRepository<Conversation, Long> {

    /**
     * Lấy danh sách cuộc hội thoại của một user, sắp xếp theo thời gian mới nhất.
     * <p>
     * Dùng cho lần tải đầu tiên khi chưa có cursor.
     * Spring Data JPA tự động tạo query từ tên method.
     * "Containing" được dịch thành subquery kiểm tra trong bảng conversation_participants.
     * </p>
     *
     * @param userId ID của user cần lấy danh sách conversation
     * @param pageable thông tin phân trang (size, sort)
     * @return danh sách conversation sắp xếp theo updatedAt giảm dần, sau đó theo id giảm dần
     */
    List<Conversation> findByParticipantIdsContainingOrderByUpdatedAtDescIdDesc(String userId, Pageable pageable);

    /**
     * Lấy các cuộc hội thoại cũ hơn dựa trên cursor kết hợp (updatedAt, id).
     * <p>
     * Query JPQL tùy chỉnh để thực hiện cursor-based pagination.
     * Điều kiện: (updatedAt < cursor) OR (updatedAt = cursor AND id < cursorId)
     * đảm bảo lấy đúng các item tiếp theo mà không bỏ sót.
     * </p>
     *
     * <h3>Giải thích điều kiện:</h3>
     * <ul>
     *   <li>:userId MEMBER OF c.participantIds - Kiểm tra user có trong danh sách participant</li>
     *   <li>updatedAt < cursorUpdatedAt - Lấy các conversation cập nhật sớm hơn cursor</li>
     *   <li>updatedAt = cursorUpdatedAt AND id < cursorId - Xử lý trường hợp cùng updatedAt</li>
     * </ul>
     *
     * @param userId ID của user
     * @param cursorUpdatedAt timestamp của conversation cuối cùng từ lần trước
     * @param cursorId ID của conversation cuối cùng từ lần trước
     * @param pageable thông tin phân trang
     * @return danh sách conversation cũ hơn cursor
     */
    @Query("SELECT c FROM Conversation c WHERE :userId MEMBER OF c.participantIds " +
           "AND (c.updatedAt < :cursorUpdatedAt OR (c.updatedAt = :cursorUpdatedAt AND c.id < :cursorId)) " +
           "ORDER BY c.updatedAt DESC, c.id DESC")
    List<Conversation> findByParticipantIdsWithCursor(
            @Param("userId") String userId,
            @Param("cursorUpdatedAt") Instant cursorUpdatedAt,
            @Param("cursorId") Long cursorId,
            Pageable pageable
    );

    /**
     * Tìm cuộc hội thoại theo loại và tập hợp chính xác người tham gia.
     * <p>
     * Dùng để tìm cuộc hội thoại ONE_TO_ONE đã tồn tại giữa hai user
     * trước khi tạo mới. Query đảm bảo số lượng và danh sách participant
     * khớp chính xác với tham số truyền vào.
     * </p>
     *
     * <h3>Logic query:</h3>
     * <ol>
     *   <li>Lọc theo type (ONE_TO_ONE hoặc GROUP)</li>
     *   <li>JOIN với participantIds và kiểm tra có trong tập truyền vào</li>
     *   <li>Kiểm tra size của participantIds bằng với số lượng mong muốn</li>
     *   <li>GROUP BY và HAVING COUNT để đảm bảo khớp tất cả participant</li>
     * </ol>
     *
     * @param type loại cuộc hội thoại (ONE_TO_ONE hoặc GROUP)
     * @param participantIds tập hợp ID của các participant
     * @param participantCount số lượng participant mong muốn
     * @return Optional chứa conversation nếu tìm thấy, empty nếu không
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