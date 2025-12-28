package com.mini.socialnetwork.modules.post.dto;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

import com.mini.socialnetwork.modules.post.entity.Post;

public record PostResponse(
        String id,
        String authorId,
        String content,
        List<String> imageUrls,
        List<String> likes,
        int likeCount,
        int commentCount,
        Instant createdAt,
        Instant updatedAt,
        boolean deleted) {

    public static PostResponse from(Post post) {
        String postId = post.getId() != null ? post.getId().toString() : null;
        String authorIdStr = post.getAuthorId() != null ? post.getAuthorId().toString() : null;
        List<String> likeIds = post.getLikes() != null
                ? post.getLikes().stream().map(id -> id != null ? id.toString() : null)
                        .collect(Collectors.toList())
                : null;
        int likeCount = post.getLikes() != null ? post.getLikes().size() : 0;
        int commentCount = post.getCommentCount();

        List<String> imageUrls = post.getImageUrls() != null ? new ArrayList<>(post.getImageUrls()) : null;

        return new PostResponse(
                postId,
                authorIdStr,
                post.getContent(),
                imageUrls,
                likeIds,
                likeCount,
                commentCount,
                post.getCreatedAt(),
                post.getUpdatedAt(),
                post.isDeleted());
    }
}
