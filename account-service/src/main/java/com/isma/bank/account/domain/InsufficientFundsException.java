package com.isma.bank.account.domain;

public class InsufficientFundsException extends RuntimeException {
    public InsufficientFundsException(String accountNumber) {
        super("Solde insuffisant sur le compte " + accountNumber);
    }
}
