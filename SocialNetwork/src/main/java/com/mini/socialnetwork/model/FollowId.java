package com.mini.socialnetwork.model;

import java.io.Serializable;
import java.util.Objects;

import javax.persistence.Embeddable;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Embeddable
public class FollowId implements Serializable {
    private static final long serialVersionUID = 1L;

    private Long followerId;
    private Long followingId;

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
