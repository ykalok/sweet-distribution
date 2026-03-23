package com.sweetdistribution.service;

import com.sweetdistribution.exception.ResourceNotFoundException;
import com.sweetdistribution.model.dto.AddressDTO;
import com.sweetdistribution.model.entity.Address;
import com.sweetdistribution.repository.AddressRepository;
import com.sweetdistribution.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AddressService {

    private final AddressRepository addressRepository;
    private final UserRepository userRepository;

    public List<AddressDTO> getUserAddresses(UUID userId) {
        return addressRepository.findByUserIdOrderByIsDefaultDescCreatedAtDesc(userId)
                .stream().map(this::toDTO).toList();
    }

    @Transactional
    public AddressDTO createAddress(UUID userId, AddressDTO dto) {
        var user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        if (Boolean.TRUE.equals(dto.isDefault())) {
            clearDefaultAddresses(userId);
        }

        var address = Address.builder()
                .user(user)
                .label(dto.label())
                .addressLine1(dto.addressLine1())
                .addressLine2(dto.addressLine2())
                .city(dto.city())
                .state(dto.state())
                .pincode(dto.pincode())
                .isDefault(dto.isDefault() != null ? dto.isDefault() : false)
                .build();
        return toDTO(addressRepository.save(address));
    }

    @Transactional
    public AddressDTO updateAddress(UUID userId, UUID addressId, AddressDTO dto) {
        var address = findUserAddress(userId, addressId);

        if (Boolean.TRUE.equals(dto.isDefault())) {
            clearDefaultAddresses(userId);
        }

        address.setLabel(dto.label());
        address.setAddressLine1(dto.addressLine1());
        address.setAddressLine2(dto.addressLine2());
        address.setCity(dto.city());
        address.setState(dto.state());
        address.setPincode(dto.pincode());
        if (dto.isDefault() != null) address.setIsDefault(dto.isDefault());
        return toDTO(addressRepository.save(address));
    }

    @Transactional
    public void deleteAddress(UUID userId, UUID addressId) {
        var address = findUserAddress(userId, addressId);
        addressRepository.delete(address);
    }

    private Address findUserAddress(UUID userId, UUID addressId) {
        var address = addressRepository.findById(addressId)
                .orElseThrow(() -> new ResourceNotFoundException("Address not found"));
        if (!address.getUser().getId().equals(userId)) {
            throw new ResourceNotFoundException("Address not found");
        }
        return address;
    }

    private void clearDefaultAddresses(UUID userId) {
        addressRepository.findByUserIdOrderByIsDefaultDescCreatedAtDesc(userId)
                .stream().filter(Address::getIsDefault)
                .forEach(a -> { a.setIsDefault(false); addressRepository.save(a); });
    }

    private AddressDTO toDTO(Address a) {
        return new AddressDTO(a.getId(), a.getAddressLine1(), a.getAddressLine2(),
                a.getLabel(), a.getCity(), a.getState(), a.getPincode(),
                a.getIsDefault(), a.getCreatedAt());
    }
}
