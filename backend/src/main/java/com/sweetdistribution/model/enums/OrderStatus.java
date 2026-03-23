package com.sweetdistribution.model.enums;

import java.util.Set;

public enum OrderStatus {
    PENDING,
    CONFIRMED,
    PROCESSING,
    SHIPPED,
    DELIVERED,
    CANCELLED;

    public boolean canTransitionTo(OrderStatus target) {
        return getAllowedTransitions().contains(target);
    }

    private Set<OrderStatus> getAllowedTransitions() {
        return switch (this) {
            case PENDING    -> Set.of(CONFIRMED, CANCELLED);
            case CONFIRMED  -> Set.of(PROCESSING, CANCELLED);
            case PROCESSING -> Set.of(SHIPPED, CANCELLED);
            case SHIPPED    -> Set.of(DELIVERED);
            case DELIVERED  -> Set.of();
            case CANCELLED  -> Set.of();
        };
    }
}
