package com.mini.socialnetwork.modules.chat.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class DeleteMessageEvent {
    private Long messageId;
    private Long conversationId;
}