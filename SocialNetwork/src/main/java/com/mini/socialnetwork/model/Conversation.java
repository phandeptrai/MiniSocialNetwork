package com.mini.socialnetwork.model;

import java.util.Date;
import java.util.List;

import org.bson.types.ObjectId;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Conversation {
    private ObjectId id;
    private List<ObjectId> participantIds;   // exactly 2 users
    private String lastMessage;
    private Date lastMessageAt;
    private Date createdAt;
}

