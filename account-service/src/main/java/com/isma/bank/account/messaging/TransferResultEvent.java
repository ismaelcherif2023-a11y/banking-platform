package com.isma.bank.account.messaging;

import java.util.UUID;

public record TransferResultEvent(UUID transferId, Status status, String reason) {

    public enum Status { COMPLETED, FAILED }

    public static TransferResultEvent completed(UUID id) {
        return new TransferResultEvent(id, Status.COMPLETED, null);
    }

    public static TransferResultEvent failed(UUID id, String reason) {
        return new TransferResultEvent(id, Status.FAILED, reason);
    }
}
