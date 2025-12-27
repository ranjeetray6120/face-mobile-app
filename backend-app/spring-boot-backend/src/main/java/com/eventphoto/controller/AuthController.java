package com.eventphoto.controller;

import com.eventphoto.dto.LoginRequest;
import com.eventphoto.dto.LoginResponse;
import com.eventphoto.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(@Valid @RequestBody LoginRequest request) {
        System.out.println("Login request received for: " + request.getEmail());
        LoginResponse response = authService.login(request);
        System.out.println("Login successful, returning token for: " + response.getEmail());
        return ResponseEntity.ok(response);
    }

    @PostMapping("/register")
    public ResponseEntity<com.eventphoto.entity.User> register(
            @Valid @RequestBody com.eventphoto.dto.CreateUserRequest request) {
        String role = (request.getRole() != null && !request.getRole().isEmpty()) ? request.getRole() : "PHOTOGRAPHER";
        com.eventphoto.entity.User user = authService.createUser(request, role, null);
        return ResponseEntity.status(HttpStatus.CREATED).body(user);
    }

    @GetMapping("/health")
    public ResponseEntity<String> health() {
        return ResponseEntity.ok("Backend is running");
    }
}
