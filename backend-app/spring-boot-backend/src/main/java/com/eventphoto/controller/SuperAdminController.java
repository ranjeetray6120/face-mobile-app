package com.eventphoto.controller;

import com.eventphoto.dto.CreateUserRequest;
import com.eventphoto.entity.User;
import com.eventphoto.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/super-admin")
@RequiredArgsConstructor
public class SuperAdminController {

    private final AuthService authService;

    @PostMapping("/admins")
    public ResponseEntity<User> createAdmin(@Valid @RequestBody CreateUserRequest request) {
        User admin = authService.createUser(request, "ADMIN", null);
        return ResponseEntity.status(HttpStatus.CREATED).body(admin);
    }
}
