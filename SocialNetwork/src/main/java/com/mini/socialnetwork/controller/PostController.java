package com.mini.socialnetwork.controller;

import java.io.IOException;
import java.util.Arrays;
import java.util.List;

import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.mini.socialnetwork.dto.PostResponse;
import com.mini.socialnetwork.dto.SliceResponse;
import com.mini.socialnetwork.model.Notification;
import com.mini.socialnetwork.model.Post;
import com.mini.socialnetwork.service.NotificationService;
import com.mini.socialnetwork.service.PostService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@RestController
@RequestMapping("/api/posts")
@RequiredArgsConstructor
public class PostController {

    private final PostService postService;
    private final NotificationService notificationService;
    private final SimpMessagingTemplate messagingTemplate;

    @PostMapping(consumes = { MediaType.MULTIPART_FORM_DATA_VALUE })
    public ResponseEntity<PostResponse> createPost(
            @AuthenticationPrincipal Jwt jwt,
            @RequestParam(value = "content", required = false) String content,
            @RequestParam(value = "images", required = false) MultipartFile[] images) throws IOException {

        // Lấy user ID từ JWT token (sub claim)
        String authorId = jwt.getSubject();

        List<MultipartFile> imageList = images != null ? Arrays.asList(images) : List.of();
        Post saved = postService.createPost(authorId, content, imageList);
        return ResponseEntity.ok(PostResponse.from(saved));
    }

    @GetMapping("/{id}")
    public ResponseEntity<PostResponse> getPostById(@PathVariable String id) {
        Post post = postService.getPostById(id);
        return ResponseEntity.ok(PostResponse.from(post));
    }

    @GetMapping("/author/{authorId}")
    public ResponseEntity<SliceResponse<PostResponse>> getPostsByAuthor(
            @PathVariable String authorId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        var slice = postService.getPostsByAuthor(authorId, page, size);
        List<PostResponse> content = slice.map(PostResponse::from).getContent();
        return ResponseEntity.ok(SliceResponse.of(content, slice.hasNext()));
    }

    @PostMapping("/{id}/like")
    public ResponseEntity<PostResponse> toggleLike(
            @PathVariable String id,
            @AuthenticationPrincipal Jwt jwt) {
        // Lấy user ID từ JWT token
        String userId = jwt.getSubject();

        // Lấy post trước để kiểm tra likes
        Post postBefore = postService.getPostById(id);
        boolean wasLiked = postBefore.getLikes() != null &&
                postBefore.getLikes().contains(java.util.UUID.fromString(userId));

        // Toggle like
        Post post = postService.toggleLike(id, userId);

        // Kiểm tra xem đây là like mới (không phải unlike) và không phải tự like bài
        // mình
        String authorId = post.getAuthorId().toString();
        boolean isLikeAction = !wasLiked; // Nếu trước đó chưa like = đây là like mới
        boolean isNotOwnPost = !userId.equals(authorId);

        if (isLikeAction && isNotOwnPost) {
            try {
                // Lấy thông tin người like từ JWT
                String senderName = jwt.getClaimAsString("name");
                if (senderName == null) {
                    senderName = jwt.getClaimAsString("preferred_username");
                }
                String senderAvatar = jwt.getClaimAsString("picture");

                // Tạo notification
                Notification notification = notificationService.createLikeNotification(
                        userId,
                        authorId,
                        senderName != null ? senderName : "Someone",
                        senderAvatar,
                        id);

                // Gửi notification qua WebSocket
                messagingTemplate.convertAndSendToUser(
                        authorId,
                        "/queue/notifications",
                        notification);
                log.info("Like notification sent to user {}", authorId);
            } catch (Exception e) {
                log.error("Failed to send like notification: {}", e.getMessage());
            }
        }

        return ResponseEntity.ok(PostResponse.from(post));
    }

    @PutMapping("/{id}")
    public ResponseEntity<PostResponse> updatePost(
            @PathVariable String id,
            @AuthenticationPrincipal Jwt jwt,
            @RequestParam("content") String content) {
        String userId = jwt.getSubject();
        Post post = postService.updatePost(id, userId, content);
        return ResponseEntity.ok(PostResponse.from(post));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<PostResponse> deletePost(
            @PathVariable String id,
            @AuthenticationPrincipal Jwt jwt) {
        String userId = jwt.getSubject();
        PostResponse postResponse = postService.deletePost(id, userId);
        return ResponseEntity.ok(postResponse);
    }

    @GetMapping("/feed")
    public ResponseEntity<SliceResponse<PostResponse>> getFeed(
            @AuthenticationPrincipal Jwt jwt,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        // Lấy user ID từ JWT token
        String userId = jwt.getSubject();

        var slice = postService.getPostsByFollowing(userId, page, size);
        List<PostResponse> content = slice.map(PostResponse::from).getContent();
        return ResponseEntity.ok(SliceResponse.of(content, slice.hasNext()));
    }
}
