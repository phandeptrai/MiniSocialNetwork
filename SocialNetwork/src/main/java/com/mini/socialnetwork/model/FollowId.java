package com.mini.socialnetwork.model;

import java.io.Serializable;
import java.util.Objects;

import jakarta.persistence.Embeddable;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Composite Key cho Follow entity.
 * Sử dụng String để lưu Keycloak User ID (UUID dạng String)
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Embeddable
public class FollowId implements Serializable {
    private static final long serialVersionUID = 1L;

    private String followerId; // Keycloak user ID của người follow
    private String followingId; // Keycloak user ID của người được follow

    @Override
    public boolean equals(Object o) {
        if (this == o)
            return true;
        if (o == null || getClass() != o.getClass())
            return false;
        FollowId followId = (FollowId) o;
        return Objects.equals(followerId, followId.followerId) &&
                Objects.equals(followingId, followId.followingId);
    }

    @Override
    public int hashCode() {
        return Objects.hash(followerId, followingId);
    }
}
