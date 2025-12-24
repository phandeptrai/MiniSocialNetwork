package com.mini.socialnetwork.repository;

import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import com.mini.socialnetwork.model.User;

public interface UserRepository extends JpaRepository<User, UUID> {
}

