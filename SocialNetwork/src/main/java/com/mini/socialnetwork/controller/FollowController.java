package com.mini.socialnetwork.controller;

import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.mini.socialnetwork.service.FollowService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/follows")
@RequiredArgsConstructor
public class FollowController {

    private final FollowService followService;

    /**
     * Follow a user
     * POST /api/follows/{followingId}?followerId={followerId}
     * Note: In production, followerId should come from authenticated Principal
     */
    @PostMapping("/{followingId}")
    public ResponseEntity<Map<String, String>> followUser(
            @PathVariable Long followingId,
            @RequestParam Long followerId) {
        try {
            followService.followUser(followerId, followingId);
            return ResponseEntity.ok(Map.of("message", "Successfully followed user"));
        } catch (IllegalArgumentException | IllegalStateException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Unfollow a user
     * DELETE /api/follows/{followingId}?followerId={followerId}
     */
    @DeleteMapping("/{followingId}")
    public ResponseEntity<Map<String, String>> unfollowUser(
            @PathVariable Long followingId,
            @RequestParam Long followerId) {
        followService.unfollowUser(followerId, followingId);
        return ResponseEntity.ok(Map.of("message", "Successfully unfollowed user"));
    }

    /**
     * Check follow status
     * GET /api/follows/status/{followingId}?followerId={followerId}
     */
    @GetMapping("/status/{followingId}")
    public ResponseEntity<Map<String, Boolean>> getFollowStatus(
            @PathVariable Long followingId,
            @RequestParam Long followerId) {
        boolean isFollowing = followService.isFollowing(followerId, followingId);
        return ResponseEntity.ok(Map.of("isFollowing", isFollowing));
    }

    /**
     * Get follower count for a user
     * GET /api/follows/count/followers/{userId}
     */
    @GetMapping("/count/followers/{userId}")
    public ResponseEntity<Map<String, Long>> getFollowerCount(@PathVariable Long userId) {
        long count = followService.getFollowerCount(userId);
        return ResponseEntity.ok(Map.of("count", count));
    }

    /**
     * Get following count for a user
     * GET /api/follows/count/following/{userId}
     */
    @GetMapping("/count/following/{userId}")
    public ResponseEntity<Map<String, Long>> getFollowingCount(@PathVariable Long userId) {
        long count = followService.getFollowingCount(userId);
        return ResponseEntity.ok(Map.of("count", count));
    }
}
