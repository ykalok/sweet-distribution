package com.sweetdistribution.model.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.util.UUID;

public record CartItemDTO(
        UUID id,
        @NotNull(message = "Product ID is required") UUID productId,
        String productName,
        String productCategory,
        BigDecimal productPrice,
        @NotNull(message = "Quantity is required") @Min(value = 1, message = "Quantity must be >= 1") Integer quantity,
        BigDecimal subtotal
) {}
