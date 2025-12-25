package com.mini.socialnetwork.dto;

import java.util.Map;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO cho User Profile.
 * Sử dụng String ID (Keycloak User ID)
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserProfileDto {
        private String id; // Keycloak user ID (String)
        private String name; // Full name (firstName + lastName từ Keycloak)
        private String username; // Username từ Keycloak
        private String email; // Email từ Keycloak
        private String avatarUrl; // Avatar URL (generated)
        private String bio; // Bio (không có trong Keycloak, để trống)
        private long followersCount;
        private long followingCount;
        private boolean isFollowing;
        private boolean followsYou;

        /**
         * Tạo UserProfileDto từ Keycloak user data
         */
        public static UserProfileDto fromKeycloakUser(
                        Map<String, Object> keycloakUser,
                        long followersCount,
                        long followingCount,
                        boolean isFollowing,
                        boolean followsYou) {

                String id = (String) keycloakUser.get("id");
                String username = (String) keycloakUser.get("username");
                String email = (String) keycloakUser.get("email");
                String firstName = (String) keycloakUser.getOrDefault("firstName", "");
                String lastName = (String) keycloakUser.getOrDefault("lastName", "");
                String fullName = (firstName + " " + lastName).trim();

                if (fullName.isEmpty()) {
                        fullName = username;
                }

                return UserProfileDto.builder()
                                .id(id)
                                .name(fullName)
                                .username("@" + username)
                                .email(email)
                                .avatarUrl("https://ui-avatars.com/api/?name=" + username
                                                + "&background=667eea&color=fff")
                                .bio("") // Keycloak không có bio
                                .followersCount(followersCount)
                                .followingCount(followingCount)
                                .isFollowing(isFollowing)
                                .followsYou(followsYou)
                                .build();
        }
}
