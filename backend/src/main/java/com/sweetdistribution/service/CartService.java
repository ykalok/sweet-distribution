package com.sweetdistribution.service;

import com.sweetdistribution.exception.ResourceNotFoundException;
import com.sweetdistribution.model.dto.CartItemDTO;
import com.sweetdistribution.model.entity.CartItem;
import com.sweetdistribution.repository.CartItemRepository;
import com.sweetdistribution.repository.ProductRepository;
import com.sweetdistribution.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class CartService {

    private final CartItemRepository cartItemRepository;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;

    public List<CartItemDTO> getCart(UUID userId) {
        return cartItemRepository.findByUserIdOrderByCreatedAtDesc(userId)
                .stream().map(this::toDTO).toList();
    }

    @Transactional
    public CartItemDTO addToCart(UUID userId, CartItemDTO dto) {
        var user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        var product = productRepository.findById(dto.productId())
                .orElseThrow(() -> new ResourceNotFoundException("Product not found"));

        var existing = cartItemRepository.findByUserIdAndProductId(userId, dto.productId());
        if (existing.isPresent()) {
            var item = existing.get();
            item.setQuantity(item.getQuantity() + dto.quantity());
            return toDTO(cartItemRepository.save(item));
        }

        var item = CartItem.builder()
                .user(user)
                .product(product)
                .quantity(dto.quantity())
                .build();
        return toDTO(cartItemRepository.save(item));
    }

    @Transactional
    public CartItemDTO updateQuantity(UUID userId, UUID itemId, Integer quantity) {
        var item = cartItemRepository.findById(itemId)
                .orElseThrow(() -> new ResourceNotFoundException("Cart item not found"));
        if (!item.getUser().getId().equals(userId)) {
            throw new ResourceNotFoundException("Cart item not found");
        }
        item.setQuantity(quantity);
        return toDTO(cartItemRepository.save(item));
    }

    @Transactional
    public void removeItem(UUID userId, UUID itemId) {
        cartItemRepository.deleteByIdAndUserId(itemId, userId);
    }

    @Transactional
    public void clearCart(UUID userId) {
        cartItemRepository.deleteByUserId(userId);
    }

    private CartItemDTO toDTO(CartItem item) {
        var p = item.getProduct();
        return new CartItemDTO(
                item.getId(), p.getId(), p.getName(), p.getCategory(),
                p.getPrice(), item.getQuantity(),
                p.getPrice().multiply(java.math.BigDecimal.valueOf(item.getQuantity()))
        );
    }
}
