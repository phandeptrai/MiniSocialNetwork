package com.mini.socialnetwork.modules.comment.repository;

import java.util.List;
import java.util.UUID;

import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Slice;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.transaction.annotation.Transactional;

import com.mini.socialnetwork.modules.comment.entity.Comment;

public interface CommentRepository extends JpaRepository<Comment, UUID> {

    // Find comments by postId (not deleted)
    Slice<Comment> findByPostIdAndIsDeletedFalseOrderByCreatedAtDesc(UUID postId, Pageable pageable);

    // Count comments by postId (not deleted)
    long countByPostIdAndIsDeletedFalse(UUID postId);

    // Find all comments by userId
    List<Comment> findByUserIdAndIsDeletedFalse(UUID userId);

    @Modifying
    @Transactional
    void deleteByPostId(UUID postId);

    @Modifying
    @Transactional
    void deleteByUserId(UUID userId);
}
