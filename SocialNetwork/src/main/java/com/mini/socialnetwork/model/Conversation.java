package com.mini.socialnetwork.model;

import javax.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "conversations")
public class Conversation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ElementCollection
    @CollectionTable(name = "conversation_participants", joinColumns = @JoinColumn(name = "conversation_id"))
    @Column(name = "user_id")
    @Builder.Default
    private List<Long> participantIds = new ArrayList<>();

    @Column(length = 500)
    private String lastMessage;

    private LocalDateTime lastMessageAt;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;
}
