package com.isma.bank.transfer.domain;

import jakarta.persistence.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "transfer")
public class Transfer {

    @Id
    private UUID id;

    @Column(nullable = false)
    private UUID initiatorId;

    @Column(nullable = false, length = 34)
    private String fromAccount;

    @Column(nullable = false, length = 34)
    private String toAccount;

    @Column(nullable = false, precision = 19, scale = 2)
    private BigDecimal amount;

    @Column(length = 140)
    private String label;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 16)
    private TransferStatus status;

    private String failureReason;

    @Column(nullable = false)
    private Instant createdAt;

    private Instant completedAt;

    protected Transfer() {
    }

    public Transfer(UUID initiatorId, String fromAccount, String toAccount, BigDecimal amount, String label) {
        this.id = UUID.randomUUID();
        this.initiatorId = initiatorId;
        this.fromAccount = fromAccount;
        this.toAccount = toAccount;
        this.amount = amount;
        this.label = label;
        this.status = TransferStatus.PENDING;
        this.createdAt = Instant.now();
    }

    public void complete() {
        if (status == TransferStatus.PENDING) {
            status = TransferStatus.COMPLETED;
            completedAt = Instant.now();
        }
    }

    public void fail(String reason) {
        if (status == TransferStatus.PENDING) {
            status = TransferStatus.FAILED;
            failureReason = reason;
            completedAt = Instant.now();
        }
    }

    public UUID getId() { return id; }
    public UUID getInitiatorId() { return initiatorId; }
    public String getFromAccount() { return fromAccount; }
    public String getToAccount() { return toAccount; }
    public BigDecimal getAmount() { return amount; }
    public String getLabel() { return label; }
    public TransferStatus getStatus() { return status; }
    public String getFailureReason() { return failureReason; }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getCompletedAt() { return completedAt; }
}
