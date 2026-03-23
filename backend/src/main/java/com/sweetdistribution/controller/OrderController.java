package com.sweetdistribution.controller;

import com.sweetdistribution.model.dto.*;
import com.sweetdistribution.service.DeliveryTrackingService;
import com.sweetdistribution.service.OrderService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/orders")
@RequiredArgsConstructor
@Slf4j
public class OrderController {

    private final OrderService orderService;
    private final DeliveryTrackingService deliveryTrackingService;

    @PostMapping
    public ResponseEntity<ApiResponse<OrderResponse>> createOrder(
            @AuthenticationPrincipal UUID userId,
            @Valid @RequestBody OrderRequest request) {
        log.info("Creating order for userId: {}, items: {}", userId, request.items().size());
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Order placed successfully", orderService.createOrder(userId, request)));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<Page<OrderResponse>>> getMyOrders(
            @AuthenticationPrincipal UUID userId,
            @PageableDefault(size = 10) Pageable pageable) {
        log.info("Fetching orders for userId: {}, page: {}", userId, pageable.getPageNumber());
        return ResponseEntity.ok(ApiResponse.success(orderService.getCustomerOrders(userId, pageable)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<OrderResponse>> getOrder(
            @AuthenticationPrincipal UUID userId, @PathVariable UUID id) {
        log.info("Fetching order: {} for userId: {}", id, userId);
        return ResponseEntity.ok(ApiResponse.success(orderService.getOrderById(id, userId, false)));
    }

    @GetMapping("/{id}/track")
    public ResponseEntity<ApiResponse<List<DeliveryTrackingDTO>>> getOrderTracking(
            @AuthenticationPrincipal UUID userId, @PathVariable UUID id) {
        log.info("Fetching tracking for order: {}", id);
        orderService.getOrderById(id, userId, false);
        return ResponseEntity.ok(ApiResponse.success(deliveryTrackingService.getTrackingHistory(id)));
    }

    @PostMapping("/{id}/cancel")
    public ResponseEntity<ApiResponse<OrderResponse>> cancelOrder(
            @AuthenticationPrincipal UUID userId, @PathVariable UUID id) {
        log.info("Cancelling order: {} for userId: {}", id, userId);
        return ResponseEntity.ok(ApiResponse.success("Order cancelled", orderService.cancelOrder(id, userId)));
    }
}
