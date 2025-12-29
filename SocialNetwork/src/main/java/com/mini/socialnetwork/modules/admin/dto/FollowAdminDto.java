package com.mini.socialnetwork.modules.admin.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO cho Follow relationship trong admin panel
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FollowAdminDto {
    private String followerId;
    private String followerName;
    private String followerUsername;
    private String followingId;
    private String followingName;
    private String followingUsername;
    private String createdAt;
}
