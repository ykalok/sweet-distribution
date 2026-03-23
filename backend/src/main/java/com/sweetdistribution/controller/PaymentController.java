package com.sweetdistribution.controller;

import com.sweetdistribution.model.dto.ApiResponse;
import com.sweetdistribution.model.dto.PaymentRequest;
import com.sweetdistribution.model.dto.PaymentResponse;
import com.sweetdistribution.model.dto.PaymentVerifyRequest;
import com.sweetdistribution.service.PaymentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/payments")
@RequiredArgsConstructor
@Slf4j
public class PaymentController {

    private final PaymentService paymentService;

    @PostMapping("/create-order")
    public ResponseEntity<ApiResponse<PaymentResponse>> createPaymentOrder(
            @AuthenticationPrincipal UUID userId,
            @Valid @RequestBody PaymentRequest request) {
        log.info("Creating payment order for orderId: {}, userId: {}", request.orderId(), userId);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Payment order created",
                        paymentService.createPaymentOrder(request.orderId(), userId)));
    }

    @PostMapping("/verify")
    public ResponseEntity<ApiResponse<PaymentResponse>> verifyPayment(
            @Valid @RequestBody PaymentVerifyRequest request) {
        log.info("Verifying payment - razorpayOrderId: {}", request.razorpayOrderId());
        return ResponseEntity.ok(ApiResponse.success("Payment verified",
                paymentService.verifyPayment(request)));
    }

    @GetMapping("/{orderId}")
    public ResponseEntity<ApiResponse<PaymentResponse>> getPaymentStatus(
            @AuthenticationPrincipal UUID userId,
            @PathVariable UUID orderId) {
        log.info("Fetching payment status for orderId: {}", orderId);
        return ResponseEntity.ok(ApiResponse.success(
                paymentService.getPaymentByOrderId(orderId, userId)));
    }

    @GetMapping("/razorpay-key")
    public ResponseEntity<ApiResponse<Map<String, String>>> getRazorpayKey() {
        log.debug("Fetching Razorpay key");
        return ResponseEntity.ok(ApiResponse.success(
                Map.of("keyId", paymentService.getRazorpayKeyId())));
    }

    @PostMapping("/webhook")
    public ResponseEntity<Void> handleWebhook(
            @RequestBody String payload,
            @RequestHeader("X-Razorpay-Signature") String signature) {
        log.info("Received Razorpay webhook");
        paymentService.handleWebhook(payload, signature);
        return ResponseEntity.ok().build();
    }
}
