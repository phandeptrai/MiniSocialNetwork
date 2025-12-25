package com.mini.socialnetwork.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import com.mini.socialnetwork.model.Follow;
import com.mini.socialnetwork.model.FollowId;

@Repository
public interface FollowRepository extends JpaRepository<Follow, FollowId> {

    boolean existsByFollowId_FollowerIdAndFollowId_FollowingId(Long followerId, Long followingId);

    @Modifying
    @Transactional
    void deleteByFollowId_FollowerIdAndFollowId_FollowingId(Long followerId, Long followingId);

    long countByFollowId_FollowingId(Long followingId);

    long countByFollowId_FollowerId(Long followerId);
}
