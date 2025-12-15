package com.mini.socialnetwork.model;

import java.util.Date;

import org.bson.types.ObjectId;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Message {
    private ObjectId id;
    private ObjectId conversationId;
    private ObjectId senderId;
    private ObjectId receiverId;
    private String content;
    private Date createdAt;
    private Date updatedAt;
    private boolean isDeleted;
}

