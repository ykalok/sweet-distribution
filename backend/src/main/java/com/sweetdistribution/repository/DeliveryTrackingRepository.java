package com.sweetdistribution.repository;

import com.sweetdistribution.model.entity.DeliveryTracking;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.UUID;

public interface DeliveryTrackingRepository extends JpaRepository<DeliveryTracking, UUID> {
    List<DeliveryTracking> findByOrderIdOrderByCreatedAtDesc(UUID orderId);
}
