package com.mini.socialnetwork.modules.post.repository;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Slice;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;

import com.mini.socialnetwork.modules.post.entity.Post;

public interface PostRepository extends JpaRepository<Post, UUID> {
        // Count only non-deleted posts for dashboard statistics
        long countByIsDeletedFalse();

        List<Post> findByAuthorIdAndIsDeletedFalse(UUID authorId);

        Slice<Post> findByAuthorIdAndIsDeletedFalse(UUID authorId, Pageable pageable);

        Slice<Post> findByAuthorIdInAndIsDeletedFalse(List<UUID> authorIds, Pageable pageable);

        List<Post> findByAuthorId(UUID authorId);

        @Modifying
        @Transactional
        void deleteByAuthorId(UUID authorId);

        /**
         * Đếm số bài đăng theo ngày trong khoảng thời gian
         * Trả về danh sách [date, count] để vẽ biểu đồ thống kê
         */
        @Query("SELECT FUNCTION('DATE', p.createdAt) as date, COUNT(p) as count " +
                        "FROM Post p WHERE p.createdAt >= :startDate AND p.createdAt <= :endDate " +
                        "AND p.isDeleted = false " +
                        "GROUP BY FUNCTION('DATE', p.createdAt) ORDER BY date ASC")
        List<Object[]> countPostsByDateRange(@Param("startDate") Instant startDate,
                        @Param("endDate") Instant endDate);
}
