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
public class Notification {
    private ObjectId id;
    private ObjectId receiverId;
    private ObjectId senderId;
    private Type type;            // LIKE, COMMENT, FOLLOW
    private ObjectId postId;      // nullable
    private boolean isRead;
    private Date createdAt;

    public enum Type {
        LIKE,
        COMMENT,
        FOLLOW
    }
}

