package com.sweetdistribution.model.dto;

import com.sweetdistribution.model.enums.OrderStatus;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public record OrderResponse(
        UUID id,
        UUID customerId,
        String customerName,
        String customerEmail,
        String companyName,
        OrderStatus status,
        BigDecimal totalAmount,
        String deliveryAddress,
        String notes,
        List<OrderItemResponse> items,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {}
