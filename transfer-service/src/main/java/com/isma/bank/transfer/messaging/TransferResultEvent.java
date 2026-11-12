package com.isma.bank.transfer.messaging;

import java.util.UUID;

public record TransferResultEvent(UUID transferId, Status status, String reason) {
    public enum Status { COMPLETED, FAILED }
}
