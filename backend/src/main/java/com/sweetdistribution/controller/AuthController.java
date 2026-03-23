package com.sweetdistribution.controller;

import com.sweetdistribution.model.dto.ApiResponse;
import com.sweetdistribution.model.dto.AuthResponse;
import com.sweetdistribution.model.dto.LoginRequest;
import com.sweetdistribution.model.dto.RegisterRequest;
import com.sweetdistribution.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@Slf4j
public class AuthController {

    private final AuthService authService;

    @PostMapping("/register")
    public ResponseEntity<ApiResponse<AuthResponse>> register(@Valid @RequestBody RegisterRequest request) {
        log.info("Registration request for email: {}", request.email());
        AuthResponse response = authService.register(request);
        log.info("Registration successful for email: {}", request.email());
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Registration successful", response));
    }

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<AuthResponse>> login(@Valid @RequestBody LoginRequest request) {
        log.info("Login attempt for email: {}", request.email());
        AuthResponse response = authService.login(request);
        log.info("Login successful for email: {}", request.email());
        return ResponseEntity.ok(ApiResponse.success("Login successful", response));
    }

    @GetMapping("/profile")
    public ResponseEntity<ApiResponse<AuthResponse>> getProfile(@AuthenticationPrincipal UUID userId) {
        log.info("Fetching profile for userId: {}", userId);
        AuthResponse response = authService.getProfile(userId);
        return ResponseEntity.ok(ApiResponse.success(response));
    }
}
