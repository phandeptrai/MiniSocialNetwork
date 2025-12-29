package com.mini.socialnetwork.modules.post.repository;

import java.util.List;
import java.util.UUID;

import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Slice;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.transaction.annotation.Transactional;

import com.mini.socialnetwork.modules.post.entity.Post;

public interface PostRepository extends JpaRepository<Post, UUID> {
    List<Post> findByAuthorIdAndIsDeletedFalse(UUID authorId);

    Slice<Post> findByAuthorIdAndIsDeletedFalse(UUID authorId, Pageable pageable);

    Slice<Post> findByAuthorIdInAndIsDeletedFalse(List<UUID> authorIds, Pageable pageable);

    List<Post> findByAuthorId(UUID authorId);

    @Modifying
    @Transactional
    void deleteByAuthorId(UUID authorId);
}
