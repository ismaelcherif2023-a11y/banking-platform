package com.isma.bank.transfer.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.isma.bank.transfer.config.KafkaTopicsConfig;
import com.isma.bank.transfer.domain.Transfer;
import com.isma.bank.transfer.domain.TransferRepository;
import com.isma.bank.transfer.messaging.TransferRequestedEvent;
import com.isma.bank.transfer.messaging.TransferResultEvent;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
public class TransferService {

    private static final Logger log = LoggerFactory.getLogger(TransferService.class);

    private final TransferRepository transfers;
    private final KafkaTemplate<String, String> kafka;
    private final ObjectMapper mapper;

    public TransferService(TransferRepository transfers, KafkaTemplate<String, String> kafka, ObjectMapper mapper) {
        this.transfers = transfers;
        this.kafka = kafka;
        this.mapper = mapper;
    }

    /**
     * Enregistre le virement en PENDING puis publie l'événement.
     * Le compte source vient du JWT : impossible de débiter le compte de quelqu'un d'autre.
     */
    @Transactional
    public Transfer create(UUID userId, String fromAccount, String toAccount, BigDecimal amount, String label) {
        if (fromAccount.equals(toAccount)) {
            throw new InvalidTransferException("Impossible de virer vers son propre compte");
        }
        Transfer transfer = transfers.save(new Transfer(userId, fromAccount, toAccount, amount, label));
        var event = new TransferRequestedEvent(transfer.getId(), fromAccount, toAccount, amount);
        // Clé = compte source : tous les virements d'un même compte restent ordonnés (même partition).
        kafka.send(KafkaTopicsConfig.TRANSFER_REQUESTED, fromAccount, toJson(event)).join();
        log.info("Virement {} publié ({} EUR)", transfer.getId(), amount);
        return transfer;
    }

    @Transactional
    public void applyResult(TransferResultEvent result) {
        Optional<Transfer> found = transfers.findById(result.transferId());
        if (found.isEmpty()) {
            log.warn("Résultat reçu pour un virement inconnu : {}", result.transferId());
            return;
        }
        Transfer transfer = found.get();
        if (result.status() == TransferResultEvent.Status.COMPLETED) {
            transfer.complete();
        } else {
            transfer.fail(result.reason());
        }
        log.info("Virement {} -> {}", transfer.getId(), transfer.getStatus());
    }

    @Transactional(readOnly = true)
    public List<Transfer> history(String accountNumber) {
        return transfers.findTop50ByFromAccountOrToAccountOrderByCreatedAtDesc(accountNumber, accountNumber);
    }

    @Transactional(readOnly = true)
    public Optional<Transfer> findForAccount(UUID id, String accountNumber) {
        return transfers.findById(id)
                .filter(t -> t.getFromAccount().equals(accountNumber) || t.getToAccount().equals(accountNumber));
    }

    private String toJson(Object o) {
        try {
            return mapper.writeValueAsString(o);
        } catch (JsonProcessingException e) {
            throw new IllegalStateException(e);
        }
    }
}
