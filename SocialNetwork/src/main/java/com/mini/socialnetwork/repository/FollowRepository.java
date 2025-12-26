package com.mini.socialnetwork.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import com.mini.socialnetwork.model.Follow;
import com.mini.socialnetwork.model.FollowId;

/**
 * Repository cho Follow entity.
 * Sử dụng String (Keycloak User ID) thay vì UUID
 */
@Repository
public interface FollowRepository extends JpaRepository<Follow, FollowId> {

    boolean existsByFollowId_FollowerIdAndFollowId_FollowingId(String followerId, String followingId);

    @Modifying
    @Transactional
    void deleteByFollowId_FollowerIdAndFollowId_FollowingId(String followerId, String followingId);

    long countByFollowId_FollowingId(String followingId);

    long countByFollowId_FollowerId(String followerId);

    // Get list of follower IDs for a user
    @Query("SELECT f.followId.followerId FROM Follow f WHERE f.followId.followingId = :userId")
    List<String> findFollowerIdsByUserId(@Param("userId") String userId);

    // Get list of following IDs for a user
    @Query("SELECT f.followId.followingId FROM Follow f WHERE f.followId.followerId = :userId")
    List<String> findFollowingIdsByUserId(@Param("userId") String userId);
}
