package com.sweetdistribution.controller;

import com.sweetdistribution.model.dto.ApiResponse;
import com.sweetdistribution.model.dto.CartItemDTO;
import com.sweetdistribution.service.CartService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/cart")
@RequiredArgsConstructor
@Slf4j
public class CartController {

    private final CartService cartService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<CartItemDTO>>> getCart(@AuthenticationPrincipal UUID userId) {
        log.info("Fetching cart for userId: {}", userId);
        return ResponseEntity.ok(ApiResponse.success(cartService.getCart(userId)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<CartItemDTO>> addToCart(
            @AuthenticationPrincipal UUID userId,
            @Valid @RequestBody CartItemDTO dto) {
        log.info("Adding to cart - userId: {}, productId: {}, quantity: {}", userId, dto.productId(), dto.quantity());
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Added to cart", cartService.addToCart(userId, dto)));
    }

    @PutMapping("/{itemId}")
    public ResponseEntity<ApiResponse<CartItemDTO>> updateQuantity(
            @AuthenticationPrincipal UUID userId,
            @PathVariable UUID itemId,
            @RequestParam Integer quantity) {
        log.info("Updating cart item - userId: {}, itemId: {}, quantity: {}", userId, itemId, quantity);
        return ResponseEntity.ok(ApiResponse.success(cartService.updateQuantity(userId, itemId, quantity)));
    }

    @DeleteMapping("/{itemId}")
    public ResponseEntity<ApiResponse<Void>> removeItem(
            @AuthenticationPrincipal UUID userId,
            @PathVariable UUID itemId) {
        log.info("Removing cart item - userId: {}, itemId: {}", userId, itemId);
        cartService.removeItem(userId, itemId);
        return ResponseEntity.ok(ApiResponse.success("Removed from cart", null));
    }

    @DeleteMapping
    public ResponseEntity<ApiResponse<Void>> clearCart(@AuthenticationPrincipal UUID userId) {
        log.info("Clearing cart for userId: {}", userId);
        cartService.clearCart(userId);
        return ResponseEntity.ok(ApiResponse.success("Cart cleared", null));
    }
}
