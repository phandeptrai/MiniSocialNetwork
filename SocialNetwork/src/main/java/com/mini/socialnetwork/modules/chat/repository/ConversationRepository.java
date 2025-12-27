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
 * Định nghĩa thêm các query tùy chỉnh cho tìm kiếm cuộc hội thoại theo participant.
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
         * Lấy tất cả cuộc hội thoại của một user, không phân trang.
         * <p>
         * Trả về toàn bộ conversations mà user tham gia, sắp xếp theo
         * `updatedAt` giảm dần và `id` giảm dần để đảm bảo thứ tự nhất quán.
         * </p>
         *
         * @param userId ID của user cần lấy danh sách conversation
         * @return danh sách conversation sắp xếp theo updatedAt DESC, id DESC
         */
        @Query("""
                            SELECT c FROM Conversation c
                            WHERE :userId MEMBER OF c.participantIds
                            AND c.updatedAt <= CURRENT_TIMESTAMP
                            ORDER BY c.updatedAt DESC, c.id DESC
                        """)
        List<Conversation> findAllByParticipantIdsOrderByUpdatedAtDescIdDesc(@Param("userId") String userId);

        

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
         * <li>Lọc theo type (ONE_TO_ONE hoặc GROUP)</li>
         * <li>JOIN với participantIds và kiểm tra có trong tập truyền vào</li>
         * <li>Kiểm tra size của participantIds bằng với số lượng mong muốn</li>
         * <li>GROUP BY và HAVING COUNT để đảm bảo khớp tất cả participant</li>
         * </ol>
         *
         * @param type             loại cuộc hội thoại (ONE_TO_ONE hoặc GROUP)
         * @param participantIds   tập hợp ID của các participant
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
                        @Param("participantCount") int participantCount);
}
