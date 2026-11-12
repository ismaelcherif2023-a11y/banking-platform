package com.isma.bank.transfer.web.dto;

import jakarta.validation.constraints.*;

import java.math.BigDecimal;

public record CreateTransferRequest(
        @NotBlank @Size(max = 34) String toAccount,
        @NotNull @DecimalMin(value = "0.01") @DecimalMax(value = "100000.00", message = "plafond de 100 000 EUR")
        @Digits(integer = 17, fraction = 2) BigDecimal amount,
        @Size(max = 140) String label) {
}
