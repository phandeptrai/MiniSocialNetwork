package com.mini.socialnetwork.modules.chat.controller;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Controller;

import com.mini.socialnetwork.modules.notification.entity.Notification;
import com.mini.socialnetwork.modules.chat.dto.DeleteMessageEvent;
import com.mini.socialnetwork.modules.chat.dto.DeleteMessageRequest;
import com.mini.socialnetwork.modules.chat.dto.SendMessageRequest;
import com.mini.socialnetwork.modules.chat.entity.Conversation;
import com.mini.socialnetwork.modules.chat.entity.Message;
import com.mini.socialnetwork.modules.chat.repository.ConversationRepository;
import com.mini.socialnetwork.modules.chat.service.MessageService;
import com.mini.socialnetwork.modules.notification.service.NotificationService;

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
 * <li><strong>/app/chat.sendMessage</strong>: Gửi tin nhắn mới</li>
 * <li><strong>/app/chat.deleteMessage</strong>: Xóa tin nhắn</li>
 * </ul>
 *
 * <h2>Mô hình gửi tin:</h2>
 * <ul>
 * <li>Tin nhắn mới: Gửi đến /user/{userId}/queue/messages cho từng
 * participant</li>
 * <li>Notification: Gửi đến /user/{userId}/queue/notifications cho người
 * nhận</li>
 * <li>Xóa tin nhắn: Broadcast đến /topic/conversation/{conversationId}</li>
 * </ul>
 *
 * @author MiniSocialNetwork Team
 * @version 1.1
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

    /** Service xử lý notification */
    private final NotificationService notificationService;

    /**
     * Xử lý tin nhắn mới từ client và gửi đến tất cả participant.
     * <p>
     * Phương thức này xử lý hai trường hợp:
     * <ul>
     * <li>Có conversationId: Thêm tin nhắn vào cuộc hội thoại đã tồn tại</li>
     * <li>Có recipientId: Tìm hoặc tạo cuộc hội thoại 1-1 mới</li>
     * </ul>
     * Sau khi lưu tin nhắn, broadcast đến tất cả participant qua queue riêng.
     * Đồng thời tạo notification và gửi đến người nhận (không gửi cho sender).
     * </p>
     *
     * @param request        yêu cầu gửi tin nhắn chứa nội dung, file đính kèm, và
     *                       thông tin cuộc hội thoại
     * @param authentication đối tượng xác thực chứa JWT token của người gửi
     * @throws IllegalStateException nếu không tìm thấy cuộc hội thoại sau khi tạo
     *                               tin nhắn
     * @see SendMessageRequest
     */
    @MessageMapping("/chat.sendMessage")
    public void sendMessage(@Payload SendMessageRequest request, Authentication authentication) {
        Jwt jwt = (Jwt) authentication.getPrincipal();
        String senderId = jwt.getSubject();
        String senderName = jwt.getClaimAsString("name");
        String senderAvatar = jwt.getClaimAsString("picture");

        // Fallback nếu không có name trong token
        if (senderName == null || senderName.isEmpty()) {
            senderName = jwt.getClaimAsString("preferred_username");
        }
        if (senderName == null) {
            senderName = "User";
        }

        // Default avatar nếu không có
        if (senderAvatar == null || senderAvatar.isEmpty()) {
            senderAvatar = "https://ui-avatars.com/api/?name=" + senderName.replace(" ", "+");
        }

        log.info("User {} ({}) is sending a message to conversation {}", senderId, senderName,
                request.getConversationId());

        Message savedMessage = messageService.createMessage(request, senderId);

        Conversation conversation = conversationRepository.findById(savedMessage.getConversationId())
                .orElseThrow(() -> new IllegalStateException("Conversation not found after message creation"));

        final String finalSenderName = senderName;
        final String finalSenderAvatar = senderAvatar;

        conversation.getParticipantIds().forEach(participantId -> {
            // Gửi tin nhắn cho tất cả participants
            messagingTemplate.convertAndSendToUser(
                    participantId,
                    "/queue/messages",
                    savedMessage);
            log.info("Message {} sent to user {}", savedMessage.getId(), participantId);

            // Tạo và gửi notification cho người nhận (không phải sender)
            if (!participantId.equals(senderId)) {
                try {
                    Notification notification = notificationService.createMessageNotification(
                            senderId,
                            participantId,
                            finalSenderName,
                            finalSenderAvatar,
                            savedMessage.getConversationId().toString(),
                            savedMessage.getContent());

                    // Gửi notification qua WebSocket
                    messagingTemplate.convertAndSendToUser(
                            participantId,
                            "/queue/notifications",
                            notification);
                    log.info("Notification sent to user {}", participantId);
                } catch (Exception e) {
                    log.error("Failed to create/send notification to user {}: {}", participantId, e.getMessage());
                }
            }
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
     * <li>Trích xuất userId từ JWT</li>
     * <li>Gọi MessageService để xóa tin nhắn (có kiểm tra quyền)</li>
     * <li>Tạo DeleteMessageEvent với messageId và conversationId</li>
     * <li>Broadcast event đến /topic/conversation/{conversationId}</li>
     * </ol>
     *
     * @param request        yêu cầu xóa tin nhắn chứa messageId
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
        log.info("Delete event for message {} broadcasted to topic /topic/conversation/{}", event.getMessageId(),
                event.getConversationId());
    }
}
