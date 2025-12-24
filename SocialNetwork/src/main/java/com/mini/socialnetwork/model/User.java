package com.mini.socialnetwork.model;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

import jakarta.persistence.ElementCollection;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

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
    private String username;
    private String email;
    private String password;
    private String name;
    private String bio;
    private String avatarUrl;

    @ElementCollection
    private List<String> roles;          // USER, ADMIN

    @ElementCollection
    private List<UUID> followers;    // userId

    @ElementCollection
    private List<UUID> following;    // userId

    private Instant createdAt;
    private Instant updatedAt;
    private boolean isActive;
}

