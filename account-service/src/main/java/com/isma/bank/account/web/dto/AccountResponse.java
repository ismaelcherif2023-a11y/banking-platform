package com.isma.bank.account.web.dto;

import java.math.BigDecimal;
import java.time.Instant;

public record AccountResponse(
        String number,
        String ownerName,
        String email,
        BigDecimal balance,
        String currency,
        Instant createdAt,
        Instant lastLoginAt) {
}
