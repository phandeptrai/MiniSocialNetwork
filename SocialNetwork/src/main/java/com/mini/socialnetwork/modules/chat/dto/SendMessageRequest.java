package com.mini.socialnetwork.modules.chat.dto;

import java.util.List;

import com.mini.socialnetwork.modules.chat.entity.Message;

import lombok.Data;

@Data
public class SendMessageRequest {
    private Long conversationId;
    private String recipientId;
    private String content;
    private List<Message.Attachment> attachments;
}