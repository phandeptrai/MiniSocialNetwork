package com.mini.socialnetwork.controller;

import java.io.IOException;
import java.util.List;

import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.mini.socialnetwork.dto.CommentResponse;
import com.mini.socialnetwork.dto.SliceResponse;
import com.mini.socialnetwork.model.Comment;
import com.mini.socialnetwork.service.CommentService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/comments")
@RequiredArgsConstructor
public class CommentController {

    private final CommentService commentService;

    /**
     * Create a new comment on a post
     * POST /api/comments
     * Form data: postId, userId, content (optional), image (optional, max 5MB)
     */
    @PostMapping(consumes = { MediaType.MULTIPART_FORM_DATA_VALUE })
    public ResponseEntity<CommentResponse> createComment(
            @RequestParam("postId") String postId,
            @RequestParam("userId") String userId,
            @RequestParam(value = "content", required = false) String content,
            @RequestParam(value = "image", required = false) MultipartFile image) throws IOException {

        Comment saved = commentService.createComment(postId, userId, content, image);
        return ResponseEntity.ok(CommentResponse.from(saved));
    }

    /**
     * Get a specific comment by ID
     * GET /api/comments/{id}
     */
    @GetMapping("/{id}")
    public ResponseEntity<CommentResponse> getCommentById(@PathVariable String id) {
        Comment comment = commentService.getCommentById(id);
        return ResponseEntity.ok(CommentResponse.from(comment));
    }

    /**
     * Get all comments for a post with pagination
     * GET /api/comments/post/{postId}?page=0&size=10
     */
    @GetMapping("/post/{postId}")
    public ResponseEntity<SliceResponse<CommentResponse>> getCommentsByPost(
            @PathVariable String postId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        var slice = commentService.getCommentsByPost(postId, page, size);
        List<CommentResponse> content = slice.map(CommentResponse::from).getContent();
        return ResponseEntity.ok(SliceResponse.of(content, slice.hasNext()));
    }

    /**
     * Update a comment (only owner can update)
     * PUT /api/comments/{id}
     * Form data: userId, content (optional), image (optional), removeImage
     * (optional)
     */
    @PutMapping(value = "/{id}", consumes = { MediaType.MULTIPART_FORM_DATA_VALUE })
    public ResponseEntity<CommentResponse> updateComment(
            @PathVariable String id,
            @RequestParam("userId") String userId,
            @RequestParam(value = "content", required = false) String content,
            @RequestParam(value = "image", required = false) MultipartFile image,
            @RequestParam(value = "removeImage", required = false, defaultValue = "false") boolean removeImage)
            throws IOException {

        Comment updated = commentService.updateComment(id, userId, content, image, removeImage);
        return ResponseEntity.ok(CommentResponse.from(updated));
    }

    /**
     * Delete a comment (soft delete, only owner can delete)
     * DELETE /api/comments/{id}?userId=xxx
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<CommentResponse> deleteComment(
            @PathVariable String id,
            @RequestParam("userId") String userId) {

        Comment deleted = commentService.deleteComment(id, userId);
        return ResponseEntity.ok(CommentResponse.from(deleted));
    }

    /**
     * Get comment count for a post
     * GET /api/comments/count/{postId}
     */
    @GetMapping("/count/{postId}")
    public ResponseEntity<Long> getCommentCount(@PathVariable String postId) {
        long count = commentService.getCommentCount(postId);
        return ResponseEntity.ok(count);
    }
}
