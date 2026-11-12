package com.isma.bank.account.domain;

import jakarta.persistence.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "account")
public class Account {

    @Id
    private UUID id;

    @Column(nullable = false, unique = true, length = 34)
    private String number;

    @Column(nullable = false)
    private UUID ownerId;

    @Column(nullable = false, precision = 19, scale = 2)
    private BigDecimal balance;

    @Column(nullable = false, length = 3)
    private String currency;

    @Version
    private long version;

    @Column(nullable = false)
    private Instant createdAt;

    protected Account() {
    }

    public Account(String number, UUID ownerId, BigDecimal initialBalance) {
        this.id = UUID.randomUUID();
        this.number = number;
        this.ownerId = ownerId;
        this.balance = initialBalance;
        this.currency = "EUR";
        this.createdAt = Instant.now();
    }

    public void debit(BigDecimal amount) {
        requirePositive(amount);
        if (balance.compareTo(amount) < 0) {
            throw new InsufficientFundsException(number);
        }
        balance = balance.subtract(amount);
    }

    public void credit(BigDecimal amount) {
        requirePositive(amount);
        balance = balance.add(amount);
    }

    private static void requirePositive(BigDecimal amount) {
        if (amount == null || amount.signum() <= 0) {
            throw new IllegalArgumentException("Le montant doit être strictement positif");
        }
    }

    public UUID getId() { return id; }
    public String getNumber() { return number; }
    public UUID getOwnerId() { return ownerId; }
    public BigDecimal getBalance() { return balance; }
    public String getCurrency() { return currency; }
}
