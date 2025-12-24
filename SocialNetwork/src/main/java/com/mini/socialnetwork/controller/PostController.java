package com.mini.socialnetwork.controller;

import java.io.IOException;
import java.util.Arrays;
import java.util.List;

import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.data.domain.Slice;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.mini.socialnetwork.dto.PostResponse;
import com.mini.socialnetwork.dto.SliceResponse;
import com.mini.socialnetwork.model.Post;
import com.mini.socialnetwork.service.PostService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/posts")
@RequiredArgsConstructor
public class PostController {

    private final PostService postService;

    @PostMapping(consumes = { MediaType.MULTIPART_FORM_DATA_VALUE })
    public ResponseEntity<PostResponse> createPost(
            @RequestParam("authorId") String authorId,
            @RequestParam(value = "content", required = false) String content,
            @RequestParam(value = "images", required = false) MultipartFile[] images) throws IOException {

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
            @RequestParam("userId") String userId) {
        Post post = postService.toggleLike(id, userId);
        return ResponseEntity.ok(PostResponse.from(post));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<PostResponse> deletePost(@PathVariable String id) {
        Post post = postService.deletePost(id);
        return ResponseEntity.ok(PostResponse.from(post));
    }

    @GetMapping("/feed")
    public ResponseEntity<SliceResponse<PostResponse>> getFeed(
            @RequestParam("userId") String userId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        var slice = postService.getPostsByFollowing(userId, page, size);
        List<PostResponse> content = slice.map(PostResponse::from).getContent();
        return ResponseEntity.ok(SliceResponse.of(content, slice.hasNext()));
    }
}

