package com.isma.bank.account.service;

import com.isma.bank.account.domain.*;
import com.isma.bank.account.messaging.TransferRequestedEvent;
import com.isma.bank.account.messaging.TransferResultEvent;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

@Service
public class TransferProcessor {

    private final AccountRepository accounts;
    private final ProcessedTransferRepository processed;

    public TransferProcessor(AccountRepository accounts, ProcessedTransferRepository processed) {
        this.accounts = accounts;
        this.processed = processed;
    }

    /**
     * Débit + crédit dans UNE transaction : soit les deux passent, soit aucun.
     * Les comptes sont verrouillés toujours dans le même ordre pour éviter les deadlocks.
     */
    @Transactional
    public TransferResultEvent process(TransferRequestedEvent event) {
        Optional<ProcessedTransfer> already = processed.findById(event.transferId());
        if (already.isPresent()) {
            ProcessedTransfer p = already.get();
            return new TransferResultEvent(p.getTransferId(), TransferResultEvent.Status.valueOf(p.getStatus()), p.getReason());
        }

        TransferResultEvent result = execute(event);
        processed.save(new ProcessedTransfer(event.transferId(), result.status().name(), result.reason()));
        return result;
    }

    private TransferResultEvent execute(TransferRequestedEvent e) {
        if (e.amount() == null || e.amount().signum() <= 0) {
            return TransferResultEvent.failed(e.transferId(), "Montant invalide");
        }
        if (e.fromAccount().equals(e.toAccount())) {
            return TransferResultEvent.failed(e.transferId(), "Compte source et destination identiques");
        }

        boolean fromFirst = e.fromAccount().compareTo(e.toAccount()) < 0;
        Optional<Account> first = accounts.findByNumberForUpdate(fromFirst ? e.fromAccount() : e.toAccount());
        Optional<Account> second = accounts.findByNumberForUpdate(fromFirst ? e.toAccount() : e.fromAccount());
        Optional<Account> from = fromFirst ? first : second;
        Optional<Account> to = fromFirst ? second : first;

        if (from.isEmpty()) {
            return TransferResultEvent.failed(e.transferId(), "Compte source introuvable");
        }
        if (to.isEmpty()) {
            return TransferResultEvent.failed(e.transferId(), "Compte bénéficiaire introuvable");
        }

        try {
            from.get().debit(e.amount());
        } catch (InsufficientFundsException ex) {
            return TransferResultEvent.failed(e.transferId(), "Solde insuffisant");
        }
        to.get().credit(e.amount());
        return TransferResultEvent.completed(e.transferId());
    }
}
