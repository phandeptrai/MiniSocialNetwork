package com.mini.socialnetwork.controller;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.mini.socialnetwork.dto.UserProfileDto;
import com.mini.socialnetwork.model.User;
import com.mini.socialnetwork.repository.UserRepository;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserRepository userRepository;

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

    private final com.mini.socialnetwork.modules.auth.service.KeycloakAdminService keycloakAdminService;

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

            // Map Keycloak User to User model or DTO
            User user = new User();
            user.setId(UUID.fromString((String) keycloakUser.get("id")));
            user.setUsername((String) keycloakUser.get("username"));
            user.setEmail((String) keycloakUser.get("email"));
            user.setName(((String) keycloakUser.getOrDefault("firstName", "")) + " "
                    + ((String) keycloakUser.getOrDefault("lastName", "")));
            user.setBio("User from Keycloak"); // Keycloak attributes extraction needed for bio/avatar if stored there

            return ResponseEntity.ok(user);
        } catch (Exception e) {
            return ResponseEntity.notFound().build();
        }
    }
}
