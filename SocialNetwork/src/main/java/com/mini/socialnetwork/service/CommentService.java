package com.mini.socialnetwork.service;

import java.io.IOException;
import java.time.Instant;
import java.util.Map;
import java.util.UUID;

import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Slice;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import com.mini.socialnetwork.model.Comment;
import com.mini.socialnetwork.model.Post;
import com.mini.socialnetwork.repository.CommentRepository;
import com.mini.socialnetwork.repository.PostRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class CommentService {

    private static final long MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB

    private final CommentRepository commentRepository;
    private final PostRepository postRepository;
    private final Cloudinary cloudinary;

    /**
     * Create a new comment on a post
     */
    public Comment createComment(String postId, String userId, String content, MultipartFile image) throws IOException {
        UUID postUuid = UUID.fromString(postId);
        UUID userUuid = UUID.fromString(userId);

        // Validate post exists and is not deleted
        Post post = postRepository.findById(postUuid)
                .orElseThrow(() -> new IllegalArgumentException("Post not found"));
        if (post.isDeleted()) {
            throw new IllegalArgumentException("Cannot comment on a deleted post");
        }

        // Validate content or image exists
        boolean hasContent = StringUtils.hasText(content);
        boolean hasImage = image != null && !image.isEmpty();

        if (!hasContent && !hasImage) {
            throw new IllegalArgumentException("Comment must have content or an image");
        }

        // Upload image to Cloudinary if present
        String imageUrl = null;
        if (hasImage) {
            if (image.getSize() > MAX_IMAGE_SIZE_BYTES) {
                throw new IllegalArgumentException("Image must be 5MB or smaller");
            }
            Map<?, ?> uploadResult = cloudinary.uploader()
                    .upload(image.getBytes(), ObjectUtils.asMap("folder", "comments"));
            Object url = uploadResult.get("secure_url");
            if (url != null) {
                imageUrl = url.toString();
            }
        }

        // Build and save comment
        Comment comment = Comment.builder()
                .postId(postUuid)
                .userId(userUuid)
                .content(hasContent ? content : null)
                .imageUrl(imageUrl)
                .createdAt(Instant.now())
                .updatedAt(Instant.now())
                .isDeleted(false)
                .build();

        Comment saved = commentRepository.save(comment);

        // Update post comment count
        long commentCount = commentRepository.countByPostIdAndIsDeletedFalse(postUuid);
        post.setCommentCount((int) commentCount);
        post.setUpdatedAt(Instant.now());
        postRepository.save(post);

        return saved;
    }

    /**
     * Get a comment by ID
     */
    public Comment getCommentById(String commentId) {
        UUID uuid = UUID.fromString(commentId);
        Comment comment = commentRepository.findById(uuid)
                .orElseThrow(() -> new IllegalArgumentException("Comment not found"));
        if (comment.isDeleted()) {
            throw new IllegalArgumentException("Comment not found");
        }
        return comment;
    }

    /**
     * Get comments for a post with pagination
     */
    public Slice<Comment> getCommentsByPost(String postId, int page, int size) {
        UUID postUuid = UUID.fromString(postId);
        Pageable pageable = PageRequest.of(page, size);
        return commentRepository.findByPostIdAndIsDeletedFalseOrderByCreatedAtDesc(postUuid, pageable);
    }

    /**
     * Update a comment (only owner can update)
     */
    public Comment updateComment(String commentId, String userId, String content, MultipartFile image,
            boolean removeImage) throws IOException {
        UUID commentUuid = UUID.fromString(commentId);
        UUID userUuid = UUID.fromString(userId);

        Comment comment = commentRepository.findById(commentUuid)
                .orElseThrow(() -> new IllegalArgumentException("Comment not found"));

        if (comment.isDeleted()) {
            throw new IllegalArgumentException("Comment not found");
        }

        // Check ownership
        if (!comment.getUserId().equals(userUuid)) {
            throw new IllegalArgumentException("You can only edit your own comments");
        }

        // Update content if provided
        boolean hasNewContent = StringUtils.hasText(content);
        if (hasNewContent) {
            comment.setContent(content);
        }

        // Handle image update
        boolean hasNewImage = image != null && !image.isEmpty();
        if (hasNewImage) {
            if (image.getSize() > MAX_IMAGE_SIZE_BYTES) {
                throw new IllegalArgumentException("Image must be 5MB or smaller");
            }
            Map<?, ?> uploadResult = cloudinary.uploader()
                    .upload(image.getBytes(), ObjectUtils.asMap("folder", "comments"));
            Object url = uploadResult.get("secure_url");
            if (url != null) {
                comment.setImageUrl(url.toString());
            }
        } else if (removeImage) {
            comment.setImageUrl(null);
        }

        // Validate final state has content or image
        if (!StringUtils.hasText(comment.getContent()) && comment.getImageUrl() == null) {
            throw new IllegalArgumentException("Comment must have content or an image");
        }

        comment.setUpdatedAt(Instant.now());
        return commentRepository.save(comment);
    }

    /**
     * Soft delete a comment (only owner can delete)
     */
    public Comment deleteComment(String commentId, String userId) {
        UUID commentUuid = UUID.fromString(commentId);
        UUID userUuid = UUID.fromString(userId);

        Comment comment = commentRepository.findById(commentUuid)
                .orElseThrow(() -> new IllegalArgumentException("Comment not found"));

        if (comment.isDeleted()) {
            throw new IllegalArgumentException("Comment not found");
        }

        // Check ownership
        if (!comment.getUserId().equals(userUuid)) {
            throw new IllegalArgumentException("You can only delete your own comments");
        }

        comment.setDeleted(true);
        comment.setUpdatedAt(Instant.now());
        Comment deleted = commentRepository.save(comment);

        // Update post comment count
        UUID postUuid = comment.getPostId();
        Post post = postRepository.findById(postUuid).orElse(null);
        if (post != null) {
            long commentCount = commentRepository.countByPostIdAndIsDeletedFalse(postUuid);
            post.setCommentCount((int) commentCount);
            post.setUpdatedAt(Instant.now());
            postRepository.save(post);
        }

        return deleted;
    }

    /**
     * Get comment count for a post
     */
    public long getCommentCount(String postId) {
        UUID postUuid = UUID.fromString(postId);
        return commentRepository.countByPostIdAndIsDeletedFalse(postUuid);
    }
}
