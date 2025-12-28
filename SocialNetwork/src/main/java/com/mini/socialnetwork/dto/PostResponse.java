package com.mini.socialnetwork.dto;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

import com.mini.socialnetwork.model.Post;
import com.mini.socialnetwork.model.User;

public record PostResponse(
                String id,
                String authorId,
                String authorName,
                String authorAvatarUrl,
                String content,
                List<String> imageUrls,
                List<String> likes,
                int likeCount,
                int commentCount,
                Instant createdAt,
                Instant updatedAt,
                boolean deleted) {

        /**
         * Legacy method - for backward compatibility (uses null for author info)
         */
        public static PostResponse from(Post post) {
                return from(post, null);
        }

        /**
         * Create PostResponse with author information
         */
        public static PostResponse from(Post post, User author) {
                String postId = post.getId() != null ? post.getId().toString() : null;
                String authorIdStr = post.getAuthorId() != null ? post.getAuthorId().toString() : null;
                List<String> likeIds = post.getLikes() != null
                                ? post.getLikes().stream().map(id -> id != null ? id.toString() : null)
                                                .collect(Collectors.toList())
                                : null;
                int likeCount = post.getLikes() != null ? post.getLikes().size() : 0;
                int commentCount = post.getCommentCount();

                List<String> imageUrls = post.getImageUrls() != null ? new ArrayList<>(post.getImageUrls()) : null;

                // Extract author info with fallback
                String authorName = "User"; // Default fallback
                String authorAvatarUrl = null;
                if (author != null) {
                        authorName = author.getName() != null ? author.getName() : author.getUsername();
                        authorAvatarUrl = author.getAvatarUrl();
                }

                return new PostResponse(
                                postId,
                                authorIdStr,
                                authorName,
                                authorAvatarUrl,
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
