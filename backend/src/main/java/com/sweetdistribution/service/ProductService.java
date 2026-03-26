package com.sweetdistribution.service;

import com.sweetdistribution.exception.ResourceNotFoundException;
import com.sweetdistribution.model.dto.ProductDTO;
import com.sweetdistribution.model.entity.Product;
import com.sweetdistribution.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ProductService {

    private final ProductRepository productRepository;

    public Page<ProductDTO> getActiveProducts(String category, Pageable pageable) {
        var products = (category != null && !category.isBlank())
                ? productRepository.findByIsActiveTrueAndCategory(category, pageable)
                : productRepository.findByIsActiveTrue(pageable);
        return products.map(this::toDTO);
    }

    public Page<ProductDTO> getAllProducts(Pageable pageable) {
        return productRepository.findAll(pageable).map(this::toDTO);
    }

    public ProductDTO getProductById(UUID id) {
        return toDTO(findOrThrow(id));
    }

    public Page<ProductDTO> searchProducts(String query, Pageable pageable) {
        return productRepository.searchProducts(query, pageable).map(this::toDTO);
    }

    public List<String> getCategories() {
        return productRepository.findDistinctCategories();
    }

    @Transactional
    public ProductDTO createProduct(ProductDTO dto) {
        var product = Product.builder()
                .name(dto.name())
                .description(dto.description())
                .price(dto.price())
                .category(dto.category())
                .imageUrl(dto.imageUrl())
                .stockQuantity(dto.stockQuantity())
                .minOrderQuantity(dto.minOrderQuantity())
                .unit(dto.unit() != null ? dto.unit() : "UNIT")
                .isActive(dto.isActive() != null ? dto.isActive() : true)
                .build();
        return toDTO(productRepository.save(product));
    }

    @Transactional
    public ProductDTO updateProduct(UUID id, ProductDTO dto) {
        var product = findOrThrow(id);
        product.setName(dto.name());
        product.setDescription(dto.description());
        product.setPrice(dto.price());
        product.setCategory(dto.category());
        product.setImageUrl(dto.imageUrl());
        product.setStockQuantity(dto.stockQuantity());
        product.setMinOrderQuantity(dto.minOrderQuantity());
        product.setUnit(dto.unit() != null ? dto.unit() : "UNIT");
        if (dto.isActive() != null) {
            product.setIsActive(dto.isActive());
        }
        return toDTO(productRepository.save(product));
    }

    @Transactional
    public void deleteProduct(UUID id) {
        productRepository.delete(findOrThrow(id));
    }

    private Product findOrThrow(UUID id) {
        return productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found: " + id));
    }

    private ProductDTO toDTO(Product p) {
        return new ProductDTO(
                p.getId(), p.getName(), p.getDescription(), p.getPrice(),
                p.getCategory(), p.getImageUrl(), p.getStockQuantity(),
                p.getMinOrderQuantity(), p.getUnit(), p.getIsActive(),
                p.getCreatedAt(), p.getUpdatedAt()
        );
    }
}
