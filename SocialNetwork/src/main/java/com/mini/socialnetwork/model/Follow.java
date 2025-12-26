package com.mini.socialnetwork.model;

import java.time.LocalDateTime;

import org.hibernate.annotations.CreationTimestamp;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "user_follows")
public class Follow {
    @EmbeddedId
    private FollowId followId;

    @CreationTimestamp
    private LocalDateTime createdAt;
}
