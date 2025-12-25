package com.mini.socialnetwork.modules.chat.service;

import lombok.RequiredArgsConstructor;

import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

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
 * Service xử lý logic nghiệp vụ cho tin nhắn và cuộc hội thoại.
 * <p>
 * Lớp này chịu trách nhiệm tạo, xóa tin nhắn và quản lý cuộc hội thoại.
 * Đảm bảo tính toàn vẹn dữ liệu thông qua transaction và validation.
 * </p>
 *
 * <h2>Chức năng chính:</h2>
 * <ul>
 * <li>Tạo tin nhắn mới (có hoặc không có file đính kèm)</li>
 * <li>Tìm hoặc tạo cuộc hội thoại 1-1</li>
 * <li>Xóa tin nhắn (soft-delete)</li>
 * <li>Cập nhật metadata cuộc hội thoại (denormalization)</li>
 * </ul>
 *
 * <h2>Validation:</h2>
 * <ul>
 * <li>Tối đa 5 file đính kèm mỗi tin nhắn</li>
 * <li>Chỉ participant mới được gửi tin vào conversation</li>
 * <li>Chỉ sender mới được xóa tin nhắn của mình</li>
 * </ul>
 *
 * @author MiniSocialNetwork Team
 * @version 1.0
 */
@Service
@RequiredArgsConstructor
public class MessageService {

    /** Repository truy cập dữ liệu tin nhắn */
    private final MessageRepository messageRepository;

    /** Repository truy cập dữ liệu cuộc hội thoại */
    private final ConversationRepository conversationRepository;

    /** Service xử lý lưu trữ file */
    private final StorageService storageService;

    /**
     * Tạo và lưu tin nhắn mới vào cuộc hội thoại.
     * <p>
     * Phương thức này xử lý hai trường hợp:
     * <ul>
     * <li>Có conversationId: Gửi tin vào conversation đã tồn tại</li>
     * <li>Có recipientId: Tìm hoặc tạo conversation 1-1 rồi gửi tin</li>
     * </ul>
     * Sau khi lưu tin nhắn, cập nhật metadata của conversation (lastMessage*).
     * </p>
     *
     * <h3>Xử lý file đính kèm:</h3>
     * <p>
     * File đã được upload trước đó qua AttachmentController. Method này chỉ
     * tạo entity Attachment từ DTO và liên kết với Message.
     * </p>
     *
     * @param request  yêu cầu gửi tin nhắn từ client
     * @param senderId ID của người gửi (từ JWT)
     * @return tin nhắn đã được lưu với ID và createdAt
     * @throws ResponseStatusException 400 nếu quá 5 file đính kèm
     * @throws ResponseStatusException 400 nếu thiếu cả conversationId và
     *                                 recipientId
     * @throws ResponseStatusException 403 nếu sender không phải participant của
     *                                 conversation
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
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "conversationId or recipientId must be provided.");
        }

        Message message = new Message();
        message.setConversationId(conversation.getId());
        message.setSenderId(senderId);
        message.setContent(request.getContent());

        if (request.getAttachments() != null && !request.getAttachments().isEmpty()) {
            if (request.getAttachments().size() > 5) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Cannot send more than 5 attachments.");
            }

            List<Message.Attachment> attachmentEntities = request.getAttachments().stream()
                    .map(dto -> {
                        Message.Attachment entity = new Message.Attachment();
                        entity.setObjectKey(dto.getObjectKey());
                        entity.setFileName(dto.getFileName());
                        entity.setFileType(dto.getFileType());
                        entity.setFileSize(dto.getFileSize());
                        entity.setMessage(message);
                        entity.setFileUrl(storageService.getPublicUrl(dto.getObjectKey()));

                        entity.setMessage(message);
                        return entity;
                    }).collect(Collectors.toList());
            message.setAttachments(attachmentEntities);
            message.setMessageType(Message.MessageType.ATTACHMENT);
        }

        Message savedMessage = messageRepository.save(message);

        String lastMessageContentTruncated = savedMessage.getContent().length() > 50
                ? savedMessage.getContent().substring(0, 50) + "..."
                : savedMessage.getContent();
        conversation.setLastMessageContent(lastMessageContentTruncated);
        conversation.setLastMessageSenderId(savedMessage.getSenderId());
        conversation.setLastMessageType(savedMessage.getMessageType());
        conversation.setUpdatedAt(savedMessage.getCreatedAt());
        conversationRepository.save(conversation);

        return savedMessage;
    }

    /**
     * Tìm cuộc hội thoại 1-1 đã tồn tại hoặc tạo mới giữa hai user.
     * <p>
     * Phương thức này đảm bảo chỉ có một conversation 1-1 duy nhất
     * giữa hai user bất kỳ. Nếu đã tồn tại, trả về conversation đó.
     * Nếu chưa, tạo mới với sender là creator.
     * </p>
     *
     * <h3>Logic tìm kiếm:</h3>
     * <p>
     * Sử dụng findByTypeAndExactParticipants để tìm conversation có:
     * - Type = ONE_TO_ONE
     * - ParticipantIds chứa chính xác 2 user: sender và recipient
     * </p>
     *
     * @param senderId    ID của người khởi tạo cuộc hội thoại
     * @param recipientId ID của người nhận
     * @return cuộc hội thoại đã tồn tại hoặc mới tạo
     */
    public Conversation findOrCreateConversation(String senderId, String recipientId) {
        Set<String> participantIds = new java.util.HashSet<>(Set.of(senderId, recipientId));

        return conversationRepository
                .findByTypeAndExactParticipants(ConversationType.ONE_TO_ONE, participantIds, participantIds.size())
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
     * Xóa tin nhắn (soft-delete) và trả về tin nhắn đã cập nhật.
     * <p>
     * Thực hiện soft-delete: đánh dấu isDeleted = true và thay nội dung
     * bằng thông báo "This message has been deleted." File đính kèm
     * cũng bị xóa khỏi database (nhưng vẫn còn trên MinIO).
     * </p>
     *
     * <h3>Phân quyền:</h3>
     * <p>
     * Chỉ người gửi tin nhắn (sender) mới có quyền xóa.
     * Trả về 403 Forbidden nếu userId không khớp với senderId của tin nhắn.
     * </p>
     *
     * @param messageId ID của tin nhắn cần xóa
     * @param userId    ID của người yêu cầu xóa (từ JWT)
     * @return tin nhắn đã được đánh dấu deleted
     * @throws ResponseStatusException 404 nếu không tìm thấy tin nhắn
     * @throws ResponseStatusException 403 nếu user không phải sender
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
        if (message.getAttachments() != null) {
            message.getAttachments().clear();
        }

        return messageRepository.save(message);
    }

}
