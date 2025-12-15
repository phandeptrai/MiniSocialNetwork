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
 * WebSocket controller for real-time chat messaging using STOMP protocol.
 * <p>
 * Handles message sending and deletion through WebSocket connections.
 * Uses Spring Security for authentication via JWT tokens and ensures
 * messages are delivered only to authorized conversation participants.
 * </p>
 */
@Controller
@RequiredArgsConstructor
@Slf4j
public class ChatSocketController {

    private final SimpMessagingTemplate messagingTemplate;
    private final MessageService messageService;
    private final ConversationRepository conversationRepository;

    /**
     * Handles incoming messages from clients and broadcasts them to conversation participants.
     * <p>
     * This endpoint processes new messages in two modes:
     * <ul>
     *   <li>If conversationId is provided, adds message to the existing conversation</li>
     *   <li>If recipientId is provided, finds or creates a one-to-one conversation</li>
     * </ul>
     * Messages are enriched with presigned URLs for file attachments before being sent
     * to participants through their private queues.
     * </p>
     *
     * @param request the message request containing content, attachments, and conversation details
     * @param authentication the authentication object containing the JWT token
     * @throws IllegalStateException if the conversation cannot be found after message creation
     * @see SendMessageRequest
     */
    @MessageMapping("/chat.sendMessage")
    public void sendMessage(@Payload SendMessageRequest request, Authentication authentication) {
        Jwt jwt = (Jwt) authentication.getPrincipal();
        String senderId = jwt.getSubject();
        log.info("User {} is sending a message to conversation {}", senderId, request.getConversationId());

        Message savedMessage = messageService.createMessage(request, senderId);

        Message enrichedMessage = messageService.enrichMessagesWithUrls(Collections.singletonList(savedMessage)).get(0);

        Conversation conversation = conversationRepository.findById(enrichedMessage.getConversationId())
                .orElseThrow(() -> new IllegalStateException("Conversation not found after message creation"));

        conversation.getParticipantIds().forEach(participantId -> {
            messagingTemplate.convertAndSendToUser(
                participantId,
                "/queue/messages",
                enrichedMessage
            );
            log.info("Message {} sent to user {}", savedMessage.getId(), participantId);
        });
    }

    /**
     * Handles message deletion requests and broadcasts the deletion event.
     * <p>
     * Performs soft-delete of the message and broadcasts a deletion event
     * to all conversation participants through a shared topic. Only the message
     * sender can delete their own messages.
     * </p>
     *
     * @param request the delete message request containing the message ID
     * @param authentication the authentication object containing the JWT token
     * @throws ResponseStatusException with HTTP 403 if user is not the message sender
     * @throws ResponseStatusException with HTTP 404 if the message is not found
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