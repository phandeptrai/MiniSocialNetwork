package com.mini.socialnetwork.modules.admin.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO cho Conversation trong admin panel
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ConversationAdminDto {
    private Long id;
    private String name;
    private String type;
    private String createdBy;
    private String lastMessageContent;
    private String lastMessageSenderId;
    private int participantsCount;
    private String createdAt;
    private String updatedAt;
}
