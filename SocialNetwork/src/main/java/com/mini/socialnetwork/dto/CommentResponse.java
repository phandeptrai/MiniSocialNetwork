package com.mini.socialnetwork.dto;

import java.time.Instant;

import com.mini.socialnetwork.model.Comment;

public record CommentResponse(
        String id,
        String postId,
        String userId,
        String content,
        String imageUrl,
        Instant createdAt,
        Instant updatedAt,
        boolean deleted) {

    public static CommentResponse from(Comment comment) {
        return new CommentResponse(
                comment.getId() != null ? comment.getId().toString() : null,
                comment.getPostId() != null ? comment.getPostId().toString() : null,
                comment.getUserId() != null ? comment.getUserId().toString() : null,
                comment.getContent(),
                comment.getImageUrl(),
                comment.getCreatedAt(),
                comment.getUpdatedAt(),
                comment.isDeleted());
    }
}
