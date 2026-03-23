package com.sweetdistribution.model.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

public record InvoiceResponse(
        UUID id,
        UUID orderId,
        String invoiceNumber,
        BigDecimal gstAmount,
        BigDecimal totalWithTax,
        String pdfUrl,
        LocalDateTime generatedAt
) {}
