package com.mini.socialnetwork.modules.follow.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import com.mini.socialnetwork.modules.follow.entity.Follow;
import com.mini.socialnetwork.modules.follow.entity.FollowId;

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

    /**
     * Xóa tất cả follows mà user là follower
     */
    @Modifying
    @Transactional
    void deleteByFollowId_FollowerId(String followerId);

    /**
     * Xóa tất cả follows mà user là following (người được follow)
     */
    @Modifying
    @Transactional
    void deleteByFollowId_FollowingId(String followingId);

    /**
     * Get extended following IDs (F1 + F2 + F3) using Recursive CTE.
     * Uses Depth-Limited Search algorithm:
     * - F1: Direct follows (depth = 1)
     * - F2: Follows of F1 (depth = 2)
     * - F3: Follows of F2 (depth = 3)
     * 
     * Complexity: O(k + k² + k³) where k = average follows per user
     */
    @Query(value = """
            WITH RECURSIVE extended_following AS (
                -- Depth 1: F1 (direct follows)
                SELECT following_id, 1 AS depth
                FROM user_follows
                WHERE follower_id = :userId

                UNION ALL

                -- Depth 2-3: F2, F3
                SELECT uf.following_id, ef.depth + 1
                FROM user_follows uf
                JOIN extended_following ef
                  ON uf.follower_id = ef.following_id
                WHERE ef.depth < 3
                  AND uf.following_id != :userId
            )
            SELECT DISTINCT following_id
            FROM extended_following
            WHERE following_id != :userId
            """, nativeQuery = true)
    List<String> findExtendedFollowingIds(@Param("userId") String userId);
}
