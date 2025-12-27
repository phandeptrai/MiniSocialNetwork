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
import com.mini.socialnetwork.repository.FollowRepository;
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
    private final FollowRepository followRepository;
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
        Post foundPost = post.orElseThrow(() -> new IllegalArgumentException("Post not found"));
        if (foundPost.isDeleted()) {
            throw new IllegalArgumentException("Post not found");
        }
        return foundPost;
    }

    public List<Post> getPostsByAuthor(String authorId) {
        UUID objectId = UUID.fromString(authorId);
        return postRepository.findByAuthorIdAndIsDeletedFalse(objectId);
    }

    public Slice<Post> getPostsByAuthor(String authorId, int page, int size) {
        UUID objectId = UUID.fromString(authorId);
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        return postRepository.findByAuthorIdAndIsDeletedFalse(objectId, pageable);
    }

    /**
     * Get posts from extended following network (F1 + F2 + F3) + own posts.
     * Uses Recursive CTE with Depth-Limited Search algorithm.
     * Complexity: O(k + k² + k³) where k = average follows per user.
     */
    public Slice<Post> getPostsByFollowing(String userId, int page, int size) {
        // Get extended following (F1 + F2 + F3) using Recursive CTE
        List<String> extendedFollowingIds = followRepository.findExtendedFollowingIds(userId);

        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));

        // Create list of author IDs including current user's own posts
        List<UUID> authorIds = new ArrayList<>();

        // Always include current user's own posts
        authorIds.add(UUID.fromString(userId));

        // Add extended following if any
        if (extendedFollowingIds != null && !extendedFollowingIds.isEmpty()) {
            extendedFollowingIds.stream()
                    .map(UUID::fromString)
                    .forEach(authorIds::add);
        }

        return postRepository.findByAuthorIdInAndIsDeletedFalse(authorIds, pageable);
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

    /**
     * Update post content. Only the post author can update.
     */
    public Post updatePost(String postId, String userId, String newContent) {
        UUID postObjectId = UUID.fromString(postId);
        UUID userObjectId = UUID.fromString(userId);

        Post post = postRepository.findById(postObjectId)
                .orElseThrow(() -> new IllegalArgumentException("Post not found"));

        // Check ownership
        if (!post.getAuthorId().equals(userObjectId)) {
            throw new IllegalArgumentException("You can only edit your own posts");
        }

        post.setContent(newContent);
        post.setUpdatedAt(Instant.now());
        return postRepository.save(post);
    }

    public Post deletePost(String postId, String userId) {
        UUID postObjectId = UUID.fromString(postId);
        UUID userObjectId = UUID.fromString(userId);

        Post post = postRepository.findById(postObjectId)
                .orElseThrow(() -> new IllegalArgumentException("Post not found"));

        // Check ownership
        if (!post.getAuthorId().equals(userObjectId)) {
            throw new IllegalArgumentException("You can only delete your own posts");
        }

        post.setDeleted(true);
        post.setUpdatedAt(Instant.now());
        return postRepository.save(post);
    }
}
