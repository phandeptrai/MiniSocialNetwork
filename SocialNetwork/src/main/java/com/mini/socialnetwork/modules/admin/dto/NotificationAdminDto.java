package com.mini.socialnetwork.modules.admin.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

/**
 * DTO cho Notification trong admin panel
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NotificationAdminDto {
    private UUID id;
    private UUID receiverId;
    private String receiverName;
    private UUID senderId;
    private String senderName;
    private String type;
    private UUID postId;
    private String conversationId;
    private String message;
    private boolean isRead;
    private String createdAt;
}
