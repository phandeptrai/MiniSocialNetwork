package com.mini.socialnetwork.service;

import com.mini.socialnetwork.dto.UpdateProfileRequest;
import com.mini.socialnetwork.model.User;
import com.mini.socialnetwork.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

/**
 * Service xử lý logic cho User Profile
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class UserProfileService {

    private final UserRepository userRepository;

    /**
     * Lấy profile theo username, nếu chưa có thì tạo mới
     */
    @Transactional
    public User getOrCreateProfile(String keycloakId, String username, String email, String name) {
        Optional<User> existingUser = userRepository.findByUsername(username);

        if (existingUser.isPresent()) {
            return existingUser.get();
        }

        // Tạo user mới nếu chưa tồn tại
        User newUser = User.builder()
                .id(UUID.fromString(keycloakId))
                .username(username)
                .email(email)
                .name(name != null ? name : username)
                .bio("")
                .avatarUrl("https://ui-avatars.com/api/?name=" + username + "&background=667eea&color=fff")
                .isActive(true)
                .createdAt(Instant.now())
                .updatedAt(Instant.now())
                .build();

        return userRepository.save(newUser);
    }

    /**
     * Lấy profile theo username
     */
    public Optional<User> getProfileByUsername(String username) {
        return userRepository.findByUsername(username);
    }

    /**
     * Lấy profile theo ID
     */
    public Optional<User> getProfileById(UUID id) {
        return userRepository.findById(id);
    }

    /**
     * Cập nhật profile - tạo mới nếu chưa tồn tại
     */
    @Transactional
    public User updateProfile(String keycloakId, String username, String email, UpdateProfileRequest request) {
        // Tìm hoặc tạo user
        User user = userRepository.findByUsername(username)
                .orElseGet(() -> {
                    // Tạo user mới nếu chưa tồn tại
                    User newUser = User.builder()
                            .id(UUID.fromString(keycloakId))
                            .username(username)
                            .email(email)
                            .name(username)
                            .bio("")
                            .avatarUrl("https://ui-avatars.com/api/?name=" + username + "&background=667eea&color=fff")
                            .isActive(true)
                            .createdAt(Instant.now())
                            .updatedAt(Instant.now())
                            .build();
                    return userRepository.save(newUser);
                });

        // Cập nhật các trường
        if (request.getName() != null && !request.getName().isBlank()) {
            user.setName(request.getName());
        }
        if (request.getBio() != null) {
            user.setBio(request.getBio());
        }
        if (request.getAvatarUrl() != null && !request.getAvatarUrl().isBlank()) {
            user.setAvatarUrl(request.getAvatarUrl());
        }

        user.setUpdatedAt(Instant.now());

        log.info("Updating profile for user {}: id={}, name={}, bio={}, avatarUrl={}",
                username, user.getId(), user.getName(), user.getBio(), user.getAvatarUrl());

        return userRepository.save(user);
    }
}
