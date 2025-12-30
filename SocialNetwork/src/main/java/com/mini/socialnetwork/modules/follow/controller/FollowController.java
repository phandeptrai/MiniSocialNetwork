package com.mini.socialnetwork.modules.follow.controller;

import java.util.List;
import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.mini.socialnetwork.modules.follow.dto.UserProfileDto;
import com.mini.socialnetwork.modules.follow.service.FollowService;

import lombok.RequiredArgsConstructor;

/**
 * Controller xử lý Follow APIs.
 * Sử dụng Keycloak User ID (String) thay vì UUID
 */
@RestController
@RequestMapping("/api/follows")
@RequiredArgsConstructor
public class FollowController {

    private final FollowService followService;

    /**
     * Follow a user
     * POST /api/follows/{followingId}?followerId={followerId}
     */
    @PostMapping("/{followingId}")
    public ResponseEntity<Map<String, String>> followUser(
            @PathVariable String followingId,
            @RequestParam String followerId) {
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
            @PathVariable String followingId,
            @RequestParam String followerId) {
        followService.unfollowUser(followerId, followingId);
        return ResponseEntity.ok(Map.of("message", "Successfully unfollowed user"));
    }

    /**
     * Check follow status
     * GET /api/follows/status/{followingId}?followerId={followerId}
     */
    @GetMapping("/status/{followingId}")
    public ResponseEntity<Map<String, Boolean>> getFollowStatus(
            @PathVariable String followingId,
            @RequestParam String followerId) {
        boolean isFollowing = followService.isFollowing(followerId, followingId);
        return ResponseEntity.ok(Map.of("isFollowing", isFollowing));
    }

    /**
     * Get follower count for a user
     * GET /api/follows/count/followers/{userId}
     */
    @GetMapping("/count/followers/{userId}")
    public ResponseEntity<Map<String, Long>> getFollowerCount(@PathVariable String userId) {
        long count = followService.getFollowerCount(userId);
        return ResponseEntity.ok(Map.of("count", count));
    }

    /**
     * Get following count for a user
     * GET /api/follows/count/following/{userId}
     */
    @GetMapping("/count/following/{userId}")
    public ResponseEntity<Map<String, Long>> getFollowingCount(@PathVariable String userId) {
        long count = followService.getFollowingCount(userId);
        return ResponseEntity.ok(Map.of("count", count));
    }

    /**
     * Get list of followers for a user
     * GET /api/follows/followers/{userId}
     */
    @GetMapping("/followers/{userId}")
    public ResponseEntity<List<UserProfileDto>> getFollowers(@PathVariable String userId) {
        List<UserProfileDto> followers = followService.getFollowers(userId);
        return ResponseEntity.ok(followers);
    }

    /**
     * Get list of users that a user is following
     * GET /api/follows/following/{userId}
     */
    @GetMapping("/following/{userId}")
    public ResponseEntity<List<UserProfileDto>> getFollowing(@PathVariable String userId) {
        List<UserProfileDto> following = followService.getFollowing(userId);
        return ResponseEntity.ok(following);
    }

    /**
     * Get suggested users to follow (excluding self)
     * GET /api/follows/suggestions/{userId}
     */
    @GetMapping("/suggestions/{userId}")
    public ResponseEntity<List<UserProfileDto>> getSuggestions(@PathVariable String userId) {
        List<UserProfileDto> suggestions = followService.getSuggestions(userId);
        return ResponseEntity.ok(suggestions);
    }
}
