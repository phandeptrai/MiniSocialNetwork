package com.mini.socialnetwork.controller;

import com.mini.socialnetwork.model.Follow;
import com.mini.socialnetwork.service.FollowService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/follows")
@RequiredArgsConstructor
public class FollowController {

    private final FollowService followService;

    /**
     * Follow a user
     * POST /api/follows/{followingId}
     * 
     * Note: In a real application, followerId would come from JWT token.
     * For now, we use a request parameter.
     */
    @PostMapping("/{followingId}")
    public ResponseEntity<?> follow(
            @PathVariable Long followingId,
            @RequestParam Long followerId) {
        try {
            Follow follow = followService.follow(followerId, followingId);
            Map<String, Object> response = new HashMap<>();
            response.put("message", "Successfully followed user");
            response.put("followerId", follow.getFollowerId());
            response.put("followingId", follow.getFollowingId());
            response.put("createdAt", follow.getCreatedAt());
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (IllegalArgumentException e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }

    /**
     * Unfollow a user
     * DELETE /api/follows/{followingId}
     */
    @DeleteMapping("/{followingId}")
    public ResponseEntity<?> unfollow(
            @PathVariable Long followingId,
            @RequestParam Long followerId) {
        try {
            followService.unfollow(followerId, followingId);
            Map<String, String> response = new HashMap<>();
            response.put("message", "Successfully unfollowed user");
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }

    /**
     * Check follow status
     * GET /api/follows/status/{followingId}
     */
    @GetMapping("/status/{followingId}")
    public ResponseEntity<Map<String, Boolean>> getFollowStatus(
            @PathVariable Long followingId,
            @RequestParam Long followerId) {
        boolean isFollowing = followService.isFollowing(followerId, followingId);
        Map<String, Boolean> response = new HashMap<>();
        response.put("isFollowing", isFollowing);
        return ResponseEntity.ok(response);
    }

    /**
     * Get followers count
     * GET /api/follows/followers/count/{userId}
     */
    @GetMapping("/followers/count/{userId}")
    public ResponseEntity<Map<String, Long>> getFollowersCount(@PathVariable Long userId) {
        long count = followService.getFollowersCount(userId);
        Map<String, Long> response = new HashMap<>();
        response.put("count", count);
        return ResponseEntity.ok(response);
    }

    /**
     * Get following count
     * GET /api/follows/following/count/{userId}
     */
    @GetMapping("/following/count/{userId}")
    public ResponseEntity<Map<String, Long>> getFollowingCount(@PathVariable Long userId) {
        long count = followService.getFollowingCount(userId);
        Map<String, Long> response = new HashMap<>();
        response.put("count", count);
        return ResponseEntity.ok(response);
    }
}
