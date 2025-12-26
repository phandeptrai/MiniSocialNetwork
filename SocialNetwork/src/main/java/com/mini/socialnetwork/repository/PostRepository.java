package com.mini.socialnetwork.repository;

import java.util.List;
import java.util.UUID;

import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Slice;
import org.springframework.data.jpa.repository.JpaRepository;

import com.mini.socialnetwork.model.Post;

public interface PostRepository extends JpaRepository<Post, UUID> {
    List<Post> findByAuthorId(UUID authorId);
    Slice<Post> findByAuthorId(UUID authorId, Pageable pageable);
    Slice<Post> findByAuthorIdIn(List<UUID> authorIds, Pageable pageable);
}

