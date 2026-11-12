package com.isma.bank.account.web.dto;

import java.math.BigDecimal;

public record AccountResponse(String number, String ownerName, String email, BigDecimal balance, String currency) {
}
