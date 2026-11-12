package com.isma.bank.account.domain;

import jakarta.persistence.*;

import java.time.Instant;
import java.util.UUID;

/**
 * Garantit l'idempotence : Kafka livre "au moins une fois", un même virement
 * peut donc arriver deux fois. On mémorise le résultat pour le republier
 * sans jamais rejouer le mouvement d'argent.
 */
@Entity
@Table(name = "processed_transfer")
public class ProcessedTransfer {

    @Id
    private UUID transferId;

    @Column(nullable = false, length = 16)
    private String status;

    private String reason;

    @Column(nullable = false)
    private Instant processedAt;

    protected ProcessedTransfer() {
    }

    public ProcessedTransfer(UUID transferId, String status, String reason) {
        this.transferId = transferId;
        this.status = status;
        this.reason = reason;
        this.processedAt = Instant.now();
    }

    public UUID getTransferId() { return transferId; }
    public String getStatus() { return status; }
    public String getReason() { return reason; }
}
