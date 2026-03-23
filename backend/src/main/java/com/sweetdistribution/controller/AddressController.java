package com.sweetdistribution.controller;

import com.sweetdistribution.model.dto.AddressDTO;
import com.sweetdistribution.model.dto.ApiResponse;
import com.sweetdistribution.service.AddressService;
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
@RequestMapping("/api/addresses")
@RequiredArgsConstructor
@Slf4j
public class AddressController {

    private final AddressService addressService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<AddressDTO>>> getAddresses(@AuthenticationPrincipal UUID userId) {
        log.info("Fetching addresses for userId: {}", userId);
        return ResponseEntity.ok(ApiResponse.success(addressService.getUserAddresses(userId)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<AddressDTO>> createAddress(
            @AuthenticationPrincipal UUID userId,
            @Valid @RequestBody AddressDTO dto) {
        log.info("Creating address for userId: {}", userId);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Address added", addressService.createAddress(userId, dto)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<AddressDTO>> updateAddress(
            @AuthenticationPrincipal UUID userId,
            @PathVariable UUID id,
            @Valid @RequestBody AddressDTO dto) {
        log.info("Updating address: {} for userId: {}", id, userId);
        return ResponseEntity.ok(ApiResponse.success("Address updated", addressService.updateAddress(userId, id, dto)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteAddress(
            @AuthenticationPrincipal UUID userId,
            @PathVariable UUID id) {
        log.info("Deleting address: {} for userId: {}", id, userId);
        addressService.deleteAddress(userId, id);
        return ResponseEntity.ok(ApiResponse.success("Address deleted", null));
    }
}
