package com.sweetdistribution.service;

import com.razorpay.RazorpayClient;
import com.razorpay.RazorpayException;
import com.sweetdistribution.exception.PaymentFailedException;
import com.sweetdistribution.exception.ResourceNotFoundException;
import com.sweetdistribution.model.dto.PaymentResponse;
import com.sweetdistribution.model.dto.PaymentVerifyRequest;
import com.sweetdistribution.model.entity.Payment;
import com.sweetdistribution.model.enums.OrderStatus;
import com.sweetdistribution.model.enums.PaymentStatus;
import com.sweetdistribution.repository.OrderRepository;
import com.sweetdistribution.repository.PaymentRepository;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.json.JSONObject;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.HexFormat;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class PaymentService {

    private final PaymentRepository paymentRepository;
    private final OrderRepository orderRepository;
    private final InvoiceService invoiceService;

    @Value("${razorpay.key-id}")
    private String razorpayKeyId;

    @Value("${razorpay.key-secret}")
    private String razorpayKeySecret;

    private RazorpayClient razorpayClient;

    @PostConstruct
    public void init() {
        try {
            razorpayClient = new RazorpayClient(razorpayKeyId, razorpayKeySecret);
        } catch (RazorpayException e) {
            log.warn("Failed to initialize Razorpay client: {}. Using mock mode.", e.getMessage());
        }
    }

    @Transactional
    public PaymentResponse createPaymentOrder(UUID orderId, UUID userId) {
        var order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found"));

        if (!order.getCustomer().getId().equals(userId)) {
            throw new ResourceNotFoundException("Order not found");
        }
        if (order.getStatus() != OrderStatus.PENDING) {
            throw new PaymentFailedException("Order is not in pending state");
        }

        var existingPayment = paymentRepository.findByOrderId(orderId);
        if (existingPayment.isPresent() && existingPayment.get().getStatus() == PaymentStatus.SUCCESS) {
            throw new PaymentFailedException("Payment already completed for this order");
        }

        String gatewayOrderId = createRazorpayOrder(order.getTotalAmount());

        var payment = existingPayment.orElse(Payment.builder()
                .order(order)
                .amount(order.getTotalAmount())
                .currency("INR")
                .build());

        payment.setGatewayOrderId(gatewayOrderId);
        payment.setStatus(PaymentStatus.PENDING);
        payment = paymentRepository.save(payment);

        order.setPaymentId(payment.getId());
        orderRepository.save(order);

        return toResponse(payment);
    }

    @Transactional
    public PaymentResponse verifyPayment(PaymentVerifyRequest request) {
        var payment = paymentRepository.findByGatewayOrderId(request.razorpayOrderId())
                .orElseThrow(() -> new ResourceNotFoundException("Payment not found"));

        var expectedSignature = generateSignature(
                request.razorpayOrderId() + "|" + request.razorpayPaymentId(),
                razorpayKeySecret
        );

        if (!expectedSignature.equals(request.razorpaySignature())) {
            payment.setStatus(PaymentStatus.FAILED);
            payment.setFailureReason("Signature verification failed");
            paymentRepository.save(payment);
            throw new PaymentFailedException("Payment verification failed: invalid signature");
        }

        payment.setGatewayPaymentId(request.razorpayPaymentId());
        payment.setGatewaySignature(request.razorpaySignature());
        payment.setStatus(PaymentStatus.SUCCESS);
        payment.setPaidAt(LocalDateTime.now());
        paymentRepository.save(payment);

        var order = payment.getOrder();
        order.setStatus(OrderStatus.CONFIRMED);
        orderRepository.save(order);

        // Auto-generate invoice on successful payment
        try {
            invoiceService.generateInvoice(order.getId());
        } catch (Exception e) {
            log.error("Failed to generate invoice for order {}: {}", order.getId(), e.getMessage());
        }

        return toResponse(payment);
    }

    @Transactional
    public void handleWebhook(String payload, String signature) {
        var expectedSignature = generateSignature(payload, razorpayKeySecret);
        if (!expectedSignature.equals(signature)) {
            throw new PaymentFailedException("Webhook signature verification failed");
        }

        var json = new JSONObject(payload);
        var event = json.getString("event");
        var paymentEntity = json.getJSONObject("payload").getJSONObject("payment").getJSONObject("entity");

        var gatewayOrderId = paymentEntity.getString("order_id");
        var payment = paymentRepository.findByGatewayOrderId(gatewayOrderId).orElse(null);
        if (payment == null) {
            log.warn("Webhook: payment not found for gateway order {}", gatewayOrderId);
            return;
        }

        switch (event) {
            case "payment.captured" -> {
                if (payment.getStatus() != PaymentStatus.SUCCESS) {
                    payment.setGatewayPaymentId(paymentEntity.getString("id"));
                    payment.setStatus(PaymentStatus.SUCCESS);
                    payment.setMethod(paymentEntity.optString("method", null));
                    payment.setPaidAt(LocalDateTime.now());
                    paymentRepository.save(payment);

                    var order = payment.getOrder();
                    if (order.getStatus() == OrderStatus.PENDING) {
                        order.setStatus(OrderStatus.CONFIRMED);
                        orderRepository.save(order);
                    }

                    try {
                        invoiceService.generateInvoice(order.getId());
                    } catch (Exception e) {
                        log.error("Webhook: invoice generation failed for order {}", order.getId(), e);
                    }
                }
            }
            case "payment.failed" -> {
                payment.setStatus(PaymentStatus.FAILED);
                payment.setFailureReason(paymentEntity.getJSONObject("error_description").optString("description", "Payment failed"));
                paymentRepository.save(payment);
            }
            default -> log.info("Unhandled webhook event: {}", event);
        }
    }

    public PaymentResponse getPaymentByOrderId(UUID orderId, UUID userId) {
        var order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found"));
        if (!order.getCustomer().getId().equals(userId)) {
            throw new ResourceNotFoundException("Order not found");
        }
        var payment = paymentRepository.findByOrderId(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Payment not found for this order"));
        return toResponse(payment);
    }

    public String getRazorpayKeyId() {
        return razorpayKeyId;
    }

    private String createRazorpayOrder(BigDecimal amount) {
        if (razorpayClient != null) {
            try {
                var options = new JSONObject();
                options.put("amount", amount.multiply(BigDecimal.valueOf(100)).intValue());
                options.put("currency", "INR");
                options.put("receipt", "rcpt_" + UUID.randomUUID().toString().substring(0, 8));
                var razorpayOrder = razorpayClient.orders.create(options);
                return razorpayOrder.get("id");
            } catch (RazorpayException e) {
                log.error("Razorpay order creation failed: {}", e.getMessage());
                throw new PaymentFailedException("Failed to create payment order");
            }
        }
        // Mock mode for development
        return "order_" + UUID.randomUUID().toString().substring(0, 14);
    }

    private String generateSignature(String data, String secret) {
        try {
            var mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(secret.getBytes(), "HmacSHA256"));
            return HexFormat.of().formatHex(mac.doFinal(data.getBytes()));
        } catch (Exception e) {
            throw new PaymentFailedException("Signature generation failed");
        }
    }

    private PaymentResponse toResponse(Payment p) {
        return new PaymentResponse(
                p.getId(), p.getOrder().getId(), p.getGatewayOrderId(),
                p.getGatewayPaymentId(), p.getAmount(), p.getCurrency(),
                p.getStatus(), p.getMethod(), p.getPaidAt(), p.getCreatedAt()
        );
    }
}
