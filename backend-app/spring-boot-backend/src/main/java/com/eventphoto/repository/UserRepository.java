package com.eventphoto.repository;

import com.eventphoto.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Integer> {
    Optional<User> findByEmail(String email);

    boolean existsByEmail(String email);

    java.util.List<User> findByRoleName(String roleName);

    java.util.List<User> findByRoleNameAndCreatedById(String roleName, Integer adminId);

    long countByRoleName(String roleName);

    long countByRoleNameAndCreatedById(String roleName, Integer adminId);
}
