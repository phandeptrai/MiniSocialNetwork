package com.mini.socialnetwork.modules.user.repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.mini.socialnetwork.modules.user.entity.User;

public interface UserRepository extends JpaRepository<User, UUID> {

    /**
     * Find user by username
     */
    java.util.Optional<User> findByUsername(String username);

    /**
     * Find suggested users: all active users except the current user and users
     * already being followed
     */
    @Query("SELECT u FROM User u WHERE u.id != :userId AND u.id NOT IN :excludeIds")
    List<User> findSuggestedUsers(@Param("userId") UUID userId, @Param("excludeIds") List<UUID> excludeIds);

    /**
     * Find all users except the current user (when user follows no one yet)
     */
    @Query("SELECT u FROM User u WHERE u.id != :userId")
    List<User> findAllExceptUser(@Param("userId") UUID userId);

    Optional<User> findById(UUID id);
}
