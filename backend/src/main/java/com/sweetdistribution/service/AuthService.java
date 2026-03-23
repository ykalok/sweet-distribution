package com.sweetdistribution.service;

import com.sweetdistribution.exception.ResourceNotFoundException;
import com.sweetdistribution.model.dto.AuthResponse;
import com.sweetdistribution.model.dto.LoginRequest;
import com.sweetdistribution.model.dto.RegisterRequest;
import com.sweetdistribution.model.entity.User;
import com.sweetdistribution.model.enums.Role;
import com.sweetdistribution.repository.UserRepository;
import com.sweetdistribution.security.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        log.info("Registering user with email: {}", request.email());
        if (userRepository.existsByEmail(request.email())) {
            log.warn("Registration failed - email already exists: {}", request.email());
            throw new IllegalArgumentException("Email already registered");
        }

        var user = User.builder()
                .email(request.email())
                .password(passwordEncoder.encode(request.password()))
                .fullName(request.fullName())
                .companyName(request.companyName())
                .phoneNumber(request.phoneNumber())
                .role(Role.CUSTOMER)
                .build();

        user = userRepository.save(user);
        log.info("User registered successfully with id: {}", user.getId());
        var token = jwtTokenProvider.generateToken(user.getId(), user.getEmail(), user.getRole().name());
        return toAuthResponse(user, token);
    }

    public AuthResponse login(LoginRequest request) {
        log.info("Login attempt for email: {}", request.email());
        var user = userRepository.findByEmail(request.email())
                .orElseThrow(() -> {
                    log.warn("Login failed - user not found: {}", request.email());
                    return new BadCredentialsException("Invalid email or password");
                });

        if (!passwordEncoder.matches(request.password(), user.getPassword())) {
            log.warn("Login failed - invalid password for email: {}", request.email());
            throw new BadCredentialsException("Invalid email or password");
        }

        if (!user.getIsActive()) {
            log.warn("Login failed - account deactivated: {}", request.email());
            throw new BadCredentialsException("Account is deactivated");
        }

        log.info("Login successful for userId: {}", user.getId());
        var token = jwtTokenProvider.generateToken(user.getId(), user.getEmail(), user.getRole().name());
        return toAuthResponse(user, token);
    }

    public AuthResponse getProfile(UUID userId) {
        var user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        return toAuthResponse(user, null);
    }

    private AuthResponse toAuthResponse(User user, String token) {
        return new AuthResponse(
                token,
                user.getId(),
                user.getEmail(),
                user.getFullName(),
                user.getRole(),
                user.getCompanyName()
        );
    }
}
