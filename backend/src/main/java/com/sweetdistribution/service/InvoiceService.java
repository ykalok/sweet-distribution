package com.sweetdistribution.service;

import com.sweetdistribution.exception.ResourceNotFoundException;
import com.sweetdistribution.model.dto.InvoiceResponse;
import com.sweetdistribution.model.entity.Invoice;
import com.sweetdistribution.repository.InvoiceRepository;
import com.sweetdistribution.repository.OrderRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.UUID;
import java.util.concurrent.atomic.AtomicLong;

@Service
@RequiredArgsConstructor
public class InvoiceService {

    private final InvoiceRepository invoiceRepository;
    private final OrderRepository orderRepository;
    private static final BigDecimal GST_RATE = new BigDecimal("0.18");
    private static final AtomicLong invoiceCounter = new AtomicLong(1000);

    @Transactional
    public InvoiceResponse generateInvoice(UUID orderId) {
        var existing = invoiceRepository.findByOrderId(orderId);
        if (existing.isPresent()) {
            return toResponse(existing.get());
        }

        var order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found"));

        var gstAmount = order.getTotalAmount().multiply(GST_RATE).setScale(2, RoundingMode.HALF_UP);
        var totalWithTax = order.getTotalAmount().add(gstAmount);
        var invoiceNumber = "INV-%s-%d".formatted(
                LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd")),
                invoiceCounter.incrementAndGet()
        );

        var invoice = Invoice.builder()
                .order(order)
                .invoiceNumber(invoiceNumber)
                .gstAmount(gstAmount)
                .totalWithTax(totalWithTax)
                .build();

        return toResponse(invoiceRepository.save(invoice));
    }

    public InvoiceResponse getInvoiceByOrderId(UUID orderId) {
        var invoice = invoiceRepository.findByOrderId(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Invoice not found for this order"));
        return toResponse(invoice);
    }

    private InvoiceResponse toResponse(Invoice i) {
        return new InvoiceResponse(
                i.getId(), i.getOrder().getId(), i.getInvoiceNumber(),
                i.getGstAmount(), i.getTotalWithTax(), i.getPdfUrl(),
                i.getGeneratedAt()
        );
    }
}
