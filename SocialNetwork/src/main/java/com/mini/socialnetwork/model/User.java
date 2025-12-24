package com.mini.socialnetwork.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.List;

/**
 * Entity đại diện cho người dùng trong hệ thống.
 * <p>
 * Lớp này ánh xạ đến bảng "users" trong database và lưu trữ thông tin
 * cơ bản của người dùng. ID được đồng bộ từ Keycloak (UUID dạng String)
 * thay vì auto-generate.
 * </p>
 *
 * <h2>Quan hệ với các entity khác:</h2>
 * <ul>
 * <li>Conversation: User tham gia các cuộc hội thoại qua participantIds</li>
 * <li>Message: User là sender của các tin nhắn qua senderId</li>
 * </ul>
 *
 * <h2>Đồng bộ với Keycloak:</h2>
 * <p>
 * User được tạo/cập nhật khi đăng nhập qua Keycloak. ID là subject (sub)
 * từ JWT token, đảm bảo tính nhất quán giữa xác thực và dữ liệu.
 * </p>
 *
 * @author MiniSocialNetwork Team
 * @version 1.0
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "users")
public class User {

    /**
     * ID duy nhất của người dùng.
     * <p>
     * Được lấy từ claim "sub" trong JWT token của Keycloak.
     * Không sử dụng auto-generate để đảm bảo đồng bộ với identity provider.
     * </p>
     */
    @Id
    private String id;

    /**
     * Tên đăng nhập của người dùng.
     * <p>
     * Phải là duy nhất trong hệ thống. Giới hạn 50 ký tự.
     * Được hiển thị trong giao diện chat và danh sách liên hệ.
     * </p>
     */
    @Column(nullable = false, unique = true, length = 50)
    private String username;

    @Column(unique = true)
    private String email;

    private String name;
    private String bio;
    private String avatarUrl;

    @ElementCollection
    private List<String> roles;

    @ElementCollection
    private List<String> followers;

    @ElementCollection
    private List<String> following;

    private Instant createdAt;
    private Instant updatedAt;
    private boolean isActive;
}
