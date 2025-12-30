package com.mini.socialnetwork.modules.user.controller;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import com.mini.socialnetwork.modules.user.dto.UpdateProfileRequest;
import com.mini.socialnetwork.modules.user.entity.User;
import com.mini.socialnetwork.modules.user.repository.UserRepository;
import com.mini.socialnetwork.modules.user.service.UserProfileService;
import com.mini.socialnetwork.modules.auth.service.KeycloakAdminService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
@Slf4j
public class UserController {

    private final UserRepository userRepository;
    private final UserProfileService userProfileService;
    private final KeycloakAdminService keycloakAdminService;

    /**
     * Get current user's profile
     * GET /api/users/me
     */
    @GetMapping("/me")
    public ResponseEntity<?> getCurrentUserProfile(@AuthenticationPrincipal Jwt jwt) {
        if (jwt == null) {
            return ResponseEntity.status(401).body("Unauthorized");
        }

        String keycloakId = jwt.getSubject();
        String username = jwt.getClaimAsString("preferred_username");
        String email = jwt.getClaimAsString("email");
        String name = jwt.getClaimAsString("name");

        if (username == null) {
            return ResponseEntity.badRequest().body("Username not found in token");
        }

        User user = userProfileService.getOrCreateProfile(keycloakId, username, email, name);
        return ResponseEntity.ok(user);
    }

    /**
     * Update current user's profile
     * PUT /api/users/me
     */
    @PutMapping("/me")
    public ResponseEntity<?> updateCurrentUserProfile(
            @AuthenticationPrincipal Jwt jwt,
            @RequestBody UpdateProfileRequest request) {
        if (jwt == null) {
            return ResponseEntity.status(401).body("Unauthorized");
        }

        String keycloakId = jwt.getSubject();
        log.info("Updating profile for user with Keycloak ID: {}", keycloakId);
        String username = jwt.getClaimAsString("preferred_username");
        String email = jwt.getClaimAsString("email");

        if (username == null) {
            return ResponseEntity.badRequest().body("Username not found in token");
        }

        try {
            User updatedUser = userProfileService.updateProfile(keycloakId, username, email, request);
            return ResponseEntity.ok(updatedUser);
        } catch (RuntimeException e) {
            return ResponseEntity.status(500).body("Error updating profile: " + e.getMessage());
        }
    }

    /**
     * Get all users (for debugging)
     * GET /api/users
     */
    @GetMapping
    public ResponseEntity<List<User>> getAllUsers() {
        List<User> users = userRepository.findAll();
        return ResponseEntity.ok(users);
    }

    /**
     * Get user count
     * GET /api/users/count
     */
    @GetMapping("/count")
    public ResponseEntity<Long> getUserCount() {
        long count = userRepository.count();
        return ResponseEntity.ok(count);
    }

    /**
     * Create a test user
     * POST /api/users/test
     */
    @PostMapping("/test")
    public ResponseEntity<User> createTestUser() {
        User testUser = User.builder()
                .username("testuser_" + System.currentTimeMillis())
                .email("test" + System.currentTimeMillis() + "@example.com")
                .name("Test User")
                .bio("This is a test user")
                .isActive(true)
                .build();
        User savedUser = userRepository.save(testUser);
        return ResponseEntity.ok(savedUser);
    }

    /**
     * Get user by ID (Fetched from Keycloak)
     * GET /api/users/{id}
     */
    @GetMapping("/{id}")
    public ResponseEntity<?> getUserById(@PathVariable String id) {
        try {
            java.util.Map<String, Object> keycloakUser = keycloakAdminService.getUserById(id);

            if (keycloakUser == null) {
                return ResponseEntity.notFound().build();
            }

            Optional<User> localUserOpt = userRepository.findById(UUID.fromString(id));

            // Map Keycloak User to User model or DTO
            User user = new User();
            user.setId(UUID.fromString((String) keycloakUser.get("id")));
            user.setUsername((String) keycloakUser.get("username"));
            user.setEmail((String) keycloakUser.get("email"));
            user.setName(((String) keycloakUser.getOrDefault("firstName", "")) + " "
                    + ((String) keycloakUser.getOrDefault("lastName", "")));
            user.setBio(localUserOpt.isPresent() ? localUserOpt.get().getBio() : "");
            user.setAvatarUrl(localUserOpt.isPresent() ? localUserOpt.get().getAvatarUrl() : null);

            return ResponseEntity.ok(user);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.notFound().build();
        }
    }
}
