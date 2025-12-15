package com.mini.socialnetwork.modules.chat.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;
import java.time.Instant;
import java.util.Set;

@Data
@Entity
@Builder
@Table(name = "conversations")
@EntityListeners(AuditingEntityListener.class)
@NoArgsConstructor
@AllArgsConstructor
public class Conversation {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id; 

    private String name;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "conversation_participants", joinColumns = @JoinColumn(name = "conversation_id"))
    @Column(name = "user_id")
    private Set<String> participantIds;

    @Enumerated(EnumType.STRING)
    private ConversationType type;

    private String createdBy;

    @LastModifiedDate
    private Instant updatedAt;

    @CreatedDate
    @Column(nullable = false, updatable = false)
    private Instant createdAt;

    private String lastMessageContent;
    private String lastMessageSenderId;
    
    @Enumerated(EnumType.STRING)
    private Message.MessageType lastMessageType;

    public enum ConversationType {
        ONE_TO_ONE, GROUP
    }
}


