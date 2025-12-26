package com.mini.socialnetwork.service;

import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.mini.socialnetwork.dto.UserProfileDto;
import com.mini.socialnetwork.model.Follow;
import com.mini.socialnetwork.model.FollowId;
import com.mini.socialnetwork.modules.auth.service.KeycloakAdminService;
import com.mini.socialnetwork.repository.FollowRepository;

import lombok.RequiredArgsConstructor;

/**
 * Service xử lý logic Follow.
 * Sử dụng Keycloak User ID (String) thay vì UUID
 */
@Service
@RequiredArgsConstructor
public class FollowService {

    private final FollowRepository followRepository;
    private final KeycloakAdminService keycloakAdminService;

    /**
     * Follow một user
     */
    @Transactional
    public void followUser(String followerId, String followingId) {
        if (followerId.equals(followingId)) {
            throw new IllegalArgumentException("Cannot follow yourself");
        }

        if (isFollowing(followerId, followingId)) {
            throw new IllegalStateException("Already following this user");
        }

        FollowId followId = new FollowId(followerId, followingId);
        Follow follow = Follow.builder()
                .followId(followId)
                .build();
        followRepository.save(follow);
    }

    /**
     * Unfollow một user
     */
    @Transactional
    public void unfollowUser(String followerId, String followingId) {
        followRepository.deleteByFollowId_FollowerIdAndFollowId_FollowingId(followerId, followingId);
    }

    /**
     * Kiểm tra user có đang follow không
     */
    public boolean isFollowing(String followerId, String followingId) {
        return followRepository.existsByFollowId_FollowerIdAndFollowId_FollowingId(followerId, followingId);
    }

    /**
     * Đếm số followers của một user
     */
    public long getFollowerCount(String userId) {
        return followRepository.countByFollowId_FollowingId(userId);
    }

    /**
     * Đếm số users mà user đang follow
     */
    public long getFollowingCount(String userId) {
        return followRepository.countByFollowId_FollowerId(userId);
    }

    /**
     * Lấy danh sách followers của một user
     */
    public List<UserProfileDto> getFollowers(String userId) {
        // Lấy danh sách follower IDs từ database
        List<String> followerIds = followRepository.findFollowerIdsByUserId(userId);

        if (followerIds.isEmpty()) {
            return Collections.emptyList();
        }

        // Lấy thông tin users từ Keycloak
        List<Map<String, Object>> keycloakUsers = keycloakAdminService.getUsersByIds(followerIds);

        return keycloakUsers.stream()
                .map(keycloakUser -> {
                    String id = (String) keycloakUser.get("id");
                    long followersCount = getFollowerCount(id);
                    long followingCount = getFollowingCount(id);
                    boolean isFollowing = isFollowing(userId, id); // Current user follows them?
                    boolean followsYou = true; // They are in followers list
                    return UserProfileDto.fromKeycloakUser(keycloakUser, followersCount, followingCount, isFollowing,
                            followsYou);
                })
                .collect(Collectors.toList());
    }

    /**
     * Lấy danh sách users mà user đang follow
     */
    public List<UserProfileDto> getFollowing(String userId) {
        // Lấy danh sách following IDs từ database
        List<String> followingIds = followRepository.findFollowingIdsByUserId(userId);

        if (followingIds.isEmpty()) {
            return Collections.emptyList();
        }

        // Lấy thông tin users từ Keycloak
        List<Map<String, Object>> keycloakUsers = keycloakAdminService.getUsersByIds(followingIds);

        return keycloakUsers.stream()
                .map(keycloakUser -> {
                    String id = (String) keycloakUser.get("id");
                    long followersCount = getFollowerCount(id);
                    long followingCount = getFollowingCount(id);
                    boolean isFollowing = true; // Current user follows them
                    boolean followsYou = isFollowing(id, userId); // They follow current user?
                    return UserProfileDto.fromKeycloakUser(keycloakUser, followersCount, followingCount, isFollowing,
                            followsYou);
                })
                .collect(Collectors.toList());
    }

    /**
     * Lấy danh sách gợi ý users để follow
     * Loại bỏ: bản thân và các user đã follow
     */
    public List<UserProfileDto> getSuggestions(String userId) {
        // Lấy danh sách user IDs mà current user đang follow
        List<String> followingIds = followRepository.findFollowingIdsByUserId(userId);

        // Lấy tất cả users từ Keycloak
        List<Map<String, Object>> allUsers = keycloakAdminService.getAllUsers();

        return allUsers.stream()
                .filter(user -> {
                    String id = (String) user.get("id");
                    // Loại bỏ bản thân
                    if (userId.equals(id)) {
                        return false;
                    }
                    // Loại bỏ các user đã follow
                    if (followingIds.contains(id)) {
                        return false;
                    }
                    return true;
                })
                .map(keycloakUser -> {
                    String id = (String) keycloakUser.get("id");
                    long followersCount = getFollowerCount(id);
                    long followingCount = getFollowingCount(id);
                    boolean isFollowing = false; // Đã loại bỏ các user đang follow rồi
                    boolean followsYou = isFollowing(id, userId); // They follow current user?
                    return UserProfileDto.fromKeycloakUser(keycloakUser, followersCount, followingCount, isFollowing,
                            followsYou);
                })
                .collect(Collectors.toList());
    }
}
