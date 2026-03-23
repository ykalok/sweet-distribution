package com.sweetdistribution.model.dto;

import com.sweetdistribution.model.enums.Role;

import java.util.UUID;

public record AuthResponse(
        String token,
        UUID userId,
        String email,
        String fullName,
        Role role,
        String companyName
) {}
