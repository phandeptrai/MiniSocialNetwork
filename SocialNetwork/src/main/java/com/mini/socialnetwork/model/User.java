package com.mini.socialnetwork.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

/**
 * Entity đại diện cho người dùng trong hệ thống.
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

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

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
    private List<UUID> followers;

    @ElementCollection
    private List<UUID> following;

    private Instant createdAt;
    private Instant updatedAt;
    private boolean isActive;
}
