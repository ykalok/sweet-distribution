package com.sweetdistribution.controller;

import com.sweetdistribution.model.dto.ApiResponse;
import com.sweetdistribution.model.dto.ProductDTO;
import com.sweetdistribution.service.ProductService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/products")
@RequiredArgsConstructor
@Slf4j
public class ProductController {

    private final ProductService productService;

    @GetMapping
    public ResponseEntity<ApiResponse<Page<ProductDTO>>> getProducts(
            @RequestParam(required = false) String category,
            @PageableDefault(size = 20) Pageable pageable) {
        log.info("Fetching products - category: {}, page: {}", category, pageable.getPageNumber());
        return ResponseEntity.ok(ApiResponse.success(productService.getActiveProducts(category, pageable)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<ProductDTO>> getProduct(@PathVariable UUID id) {
        log.info("Fetching product: {}", id);
        return ResponseEntity.ok(ApiResponse.success(productService.getProductById(id)));
    }

    @GetMapping("/search")
    public ResponseEntity<ApiResponse<Page<ProductDTO>>> searchProducts(
            @RequestParam String q,
            @PageableDefault(size = 20) Pageable pageable) {
        log.info("Searching products - query: {}", q);
        return ResponseEntity.ok(ApiResponse.success(productService.searchProducts(q, pageable)));
    }

    @GetMapping("/categories")
    public ResponseEntity<ApiResponse<List<String>>> getCategories() {
        log.info("Fetching product categories");
        return ResponseEntity.ok(ApiResponse.success(productService.getCategories()));
    }
}
