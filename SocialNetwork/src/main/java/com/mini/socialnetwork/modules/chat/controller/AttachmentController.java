package com.mini.socialnetwork.modules.chat.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import com.mini.socialnetwork.infras.StorageService;
import com.mini.socialnetwork.modules.chat.entity.Conversation;
import com.mini.socialnetwork.modules.chat.entity.Message.Attachment;
import com.mini.socialnetwork.modules.chat.service.MessageService;

import java.util.ArrayList;
import java.util.List;

/**
 * REST Controller xử lý việc upload file đính kèm cho tin nhắn.
 * <p>
 * Controller này cung cấp endpoint để client upload nhiều file cùng lúc
 * trước khi gửi tin nhắn. File được lưu trên MinIO và trả về metadata
 * để client đính kèm vào tin nhắn.
 * </p>
 *
 * <h2>Quy trình upload:</h2>
 * <ol>
 *   <li>Client chọn file và gọi POST /api/attachments</li>
 *   <li>Server upload file lên MinIO và trả về danh sách Attachment</li>
 *   <li>Client đính kèm Attachment vào SendMessageRequest</li>
 *   <li>Client gửi tin nhắn qua WebSocket</li>
 * </ol>
 *
 * <h2>Giới hạn:</h2>
 * <ul>
 *   <li>Tối đa 5 file mỗi lần upload</li>
 *   <li>Mỗi file tối đa 10MB</li>
 * </ul>
 *
 * @author MiniSocialNetwork Team
 * @version 1.0
 * @see StorageService
 */
@RestController
@RequestMapping("/api/attachments")
@RequiredArgsConstructor
public class AttachmentController {

    /** Service xử lý lưu trữ file trên MinIO */
    private final StorageService storageService;

    /** Service quản lý tin nhắn và cuộc hội thoại */
    private final MessageService messageService; 

    /** Kích thước file tối đa: 10MB */
    private static final long MAX_FILE_SIZE = 10 * 1024 * 1024; 

    /**
     * Upload nhiều file đính kèm cho một cuộc hội thoại.
     * <p>
     * Endpoint này hỗ trợ hai trường hợp:
     * <ul>
     *   <li>Có conversationId: Upload file vào cuộc hội thoại đã tồn tại</li>
     *   <li>Có recipientId: Tạo hoặc tìm cuộc hội thoại với người nhận rồi upload</li>
     * </ul>
     * </p>
     *
     * <h3>Validation:</h3>
     * <ul>
     *   <li>Phải cung cấp conversationId hoặc recipientId</li>
     *   <li>Tối đa 5 file</li>
     *   <li>Mỗi file không quá 10MB</li>
     *   <li>Bỏ qua file rỗng</li>
     * </ul>
     *
     * @param files danh sách file cần upload (multipart)
     * @param conversationId ID cuộc hội thoại (tùy chọn)
     * @param recipientId ID người nhận để tạo cuộc hội thoại mới (tùy chọn)
     * @param jwt JWT token của người dùng đang đăng nhập
     * @return danh sách Attachment với URL công khai của các file đã upload
     * @throws ResponseStatusException 400 nếu thiếu cả conversationId và recipientId
     * @throws ResponseStatusException 400 nếu quá 5 file
     * @throws ResponseStatusException 400 nếu file vượt quá 10MB
     */
    @PostMapping
    public ResponseEntity<List<Attachment>> uploadAttachments(
            @RequestParam("files") List<MultipartFile> files,
            @RequestParam(required = false) Long conversationId,
            @RequestParam(required = false) String recipientId,
            @AuthenticationPrincipal Jwt jwt) {
        
        String senderId = jwt.getSubject();

        if (conversationId == null && recipientId != null) {
            Conversation conv = messageService.findOrCreateConversation(senderId, recipientId);
            conversationId = conv.getId();
        } else if (conversationId == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Either conversationId or recipientId must be provided.");
        }
        
        final Long finalConversationId = conversationId;

        if (files.size() > 5) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Cannot upload more than 5 files at a time.");
        }
        
        List<Attachment> uploadedAttachments = new ArrayList<>();
        
        for (MultipartFile file : files) {
            if (file.isEmpty()) continue;
            if (file.getSize() > MAX_FILE_SIZE) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "File '" + file.getOriginalFilename() + "' exceeds 10MB.");
            }

            Attachment attachment = storageService.uploadFile(file, finalConversationId);
            uploadedAttachments.add(attachment);
        }

        return ResponseEntity.ok(uploadedAttachments);
    }
}
