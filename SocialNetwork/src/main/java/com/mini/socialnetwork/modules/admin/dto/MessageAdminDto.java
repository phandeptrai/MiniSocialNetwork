package com.mini.socialnetwork.modules.admin.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO cho Message trong admin panel
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MessageAdminDto {
    private Long id;
    private Long conversationId;
    private String senderId;
    private String senderName;
    private String content;
    private String messageType;
    private boolean isDeleted;
    private String createdAt;
    private int attachmentsCount;
}
