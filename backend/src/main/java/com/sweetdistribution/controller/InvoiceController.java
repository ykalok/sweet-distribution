package com.sweetdistribution.controller;

import com.sweetdistribution.model.dto.ApiResponse;
import com.sweetdistribution.model.dto.InvoiceResponse;
import com.sweetdistribution.service.InvoiceService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/invoices")
@RequiredArgsConstructor
@Slf4j
public class InvoiceController {

    private final InvoiceService invoiceService;

    @GetMapping("/{orderId}")
    public ResponseEntity<ApiResponse<InvoiceResponse>> getInvoice(@PathVariable UUID orderId) {
        log.info("Fetching invoice for orderId: {}", orderId);
        return ResponseEntity.ok(ApiResponse.success(invoiceService.getInvoiceByOrderId(orderId)));
    }
}
