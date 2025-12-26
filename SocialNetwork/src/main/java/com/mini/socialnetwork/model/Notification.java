package com.mini.socialnetwork.model;

import java.time.Instant;
import java.util.UUID;

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
@Table(name = "notifications")
public class Notification {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    private UUID receiverId; // người nhận

    private UUID senderId; // người gây ra hành động

    private Type type; // LIKE, COMMENT, FOLLOW

    private UUID postId; // null nếu FOLLOW

    private String message; // "A đã thích bài viết của bạn"

    private boolean isRead;

    private Instant createdAt;

    public enum Type {
        LIKE,
        COMMENT,
        FOLLOW
    }
}
