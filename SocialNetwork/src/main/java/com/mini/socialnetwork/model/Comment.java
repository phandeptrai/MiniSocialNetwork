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
public class Comment {
    private ObjectId id;
    private ObjectId postId;
    private ObjectId userId;
    private String content;
    private Date createdAt;
    private Date updatedAt;
    private boolean isDeleted;
}

