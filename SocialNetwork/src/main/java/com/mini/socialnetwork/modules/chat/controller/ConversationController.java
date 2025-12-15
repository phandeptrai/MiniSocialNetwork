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

import java.time.Instant;
import java.util.List;

/**
 * REST controller for managing conversations and messages.
 * <p>
 * Provides endpoints for retrieving user conversations and messages within conversations.
 * Supports cursor-based pagination for efficient data retrieval and enforces access control
 * to ensure users can only access their own conversations.
 * </p>
 */
@RestController
@RequestMapping("/api/conversations")
@RequiredArgsConstructor
public class ConversationController {

    private final MessageRepository messageRepository;
    private final ConversationRepository conversationRepository;

    /**
     * Retrieves all conversations for the authenticated user with cursor-based pagination.
     * <p>
     * Conversations are sorted by updated date in descending order, followed by ID for consistency.
     * Supports cursor-based pagination using the updatedAt timestamp and conversation ID.
     * </p>
     *
     * @param cursorUpdatedAt the timestamp cursor for pagination (optional)
     * @param cursorId the conversation ID cursor for pagination (optional)
     * @param size the number of conversations to retrieve (default: 15)
     * @param jwt the JWT token of the authenticated user
     * @return a list of conversations for the user
     */
    @GetMapping
    public ResponseEntity<List<Conversation>> getUserConversations(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant cursorUpdatedAt,
            @RequestParam(required = false) Long cursorId,
            @RequestParam(defaultValue = "15") int size,
            @AuthenticationPrincipal Jwt jwt) {

        String currentUserId = jwt.getSubject();
        PageRequest pageable = PageRequest.of(0, size, Sort.by("updatedAt").descending().and(Sort.by("id").descending()));
        List<Conversation> conversations;

        if (cursorUpdatedAt == null || cursorId == null) {
            conversations = conversationRepository.findByParticipantIdsContainingOrderByUpdatedAtDescIdDesc(currentUserId, pageable);
        } else {
            conversations = conversationRepository.findByParticipantIdsWithCursor(currentUserId, cursorUpdatedAt, cursorId, pageable);
        }
        return ResponseEntity.ok(conversations);
    }

    /**
     * Retrieves messages for a specific conversation with cursor-based pagination.
     * <p>
     * Enforces access control by verifying that the authenticated user is a participant
     * in the conversation. Messages are sorted by ID in descending order (newest first).
     * </p>
     *
     * @param conversationId the ID of the conversation
     * @param cursor the message ID cursor for pagination (optional)
     * @param size the number of messages to retrieve (default: 20)
     * @param jwt the JWT token of the authenticated user
     * @return a list of messages in the conversation
     * @throws ResponseStatusException with HTTP 403 if the user is not a participant in the conversation
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
            messages = messageRepository.findByConversationIdAndIdLessThanOrderByIdDesc(conversationId, cursor, pageable);
        }

        return ResponseEntity.ok(messages);
    }
}