package com.isma.bank.account;

import com.isma.bank.account.domain.Account;
import com.isma.bank.account.domain.InsufficientFundsException;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class AccountTest {

    private final Account account = new Account("FR76TEST", UUID.randomUUID(), new BigDecimal("100.00"));

    @Test
    void debit_reduces_balance() {
        account.debit(new BigDecimal("40.00"));
        assertThat(account.getBalance()).isEqualByComparingTo("60.00");
    }

    @Test
    void debit_above_balance_is_refused() {
        assertThatThrownBy(() -> account.debit(new BigDecimal("100.01")))
                .isInstanceOf(InsufficientFundsException.class);
    }

    @Test
    void negative_amounts_are_refused() {
        assertThatThrownBy(() -> account.credit(new BigDecimal("-5")))
                .isInstanceOf(IllegalArgumentException.class);
    }
}
