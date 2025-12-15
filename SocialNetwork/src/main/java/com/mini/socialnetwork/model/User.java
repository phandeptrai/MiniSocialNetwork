package com.mini.socialnetwork.model;

import java.util.Date;
import java.util.List;

import org.bson.types.ObjectId;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class User {
    private ObjectId id;
    private String username;
    private String email;
    private String password;
    private String name;
    private String bio;
    private String avatarUrl;
    private List<String> roles;          // USER, ADMIN
    private List<ObjectId> followers;    // userId
    private List<ObjectId> following;    // userId
    private Date createdAt;
    private Date updatedAt;
    private boolean isActive;
}

