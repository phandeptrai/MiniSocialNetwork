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

@RestController
@RequestMapping("/api/attachments")
@RequiredArgsConstructor
public class AttachmentController {

    private final StorageService storageService;
    private final MessageService messageService; 
    private static final long MAX_FILE_SIZE = 10 * 1024 * 1024; 

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