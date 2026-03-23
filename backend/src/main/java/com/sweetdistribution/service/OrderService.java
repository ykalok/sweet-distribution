package com.sweetdistribution.service;

import com.sweetdistribution.exception.InsufficientStockException;
import com.sweetdistribution.exception.ResourceNotFoundException;
import com.sweetdistribution.model.dto.*;
import com.sweetdistribution.model.entity.Order;
import com.sweetdistribution.model.entity.OrderItem;
import com.sweetdistribution.model.entity.Product;
import com.sweetdistribution.model.enums.OrderStatus;
import com.sweetdistribution.repository.OrderRepository;
import com.sweetdistribution.repository.ProductRepository;
import com.sweetdistribution.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class OrderService {

    private final OrderRepository orderRepository;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;

    @Transactional
    public OrderResponse createOrder(UUID customerId, OrderRequest request) {
        var customer = userRepository.findById(customerId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        var order = Order.builder()
                .customer(customer)
                .deliveryAddress(request.deliveryAddress())
                .notes(request.notes())
                .status(OrderStatus.PENDING)
                .totalAmount(BigDecimal.ZERO)
                .build();

        var totalAmount = BigDecimal.ZERO;

        for (var itemReq : request.items()) {
            var product = productRepository.findById(itemReq.productId())
                    .orElseThrow(() -> new ResourceNotFoundException("Product not found: " + itemReq.productId()));

            validateOrderItem(product, itemReq);

            product.setStockQuantity(product.getStockQuantity() - itemReq.quantity());
            productRepository.save(product);

            var itemTotal = product.getPrice().multiply(BigDecimal.valueOf(itemReq.quantity()));
            totalAmount = totalAmount.add(itemTotal);

            order.addOrderItem(OrderItem.builder()
                    .product(product)
                    .quantity(itemReq.quantity())
                    .priceAtTime(product.getPrice())
                    .build());
        }

        order.setTotalAmount(totalAmount);
        return toResponse(orderRepository.save(order));
    }

    public Page<OrderResponse> getCustomerOrders(UUID customerId, Pageable pageable) {
        return orderRepository.findByCustomerIdOrderByCreatedAtDesc(customerId, pageable)
                .map(this::toResponse);
    }

    public OrderResponse getOrderById(UUID orderId, UUID userId, boolean isAdmin) {
        var order = findOrThrow(orderId);
        if (!isAdmin && !order.getCustomer().getId().equals(userId)) {
            throw new ResourceNotFoundException("Order not found: " + orderId);
        }
        return toResponse(order);
    }

    public Page<OrderResponse> getAllOrders(OrderStatus status, Pageable pageable) {
        var orders = (status != null)
                ? orderRepository.findByStatusOrderByCreatedAtDesc(status, pageable)
                : orderRepository.findAllByOrderByCreatedAtDesc(pageable);
        return orders.map(this::toResponse);
    }

    @Transactional
    public OrderResponse updateOrderStatus(UUID orderId, OrderStatus newStatus) {
        var order = findOrThrow(orderId);

        if (!order.getStatus().canTransitionTo(newStatus)) {
            throw new IllegalArgumentException(
                    "Cannot transition from %s to %s".formatted(order.getStatus(), newStatus));
        }

        if (newStatus == OrderStatus.CANCELLED) {
            restoreStock(order);
        }

        order.setStatus(newStatus);
        return toResponse(orderRepository.save(order));
    }

    @Transactional
    public OrderResponse cancelOrder(UUID orderId, UUID customerId) {
        var order = findOrThrow(orderId);

        if (!order.getCustomer().getId().equals(customerId)) {
            throw new ResourceNotFoundException("Order not found: " + orderId);
        }
        if (order.getStatus() != OrderStatus.PENDING) {
            throw new IllegalArgumentException("Only pending orders can be cancelled");
        }

        return updateOrderStatus(orderId, OrderStatus.CANCELLED);
    }

    private void validateOrderItem(Product product, OrderItemRequest itemReq) {
        if (!product.getIsActive()) {
            throw new IllegalArgumentException("Product is not available: " + product.getName());
        }
        if (itemReq.quantity() < product.getMinOrderQuantity()) {
            throw new IllegalArgumentException(
                    "Minimum order quantity for %s is %d".formatted(product.getName(), product.getMinOrderQuantity()));
        }
        if (product.getStockQuantity() < itemReq.quantity()) {
            throw new InsufficientStockException(
                    "Insufficient stock for %s. Available: %d, Requested: %d"
                            .formatted(product.getName(), product.getStockQuantity(), itemReq.quantity()));
        }
    }

    private void restoreStock(Order order) {
        for (var item : order.getOrderItems()) {
            var product = item.getProduct();
            product.setStockQuantity(product.getStockQuantity() + item.getQuantity());
            productRepository.save(product);
        }
    }

    private Order findOrThrow(UUID orderId) {
        return orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found: " + orderId));
    }

    private OrderResponse toResponse(Order order) {
        var items = order.getOrderItems().stream()
                .map(item -> new OrderItemResponse(
                        item.getId(),
                        item.getProduct().getId(),
                        item.getProduct().getName(),
                        item.getProduct().getCategory(),
                        item.getQuantity(),
                        item.getPriceAtTime(),
                        item.getPriceAtTime().multiply(BigDecimal.valueOf(item.getQuantity()))
                ))
                .toList();

        var customer = order.getCustomer();
        return new OrderResponse(
                order.getId(), customer.getId(), customer.getFullName(),
                customer.getEmail(), customer.getCompanyName(), order.getStatus(),
                order.getTotalAmount(), order.getDeliveryAddress(), order.getNotes(),
                items, order.getCreatedAt(), order.getUpdatedAt()
        );
    }
}
