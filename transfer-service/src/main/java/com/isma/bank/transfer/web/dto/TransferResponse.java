package com.isma.bank.transfer.web.dto;

import com.isma.bank.transfer.domain.Transfer;
import com.isma.bank.transfer.domain.TransferStatus;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public record TransferResponse(UUID id, String fromAccount, String toAccount, BigDecimal amount, String label,
                               TransferStatus status, String failureReason, Instant createdAt, Instant completedAt) {

    public static TransferResponse of(Transfer t) {
        return new TransferResponse(t.getId(), t.getFromAccount(), t.getToAccount(), t.getAmount(), t.getLabel(),
                t.getStatus(), t.getFailureReason(), t.getCreatedAt(), t.getCompletedAt());
    }
}
