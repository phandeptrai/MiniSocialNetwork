package com.mini.socialnetwork.model;

import java.time.Instant;
import java.util.UUID;

import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
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

    private String senderName; // tên người gửi (để hiển thị notification)

    private String senderAvatarUrl; // avatar người gửi

    @Enumerated(EnumType.STRING)
    private Type type; // LIKE, COMMENT, FOLLOW, MESSAGE

    private UUID postId; // null nếu FOLLOW hoặc MESSAGE

    private String conversationId; // ID cuộc hội thoại (chỉ dùng cho MESSAGE)

    private String message; // "A đã thích bài viết của bạn" hoặc preview tin nhắn

    private boolean isRead;

    private Instant createdAt;

    public enum Type {
        LIKE,
        COMMENT,
        FOLLOW,
        MESSAGE
    }
}
