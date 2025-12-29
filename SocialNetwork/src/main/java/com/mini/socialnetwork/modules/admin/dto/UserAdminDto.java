package com.mini.socialnetwork.modules.admin.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

/**
 * DTO cho User trong admin panel
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserAdminDto {
    private UUID id;
    private String username;
    private String email;
    private String name;
    private String bio;
    private String avatarUrl;
    private boolean isActive;
    private String createdAt;
    private String updatedAt;
    private int followersCount;
    private int followingCount;
}
