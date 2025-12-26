package com.mini.socialnetwork.service;

import java.io.IOException;
import java.time.Instant;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Slice;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import com.mini.socialnetwork.model.Post;
import com.mini.socialnetwork.repository.PostRepository;
import com.mini.socialnetwork.repository.UserRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class PostService {

    private static final long MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB
    private static final int MAX_IMAGES = 4;

    private final PostRepository postRepository;
    private final UserRepository userRepository;
    private final Cloudinary cloudinary;

    public Post createPost(String authorId, String content, List<MultipartFile> images) throws IOException {
        boolean hasContent = StringUtils.hasText(content);
        boolean hasImages = images != null && !images.isEmpty();

        if (!hasContent && !hasImages) {
            throw new IllegalArgumentException("Post must have content or at least one image.");
        }

        List<String> imageUrls = new ArrayList<>();
        if (hasImages) {
            if (images.size() > MAX_IMAGES) {
                throw new IllegalArgumentException("Maximum 4 images are allowed.");
            }
            for (MultipartFile image : images) {
                if (image == null || image.isEmpty()) {
                    continue;
                }
                if (image.getSize() > MAX_IMAGE_SIZE_BYTES) {
                    throw new IllegalArgumentException("Each image must be 5MB or smaller.");
                }
                Map<?, ?> uploadResult = cloudinary.uploader()
                        .upload(image.getBytes(), ObjectUtils.asMap("folder", "posts"));
                Object url = uploadResult.get("secure_url");
                if (url != null) {
                    imageUrls.add(url.toString());
                }
            }
        }

        Post post = Post.builder()
                .authorId(UUID.fromString(authorId))
                .content(hasContent ? content : null)
                .imageUrls(imageUrls)
                .likes(new ArrayList<>())
                .likeCount(0)
                .commentCount(0)
                .createdAt(Instant.now())
                .updatedAt(Instant.now())
                .isDeleted(false)
                .build();

        return postRepository.save(post);
    }

    public Post getPostById(String id) {
        UUID uuid = UUID.fromString(id);
        Optional<Post> post = postRepository.findById(uuid);
        return post.orElseThrow(() -> new IllegalArgumentException("Post not found"));
    }

    public List<Post> getPostsByAuthor(String authorId) {
        UUID objectId = UUID.fromString(authorId);
        return postRepository.findByAuthorId(objectId);
    }

    public Slice<Post> getPostsByAuthor(String authorId, int page, int size) {
        UUID objectId = UUID.fromString(authorId);
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        return postRepository.findByAuthorId(objectId, pageable);
    }

    public Slice<Post> getPostsByFollowing(String userId, int page, int size) {
        UUID userUuid = UUID.fromString(userId);
        var user = userRepository.findById(userUuid)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        List<UUID> following = user.getFollowing();
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        if (following == null || following.isEmpty()) {
            return postRepository.findByAuthorIdIn(List.of(UUID.randomUUID()), pageable).map(p -> p); // empty slice
        }
        return postRepository.findByAuthorIdIn(following, pageable);
    }

    public Post toggleLike(String postId, String userId) {
        UUID postObjectId = UUID.fromString(postId);
        UUID userObjectId = UUID.fromString(userId);

        Post post = postRepository.findById(postObjectId)
                .orElseThrow(() -> new IllegalArgumentException("Post not found"));

        List<UUID> likes = post.getLikes() != null ? new ArrayList<>(post.getLikes()) : new ArrayList<>();
        Set<UUID> likeSet = new HashSet<>(likes);

        boolean added = likeSet.add(userObjectId);
        if (!added) {
            likeSet.remove(userObjectId); // toggle off
        }

        post.setLikes(new ArrayList<>(likeSet));
        post.setLikeCount(likeSet.size());
        post.setUpdatedAt(Instant.now());
        post = postRepository.save(post);

        return post;
    }

    public Post deletePost(String postId) {
        UUID postObjectId = UUID.fromString(postId);
        Post post = postRepository.findById(postObjectId)
                .orElseThrow(() -> new IllegalArgumentException("Post not found"));

        post.setDeleted(true);
        post.setUpdatedAt(Instant.now());
        return postRepository.save(post);
    }
}
