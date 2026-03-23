package com.sweetdistribution.controller;

import com.sweetdistribution.model.dto.*;
import com.sweetdistribution.model.enums.OrderStatus;
import com.sweetdistribution.service.*;
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
@RequestMapping("/api/admin")
@RequiredArgsConstructor
@Slf4j
public class AdminController {

    private final ProductService productService;
    private final OrderService orderService;
    private final InvoiceService invoiceService;
    private final DeliveryTrackingService deliveryTrackingService;

    // ─── Product Management ───

    @GetMapping("/products")
    public ResponseEntity<ApiResponse<Page<ProductDTO>>> getAllProducts(
            @PageableDefault(size = 20) Pageable pageable) {
        log.info("Admin: Fetching all products, page: {}", pageable.getPageNumber());
        return ResponseEntity.ok(ApiResponse.success(productService.getAllProducts(pageable)));
    }

    @PostMapping("/products")
    public ResponseEntity<ApiResponse<ProductDTO>> createProduct(@Valid @RequestBody ProductDTO dto) {
        log.info("Admin: Creating product: {}", dto.name());
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Product created", productService.createProduct(dto)));
    }

    @PutMapping("/products/{id}")
    public ResponseEntity<ApiResponse<ProductDTO>> updateProduct(
            @PathVariable UUID id, @Valid @RequestBody ProductDTO dto) {
        log.info("Admin: Updating product: {}", id);
        return ResponseEntity.ok(ApiResponse.success("Product updated", productService.updateProduct(id, dto)));
    }

    @DeleteMapping("/products/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteProduct(@PathVariable UUID id) {
        log.info("Admin: Deleting product: {}", id);
        productService.deleteProduct(id);
        return ResponseEntity.ok(ApiResponse.success("Product deleted", null));
    }

    // ─── Order Management ───

    @GetMapping("/orders")
    public ResponseEntity<ApiResponse<Page<OrderResponse>>> getAllOrders(
            @RequestParam(required = false) OrderStatus status,
            @PageableDefault(size = 20) Pageable pageable) {
        log.info("Admin: Fetching orders - status: {}, page: {}", status, pageable.getPageNumber());
        return ResponseEntity.ok(ApiResponse.success(orderService.getAllOrders(status, pageable)));
    }

    @GetMapping("/orders/{id}")
    public ResponseEntity<ApiResponse<OrderResponse>> getOrder(
            @AuthenticationPrincipal UUID userId, @PathVariable UUID id) {
        log.info("Admin: Fetching order: {}", id);
        return ResponseEntity.ok(ApiResponse.success(orderService.getOrderById(id, userId, true)));
    }

    @PutMapping("/orders/{id}/status")
    public ResponseEntity<ApiResponse<OrderResponse>> updateOrderStatus(
            @PathVariable UUID id, @RequestParam OrderStatus status) {
        log.info("Admin: Updating order {} status to: {}", id, status);
        return ResponseEntity.ok(ApiResponse.success("Order status updated",
                orderService.updateOrderStatus(id, status)));
    }

    // ─── Invoice Management ───

    @PostMapping("/orders/{id}/invoice")
    public ResponseEntity<ApiResponse<InvoiceResponse>> generateInvoice(@PathVariable UUID id) {
        log.info("Admin: Generating invoice for order: {}", id);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Invoice generated", invoiceService.generateInvoice(id)));
    }

    // ─── Delivery Tracking ───

    @GetMapping("/orders/{id}/tracking")
    public ResponseEntity<ApiResponse<List<DeliveryTrackingDTO>>> getTracking(@PathVariable UUID id) {
        log.info("Admin: Fetching tracking for order: {}", id);
        return ResponseEntity.ok(ApiResponse.success(deliveryTrackingService.getTrackingHistory(id)));
    }

    @PostMapping("/orders/{id}/tracking")
    public ResponseEntity<ApiResponse<DeliveryTrackingDTO>> addTracking(
            @AuthenticationPrincipal UUID userId,
            @PathVariable UUID id,
            @RequestParam String status,
            @RequestParam(required = false) String location,
            @RequestParam(required = false) String notes) {
        log.info("Admin: Adding tracking for order: {} - status: {}, location: {}", id, status, location);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Tracking updated",
                        deliveryTrackingService.addTrackingEntry(id, status, location, notes, userId)));
    }
}
