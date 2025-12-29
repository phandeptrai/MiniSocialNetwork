package com.mini.socialnetwork.modules.admin.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * DTO cho thống kê bài đăng theo thời gian
 * Dùng trong Admin Dashboard để vẽ biểu đồ
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PostStatisticsDto {
    private List<String> labels; // Danh sách ngày (format: "dd/MM")
    private List<Long> values; // Số lượng bài đăng tương ứng
    private long totalPosts; // Tổng số bài đăng trong khoảng thời gian
}
