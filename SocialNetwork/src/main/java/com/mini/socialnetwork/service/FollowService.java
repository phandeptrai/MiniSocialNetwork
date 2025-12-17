package com.mini.socialnetwork.service;

import com.mini.socialnetwork.model.Follow;
import com.mini.socialnetwork.model.FollowId;
import com.mini.socialnetwork.repository.FollowRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class FollowService {

    private final FollowRepository followRepository;

    /**
     * Create a new follow relationship
     */
    @Transactional
    public Follow follow(Long followerId, Long followingId) {
        // Prevent self-follow
        if (followerId.equals(followingId)) {
            throw new IllegalArgumentException("Users cannot follow themselves");
        }

        // Check if already following
        if (isFollowing(followerId, followingId)) {
            throw new IllegalArgumentException("Already following this user");
        }

        FollowId id = new FollowId(followerId, followingId);
        Follow follow = Follow.builder()
                .id(id)
                .build();

        return followRepository.save(follow);
    }

    /**
     * Remove a follow relationship (Unfollow)
     */
    @Transactional
    public void unfollow(Long followerId, Long followingId) {
        FollowId id = new FollowId(followerId, followingId);
        if (!followRepository.existsById(id)) {
            throw new IllegalArgumentException("Follow relationship does not exist");
        }
        followRepository.deleteById(id);
    }

    /**
     * Check if a user is following another user
     */
    public boolean isFollowing(Long followerId, Long followingId) {
        return followRepository.existsById_FollowerIdAndId_FollowingId(followerId, followingId);
    }

    /**
     * Get all followers of a user
     */
    public List<Follow> getFollowers(Long userId) {
        return followRepository.findById_FollowingId(userId);
    }

    /**
     * Get all users that a user is following
     */
    public List<Follow> getFollowing(Long userId) {
        return followRepository.findById_FollowerId(userId);
    }

    /**
     * Count followers
     */
    public long getFollowersCount(Long userId) {
        return followRepository.countById_FollowingId(userId);
    }

    /**
     * Count following
     */
    public long getFollowingCount(Long userId) {
        return followRepository.countById_FollowerId(userId);
    }
}
