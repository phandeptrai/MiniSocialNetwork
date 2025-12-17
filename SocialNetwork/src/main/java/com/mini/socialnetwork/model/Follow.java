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
@Table(name = "user_follows")
public class Follow {

    @EmbeddedId
    private FollowId id;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    // Convenience getters for accessing composite key fields
    public Long getFollowerId() {
        return id != null ? id.getFollowerId() : null;
    }

    public Long getFollowingId() {
        return id != null ? id.getFollowingId() : null;
    }
}
