package com.sweetdistribution.model.dto;

import java.time.LocalDateTime;
import java.util.UUID;

public record DeliveryTrackingDTO(
        UUID id,
        String status,
        String location,
        String notes,
        String updatedByName,
        LocalDateTime createdAt
) {}
