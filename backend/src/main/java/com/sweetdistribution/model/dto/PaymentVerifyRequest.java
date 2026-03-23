package com.sweetdistribution.model.dto;

import jakarta.validation.constraints.NotBlank;

public record PaymentVerifyRequest(
        @NotBlank(message = "Razorpay order ID is required") String razorpayOrderId,
        @NotBlank(message = "Razorpay payment ID is required") String razorpayPaymentId,
        @NotBlank(message = "Razorpay signature is required") String razorpaySignature
) {}
