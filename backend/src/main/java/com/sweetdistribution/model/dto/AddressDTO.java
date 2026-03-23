package com.sweetdistribution.model.dto;

import jakarta.validation.constraints.NotBlank;
import java.time.LocalDateTime;
import java.util.UUID;

public record AddressDTO(
        UUID id,
        @NotBlank(message = "Address line 1 is required") String addressLine1,
        String addressLine2,
        String label,
        @NotBlank(message = "City is required") String city,
        @NotBlank(message = "State is required") String state,
        @NotBlank(message = "Pincode is required") String pincode,
        Boolean isDefault,
        LocalDateTime createdAt
) {}
