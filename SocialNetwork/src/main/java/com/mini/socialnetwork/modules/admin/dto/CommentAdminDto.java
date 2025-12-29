package com.mini.socialnetwork.modules.admin.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

/**
 * DTO cho Comment trong admin panel
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CommentAdminDto {
    private UUID id;
    private UUID postId;
    private UUID userId;
    private String userName;
    private String userUsername;
    private String content;
    private String imageUrl;
    private boolean isDeleted;
    private String createdAt;
    private String updatedAt;
}
