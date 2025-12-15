package com.mini.socialnetwork.modules.chat.entity;

import jakarta.persistence.*;
import lombok.Builder;
import lombok.Data;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Data
@Builder
@Entity
@Table(name = "messages")
@EntityListeners(AuditingEntityListener.class)
public class Message {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long conversationId; 
    private String senderId;
    
    @Column(columnDefinition = "TEXT")
    private String content;

    @Enumerated(EnumType.STRING)
    private Message.MessageType messageType;

    @Builder.Default
    @OneToMany(cascade = CascadeType.ALL, mappedBy = "message", orphanRemoval = true)
    private List<Attachment> attachments = new ArrayList<>();

    @Builder.Default
    private boolean isDeleted = false;

    @CreatedDate
    @Column(nullable = false, updatable = false)
    private Instant createdAt;

    public enum MessageType { TEXT, IMAGE, FILE, ATTACHMENT }

    @Data
    @Builder
    @Entity
    @Table(name = "attachments")
    public static class Attachment {
        @Id
        @GeneratedValue(strategy = GenerationType.IDENTITY)
        private Long id;

        private String fileName;
        private String objectKey;
        private String fileType;
        private long fileSize;

        @Transient 
        private String fileUrl;

        @ManyToOne(fetch = FetchType.LAZY)
        @JoinColumn(name = "message_id")
        private Message message;
    }
}