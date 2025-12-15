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
public class Post {
    private ObjectId id;
    private ObjectId authorId;          // User
    private String content;
    private List<String> imageUrls;     // up to 4 images
    private List<ObjectId> likes;       // userId
    private Date createdAt;
    private Date updatedAt;
    private boolean isDeleted;
}

