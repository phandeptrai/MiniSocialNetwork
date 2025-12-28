package com.mini.socialnetwork.modules.post.entity;

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
@Table(name = "posts")
public class Post {
    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    private UUID authorId; // User
    private String content;

    @ElementCollection
    private List<String> imageUrls; // up to 4 images

    @ElementCollection
    private List<UUID> likes;

    private int likeCount;
    private int commentCount;
    private Instant createdAt;
    private Instant updatedAt;
    private boolean isDeleted;
}
