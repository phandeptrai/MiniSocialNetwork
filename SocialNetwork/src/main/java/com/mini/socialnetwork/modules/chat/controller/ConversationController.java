package com.mini.socialnetwork.modules.chat.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
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
import com.mini.socialnetwork.modules.chat.service.ConversationService;

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
    /** Service xử lý conversation */
    private final ConversationService conversationService;

    /** Repository tin nhắn (dùng cho message pagination) */
    private final MessageRepository messageRepository;

    /** Repository conversation (dùng cho permission check) */
    private final ConversationRepository conversationRepository;

    /**
     * Lấy toàn bộ danh sách cuộc hội thoại của người dùng hiện tại.
     * <p>
     * Trả về toàn bộ conversations mà user là participant, đã được map sang DTO.
     * Ordering: `updatedAt` DESC, `id` DESC.
     * </p>
     *
     * @param jwt JWT token của người dùng đang đăng nhập
     * @return danh sách ConversationDTO
     */
    @GetMapping
    public ResponseEntity<List<com.mini.socialnetwork.modules.chat.dto.ConversationDTO>> getUserConversations(@AuthenticationPrincipal Jwt jwt) {
        String currentUserId = jwt.getSubject();
        List<com.mini.socialnetwork.modules.chat.dto.ConversationDTO> conversations = conversationService.getConversationsForUser(currentUserId);
        return ResponseEntity.ok(conversations);
    }

    /**
     * Lấy chi tiết một conversation (DTO) theo ID nếu user là participant.
     */
    @GetMapping("/{conversationId}")
    public ResponseEntity<com.mini.socialnetwork.modules.chat.dto.ConversationDTO> getConversationById(
            @PathVariable Long conversationId,
            @AuthenticationPrincipal Jwt jwt) {
        String currentUserId = jwt.getSubject();
        com.mini.socialnetwork.modules.chat.dto.ConversationDTO dto = conversationService.getConversationByIdForUser(conversationId, currentUserId);
        if (dto == null) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Access Denied");
        }
        return ResponseEntity.ok(dto);
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
