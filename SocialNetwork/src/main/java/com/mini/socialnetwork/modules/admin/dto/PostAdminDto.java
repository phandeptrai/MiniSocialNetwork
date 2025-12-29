package com.mini.socialnetwork.modules.admin.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

/**
 * DTO cho Post trong admin panel
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PostAdminDto {
    private UUID id;
    private UUID authorId;
    private String authorName;
    private String authorUsername;
    private String content;
    private int likeCount;
    private int commentCount;
    private boolean isDeleted;
    private String createdAt;
    private String updatedAt;
}
