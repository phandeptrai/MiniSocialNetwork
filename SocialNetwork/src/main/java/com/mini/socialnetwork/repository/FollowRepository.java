package com.mini.socialnetwork.repository;

import com.mini.socialnetwork.model.Follow;
import com.mini.socialnetwork.model.FollowId;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface FollowRepository extends JpaRepository<Follow, FollowId> {

    /**
     * Delete a follow relationship by followerId and followingId (Unfollow)
     */
    void deleteById_FollowerIdAndId_FollowingId(Long followerId, Long followingId);

    /**
     * Check if a follow relationship exists between two users
     */
    boolean existsById_FollowerIdAndId_FollowingId(Long followerId, Long followingId);

    /**
     * Get all followers of a user
     */
    List<Follow> findById_FollowingId(Long followingId);

    /**
     * Get all users that a user is following
     */
    List<Follow> findById_FollowerId(Long followerId);

    /**
     * Count followers of a user
     */
    long countById_FollowingId(Long followingId);

    /**
     * Count following of a user
     */
    long countById_FollowerId(Long followerId);
}
