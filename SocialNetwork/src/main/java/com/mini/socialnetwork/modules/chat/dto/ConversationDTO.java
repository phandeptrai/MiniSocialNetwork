package com.mini.socialnetwork.modules.chat.dto;

import com.mini.socialnetwork.modules.chat.entity.Conversation.ConversationType;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.Set;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ConversationDTO {
    private Long id;
    private String lastMessageContent;
    private String lastMessageSenderId;
    private String lastMessageType;
    private Instant updatedAt;
    private Set<String> participantIds;
    private ConversationType type;
    private String name;
}
