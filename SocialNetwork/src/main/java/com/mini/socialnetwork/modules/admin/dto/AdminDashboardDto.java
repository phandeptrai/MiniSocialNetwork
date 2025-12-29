package com.mini.socialnetwork.modules.admin.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO cho Dashboard thống kê admin
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminDashboardDto {
    private long totalUsers;
    private long totalPosts;
    private long totalComments;
    private long totalMessages;
    private long totalNotifications;
    private long totalConversations;
    private long totalFollows;
}
