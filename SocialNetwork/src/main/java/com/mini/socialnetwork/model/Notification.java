package com.mini.socialnetwork.model;

import javax.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "notifications")
public class Notification {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "receiver_id", nullable = false)
    private Long receiverId;

    @Column(name = "sender_id", nullable = false)
    private Long senderId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Type type;

    @Column(name = "post_id")
    private Long postId;

    @Builder.Default
    private boolean isRead = false;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;

    public enum Type {
        LIKE,
        COMMENT,
        FOLLOW
    }
}
