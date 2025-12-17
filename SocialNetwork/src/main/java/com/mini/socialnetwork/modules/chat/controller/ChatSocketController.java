package com.mini.socialnetwork.modules.chat.controller;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Controller;

import com.mini.socialnetwork.modules.chat.dto.DeleteMessageEvent;
import com.mini.socialnetwork.modules.chat.dto.DeleteMessageRequest;
import com.mini.socialnetwork.modules.chat.dto.SendMessageRequest;
import com.mini.socialnetwork.modules.chat.entity.Conversation;
import com.mini.socialnetwork.modules.chat.entity.Message;
import com.mini.socialnetwork.modules.chat.repository.ConversationRepository;
import com.mini.socialnetwork.modules.chat.service.MessageService;

import java.util.Collections;

/**
 * WebSocket Controller xử lý tin nhắn chat real-time qua giao thức STOMP.
 * <p>
 * Controller này nhận và xử lý các message từ client qua WebSocket,
 * bao gồm gửi tin nhắn mới và xóa tin nhắn. Sử dụng SimpMessagingTemplate
 * để broadcast tin nhắn đến các participant trong cuộc hội thoại.
 * </p>
 *
 * <h2>Các endpoint STOMP:</h2>
 * <ul>
 *   <li><strong>/app/chat.sendMessage</strong>: Gửi tin nhắn mới</li>
 *   <li><strong>/app/chat.deleteMessage</strong>: Xóa tin nhắn</li>
 * </ul>
 *
 * <h2>Mô hình gửi tin:</h2>
 * <ul>
 *   <li>Tin nhắn mới: Gửi đến /user/{userId}/queue/messages cho từng participant</li>
 *   <li>Xóa tin nhắn: Broadcast đến /topic/conversation/{conversationId}</li>
 * </ul>
 *
 * @author MiniSocialNetwork Team
 * @version 1.0
 * @see com.mini.socialnetwork.config.WebSocketConfig
 */
@Controller
@RequiredArgsConstructor
@Slf4j
public class ChatSocketController {

    /** Template để gửi message đến các destination STOMP */
    private final SimpMessagingTemplate messagingTemplate;

    /** Service xử lý logic nghiệp vụ cho tin nhắn */
    private final MessageService messageService;

    /** Repository truy cập dữ liệu cuộc hội thoại */
    private final ConversationRepository conversationRepository;

    /**
     * Xử lý tin nhắn mới từ client và gửi đến tất cả participant.
     * <p>
     * Phương thức này xử lý hai trường hợp:
     * <ul>
     *   <li>Có conversationId: Thêm tin nhắn vào cuộc hội thoại đã tồn tại</li>
     *   <li>Có recipientId: Tìm hoặc tạo cuộc hội thoại 1-1 mới</li>
     * </ul>
     * Sau khi lưu tin nhắn, broadcast đến tất cả participant qua queue riêng.
     * </p>
     *
     * <h3>Flow xử lý:</h3>
     * <ol>
     *   <li>Trích xuất senderId từ JWT</li>
     *   <li>Gọi MessageService để tạo và lưu tin nhắn</li>
     *   <li>Lấy danh sách participant từ conversation</li>
     *   <li>Gửi tin nhắn đến /user/{participantId}/queue/messages cho từng người</li>
     * </ol>
     *
     * @param request yêu cầu gửi tin nhắn chứa nội dung, file đính kèm, và thông tin cuộc hội thoại
     * @param authentication đối tượng xác thực chứa JWT token của người gửi
     * @throws IllegalStateException nếu không tìm thấy cuộc hội thoại sau khi tạo tin nhắn
     * @see SendMessageRequest
     */
    @MessageMapping("/chat.sendMessage")
    public void sendMessage(@Payload SendMessageRequest request, Authentication authentication) {
        Jwt jwt = (Jwt) authentication.getPrincipal();
        String senderId = jwt.getSubject();
        log.info("User {} is sending a message to conversation {}", senderId, request.getConversationId());

        Message savedMessage = messageService.createMessage(request, senderId);

        Conversation conversation = conversationRepository.findById(savedMessage.getConversationId())
                .orElseThrow(() -> new IllegalStateException("Conversation not found after message creation"));

        conversation.getParticipantIds().forEach(participantId -> {
            messagingTemplate.convertAndSendToUser(
                participantId,
                "/queue/messages",
                savedMessage
            );
            log.info("Message {} sent to user {}", savedMessage.getId(), participantId);
        });
    }

    /**
     * Xử lý yêu cầu xóa tin nhắn và broadcast sự kiện xóa.
     * <p>
     * Thực hiện soft-delete tin nhắn (đánh dấu isDeleted = true, xóa nội dung)
     * và broadcast sự kiện xóa đến tất cả participant qua topic chung.
     * Chỉ người gửi mới có quyền xóa tin nhắn của chính mình.
     * </p>
     *
     * <h3>Flow xử lý:</h3>
     * <ol>
     *   <li>Trích xuất userId từ JWT</li>
     *   <li>Gọi MessageService để xóa tin nhắn (có kiểm tra quyền)</li>
     *   <li>Tạo DeleteMessageEvent với messageId và conversationId</li>
     *   <li>Broadcast event đến /topic/conversation/{conversationId}</li>
     * </ol>
     *
     * @param request yêu cầu xóa tin nhắn chứa messageId
     * @param authentication đối tượng xác thực chứa JWT token của người xóa
     * @throws ResponseStatusException 403 nếu user không phải người gửi tin nhắn
     * @throws ResponseStatusException 404 nếu không tìm thấy tin nhắn
     * @see DeleteMessageRequest
     * @see DeleteMessageEvent
     */
    @MessageMapping("/chat.deleteMessage")
    public void deleteMessage(@Payload DeleteMessageRequest request, Authentication authentication) {
        Jwt jwt = (Jwt) authentication.getPrincipal();
        String userId = jwt.getSubject();
        log.info("User {} is deleting message {}", userId, request.getMessageId());

        Message deletedMessage = messageService.deleteMessage(request.getMessageId(), userId);

        Long conversationId = deletedMessage.getConversationId();
        DeleteMessageEvent event = new DeleteMessageEvent(deletedMessage.getId(), conversationId);

        messagingTemplate.convertAndSend("/topic/conversation/" + conversationId, event);
        log.info("Delete event for message {} broadcasted to topic /topic/conversation/{}", event.getMessageId(), event.getConversationId());
    }
}