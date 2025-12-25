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
}
