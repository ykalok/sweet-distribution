package com.sweetdistribution.model.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

public record ProductDTO(
        UUID id,

        @NotBlank(message = "Product name is required")
        String name,

        @NotBlank(message = "Description is required")
        String description,

        @NotNull(message = "Price is required")
        @DecimalMin(value = "0.0", message = "Price must be >= 0")
        BigDecimal price,

        @NotBlank(message = "Category is required")
        String category,

        String imageUrl,

        @NotNull(message = "Stock quantity is required")
        @Min(value = 0, message = "Stock must be >= 0")
        Integer stockQuantity,

        @NotNull(message = "Min order quantity is required")
        @Min(value = 1, message = "Min order quantity must be >= 1")
        Integer minOrderQuantity,

        String unit,

        Boolean isActive,

        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {}
