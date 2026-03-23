package com.sweetdistribution.model.dto;

import com.sweetdistribution.model.enums.PaymentStatus;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

public record PaymentResponse(
        UUID id,
        UUID orderId,
        String gatewayOrderId,
        String gatewayPaymentId,
        BigDecimal amount,
        String currency,
        PaymentStatus status,
        String method,
        LocalDateTime paidAt,
        LocalDateTime createdAt
) {}
