package com.mini.socialnetwork.service;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.mini.socialnetwork.model.Follow;
import com.mini.socialnetwork.model.FollowId;
import com.mini.socialnetwork.repository.FollowRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class FollowService {

    private final FollowRepository followRepository;

    @Transactional
    public void followUser(Long followerId, Long followingId) {
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

    @Transactional
    public void unfollowUser(Long followerId, Long followingId) {
        followRepository.deleteByFollowId_FollowerIdAndFollowId_FollowingId(followerId, followingId);
    }

    public boolean isFollowing(Long followerId, Long followingId) {
        return followRepository.existsByFollowId_FollowerIdAndFollowId_FollowingId(followerId, followingId);
    }

    public long getFollowerCount(Long userId) {
        return followRepository.countByFollowId_FollowingId(userId);
    }

    public long getFollowingCount(Long userId) {
        return followRepository.countByFollowId_FollowerId(userId);
    }
}
