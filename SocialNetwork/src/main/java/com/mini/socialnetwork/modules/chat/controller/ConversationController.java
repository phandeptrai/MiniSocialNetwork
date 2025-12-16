package com.mini.socialnetwork.modules.chat.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import com.mini.socialnetwork.modules.chat.entity.Conversation;
import com.mini.socialnetwork.modules.chat.entity.Message;
import com.mini.socialnetwork.modules.chat.repository.ConversationRepository;
import com.mini.socialnetwork.modules.chat.repository.MessageRepository;
import com.mini.socialnetwork.modules.chat.service.MessageService;

import java.time.Instant;
import java.util.List;

/**
 * REST Controller quản lý cuộc hội thoại và tin nhắn.
 * <p>
 * Controller này cung cấp các endpoint REST để:
 * <ul>
 *   <li>Lấy danh sách cuộc hội thoại của người dùng</li>
 *   <li>Lấy lịch sử tin nhắn trong một cuộc hội thoại</li>
 * </ul>
 * Sử dụng cursor-based pagination để tối ưu hiệu suất và hỗ trợ infinite scroll.
 * </p>
 *
 * <h2>Phân quyền:</h2>
 * <p>
 * Tất cả endpoint yêu cầu JWT token hợp lệ. Người dùng chỉ có thể truy cập
 * các cuộc hội thoại mà họ là participant.
 * </p>
 *
 * @author MiniSocialNetwork Team
 * @version 1.0
 */
@RestController
@RequestMapping("/api/conversations")
@RequiredArgsConstructor
public class ConversationController {

    /** Repository truy cập dữ liệu tin nhắn */
    private final MessageRepository messageRepository;

    /** Repository truy cập dữ liệu cuộc hội thoại */
    private final ConversationRepository conversationRepository;

    /**
     * Lấy danh sách cuộc hội thoại của người dùng hiện tại với cursor-based pagination.
     * <p>
     * Cuộc hội thoại được sắp xếp theo thời gian cập nhật (mới nhất trước),
     * sau đó theo ID để đảm bảo tính nhất quán khi có cùng updatedAt.
     * </p>
     *
     * <h3>Cursor-based Pagination:</h3>
     * <p>
     * Thay vì offset-based (page number), sử dụng cursor với cặp (updatedAt, id)
     * để đảm bảo không bỏ sót hoặc lặp dữ liệu khi có thay đổi realtime.
     * </p>
     *
     * <h3>Cách sử dụng:</h3>
     * <ul>
     *   <li>Lần đầu: Không truyền cursor</li>
     *   <li>Các lần sau: Truyền updatedAt và id của item cuối cùng từ lần trước</li>
     * </ul>
     *
     * @param cursorUpdatedAt timestamp cursor cho pagination (tùy chọn, ISO format)
     * @param cursorId ID cursor cho pagination (tùy chọn)
     * @param size số lượng cuộc hội thoại cần lấy (mặc định: 15)
     * @param jwt JWT token của người dùng đang đăng nhập
     * @return danh sách cuộc hội thoại của người dùng
     */
    @GetMapping
    public ResponseEntity<List<Conversation>> getUserConversations(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant cursorUpdatedAt,
            @RequestParam(required = false) Long cursorId,
            @RequestParam(defaultValue = "15") int size,
            @AuthenticationPrincipal Jwt jwt) {

        String currentUserId = jwt.getSubject();
        PageRequest pageable = PageRequest.of(0, size,
                Sort.by("updatedAt").descending().and(Sort.by("id").descending()));
        List<Conversation> conversations;

        if (cursorUpdatedAt == null || cursorId == null) {
            conversations = conversationRepository
                    .findByParticipantIdsContainingOrderByUpdatedAtDescIdDesc(currentUserId, pageable);
        } else {
            conversations = conversationRepository.findByParticipantIdsWithCursor(currentUserId, cursorUpdatedAt,
                    cursorId, pageable);
        }
        return ResponseEntity.ok(conversations);
    }

    /**
     * Lấy danh sách tin nhắn trong một cuộc hội thoại với cursor-based pagination.
     * <p>
     * Kiểm tra quyền truy cập bằng cách xác minh người dùng hiện tại là participant
     * của cuộc hội thoại. Tin nhắn được sắp xếp theo ID giảm dần (mới nhất trước).
     * </p>
     *
     * <h3>Cursor-based Pagination:</h3>
     * <p>
     * Sử dụng message ID làm cursor. Truyền ID của tin nhắn cuối cùng
     * để lấy các tin nhắn cũ hơn (infinite scroll từ dưới lên).
     * </p>
     *
     * <h3>Phân quyền:</h3>
     * <p>
     * Trả về 403 Forbidden nếu người dùng không phải participant của cuộc hội thoại.
     * </p>
     *
     * @param conversationId ID của cuộc hội thoại
     * @param cursor ID tin nhắn cursor cho pagination (tùy chọn)
     * @param size số lượng tin nhắn cần lấy (mặc định: 20)
     * @param jwt JWT token của người dùng đang đăng nhập
     * @return danh sách tin nhắn trong cuộc hội thoại
     * @throws ResponseStatusException 403 nếu người dùng không phải participant
     */
    @GetMapping("/{conversationId}/messages")
    public ResponseEntity<List<Message>> getMessages(
            @PathVariable Long conversationId,
            @RequestParam(required = false) Long cursor,
            @RequestParam(defaultValue = "20") int size,
            @AuthenticationPrincipal Jwt jwt) {

        String currentUserId = jwt.getSubject();

        conversationRepository.findById(conversationId)
                .filter(conv -> conv.getParticipantIds().contains(currentUserId))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.FORBIDDEN, "Access Denied"));

        PageRequest pageable = PageRequest.of(0, size);
        List<Message> messages;

        if (cursor == null) {
            messages = messageRepository.findByConversationIdOrderByIdDesc(conversationId, pageable);
        } else {
            messages = messageRepository.findByConversationIdAndIdLessThanOrderByIdDesc(conversationId, cursor,
                    pageable);
        }
        return ResponseEntity.ok(messages);
    }
}