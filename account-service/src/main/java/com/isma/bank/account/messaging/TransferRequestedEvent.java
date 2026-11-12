package com.isma.bank.account.messaging;

import java.math.BigDecimal;
import java.util.UUID;

public record TransferRequestedEvent(UUID transferId, String fromAccount, String toAccount, BigDecimal amount) {
}
