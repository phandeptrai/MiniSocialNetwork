package com.mini.socialnetwork.modules.chat.service;

import lombok.RequiredArgsConstructor;

import java.util.List;
import java.util.Set;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.mini.socialnetwork.infras.StorageService;
import com.mini.socialnetwork.modules.chat.dto.SendMessageRequest;
import com.mini.socialnetwork.modules.chat.entity.Conversation;
import com.mini.socialnetwork.modules.chat.entity.Conversation.ConversationType;
import com.mini.socialnetwork.modules.chat.entity.Message;
import com.mini.socialnetwork.modules.chat.repository.ConversationRepository;
import com.mini.socialnetwork.modules.chat.repository.MessageRepository;

/**
 * Service for managing message operations in conversations.
 * <p>
 * Handles creation, deletion, and management of messages. Supports both
 * existing conversations and dynamic conversation creation for new direct messages.
 * Enforces attachment limits and ensures proper access control.
 * </p>
 */
@Service
@RequiredArgsConstructor
public class MessageService {
    private final MessageRepository messageRepository;
    private final ConversationRepository conversationRepository;
    private final StorageService storageService;

    /**
     * Creates a new message in a conversation.
     * <p>
     * If a conversationId is provided, the message is added to that conversation.
     * If only a recipientId is provided, the service finds or creates a one-to-one
     * conversation with the recipient. Updates the conversation's last message metadata
     * for denormalization purposes.
     * </p>
     *
     * @param request the message request containing content, attachments, and conversation/recipient info
     * @param senderId the ID of the user sending the message
     * @return the created message
     * @throws ResponseStatusException with HTTP 400 if more than 5 attachments are provided
     * @throws ResponseStatusException with HTTP 400 if neither conversationId nor recipientId is provided
     * @throws ResponseStatusException with HTTP 403 if the sender is not a participant in the specified conversation
     */
    @Transactional
    public Message createMessage(SendMessageRequest request, String senderId) {
        if (request.getAttachments() != null && request.getAttachments().size() > 5) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Cannot send more than 5 attachments.");
        }

        Conversation conversation;
        if (request.getConversationId() != null) {
            conversation = conversationRepository.findById(request.getConversationId())
                .filter(c -> c.getParticipantIds().contains(senderId))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.FORBIDDEN, "Access Denied"));
        } else if (request.getRecipientId() != null) {
            conversation = findOrCreateConversation(senderId, request.getRecipientId());
        } else {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "conversationId or recipientId must be provided.");
        }

        Message message = Message.builder()
            .conversationId(conversation.getId())
            .senderId(senderId)
            .content(request.getContent())
            .attachments(request.getAttachments())
            .build();
        
        Message savedMessage = messageRepository.save(message);

        conversation.setLastMessageContent(savedMessage.getContent());
        conversation.setLastMessageSenderId(savedMessage.getSenderId());
        conversation.setLastMessageType(savedMessage.getMessageType());
        conversation.setUpdatedAt(savedMessage.getCreatedAt());
        conversationRepository.save(conversation);

        return savedMessage;
    }

    /**
     * Finds an existing one-to-one conversation between two users or creates a new one.
     * <p>
     * Searches for an active conversation with the specified participants.
     * If none exists, creates a new one-to-one conversation with the sender as the creator.
     * </p>
     *
     * @param senderId the ID of the initiating user
     * @param recipientId the ID of the other user
     * @return the existing or newly created conversation
     */
    public Conversation findOrCreateConversation(String senderId, String recipientId) {
        Set<String> participantIds = Set.of(senderId, recipientId);

        return conversationRepository.findByTypeAndExactParticipants(ConversationType.ONE_TO_ONE, participantIds, participantIds.size())
                .orElseGet(() -> {
                    Conversation newConversation = Conversation.builder()
                            .type(ConversationType.ONE_TO_ONE)
                            .participantIds(participantIds)
                            .createdBy(senderId)
                            .build();
                    return conversationRepository.save(newConversation);
                });
    }

    /**
     * Deletes a message by marking it as deleted and clearing its content.
     * <p>
     * Only the message sender can delete their own messages. Deleted messages
     * have their content replaced with a deletion notice and attachments removed.
     * </p>
     *
     * @param messageId the ID of the message to delete
     * @param userId the ID of the user attempting to delete the message
     * @return the updated deleted message
     * @throws ResponseStatusException with HTTP 404 if the message is not found
     * @throws ResponseStatusException with HTTP 403 if the user is not the message sender
     */
    @Transactional
    public Message deleteMessage(Long messageId, String userId) {
        Message message = messageRepository.findById(messageId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Message not found"));

        if (!message.getSenderId().equals(userId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You can only delete your own messages.");
        }

        message.setDeleted(true);
        message.setContent("This message has been deleted.");
        message.setAttachments(null); 

        return messageRepository.save(message);
    }

    public List<Message> enrichMessagesWithUrls(List<Message> messages) {
        messages.forEach(msg -> {
            if (msg.getAttachments() != null) {
                msg.getAttachments().forEach(att -> {
                    att.setFileUrl(storageService.generatePresignedUrl(att.getObjectKey()));
                });
            }
        });
        return messages;
    }
}