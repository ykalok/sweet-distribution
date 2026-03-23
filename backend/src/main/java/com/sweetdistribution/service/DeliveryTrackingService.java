package com.sweetdistribution.service;

import com.sweetdistribution.exception.ResourceNotFoundException;
import com.sweetdistribution.model.dto.DeliveryTrackingDTO;
import com.sweetdistribution.model.entity.DeliveryTracking;
import com.sweetdistribution.repository.DeliveryTrackingRepository;
import com.sweetdistribution.repository.OrderRepository;
import com.sweetdistribution.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class DeliveryTrackingService {

    private final DeliveryTrackingRepository trackingRepository;
    private final OrderRepository orderRepository;
    private final UserRepository userRepository;

    public List<DeliveryTrackingDTO> getTrackingHistory(UUID orderId) {
        return trackingRepository.findByOrderIdOrderByCreatedAtDesc(orderId)
                .stream().map(this::toDTO).toList();
    }

    @Transactional
    public DeliveryTrackingDTO addTrackingEntry(UUID orderId, String status, String location, String notes, UUID updatedById) {
        var order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found"));
        var updatedBy = userRepository.findById(updatedById)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        var tracking = DeliveryTracking.builder()
                .order(order)
                .status(status)
                .location(location)
                .notes(notes)
                .updatedBy(updatedBy)
                .build();

        return toDTO(trackingRepository.save(tracking));
    }

    private DeliveryTrackingDTO toDTO(DeliveryTracking t) {
        return new DeliveryTrackingDTO(
                t.getId(), t.getStatus(), t.getLocation(), t.getNotes(),
                t.getUpdatedBy() != null ? t.getUpdatedBy().getFullName() : null,
                t.getCreatedAt()
        );
    }
}
