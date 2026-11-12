package com.isma.bank.account;

import com.isma.bank.account.domain.*;
import com.isma.bank.account.messaging.TransferRequestedEvent;
import com.isma.bank.account.messaging.TransferResultEvent;
import com.isma.bank.account.service.TransferProcessor;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class TransferProcessorTest {

    private static final String ALICE = "FR7600000000000000000000001";
    private static final String BOB = "FR7600000000000000000000002";

    private AccountRepository accounts;
    private ProcessedTransferRepository processed;
    private TransferProcessor processor;
    private Account alice;
    private Account bob;

    @BeforeEach
    void setUp() {
        accounts = mock(AccountRepository.class);
        processed = mock(ProcessedTransferRepository.class);
        processor = new TransferProcessor(accounts, processed);

        alice = new Account(ALICE, UUID.randomUUID(), new BigDecimal("100.00"));
        bob = new Account(BOB, UUID.randomUUID(), new BigDecimal("50.00"));
        when(accounts.findByNumberForUpdate(ALICE)).thenReturn(Optional.of(alice));
        when(accounts.findByNumberForUpdate(BOB)).thenReturn(Optional.of(bob));
        when(processed.findById(any())).thenReturn(Optional.empty());
    }

    @Test
    void moves_money_when_balance_is_sufficient() {
        TransferResultEvent result = processor.process(event(ALICE, BOB, "30.00"));

        assertThat(result.status()).isEqualTo(TransferResultEvent.Status.COMPLETED);
        assertThat(alice.getBalance()).isEqualByComparingTo("70.00");
        assertThat(bob.getBalance()).isEqualByComparingTo("80.00");
        verify(processed).save(any(ProcessedTransfer.class));
    }

    @Test
    void fails_without_moving_money_when_balance_is_insufficient() {
        TransferResultEvent result = processor.process(event(ALICE, BOB, "150.00"));

        assertThat(result.status()).isEqualTo(TransferResultEvent.Status.FAILED);
        assertThat(result.reason()).isEqualTo("Solde insuffisant");
        assertThat(alice.getBalance()).isEqualByComparingTo("100.00");
        assertThat(bob.getBalance()).isEqualByComparingTo("50.00");
    }

    @Test
    void fails_when_beneficiary_does_not_exist() {
        String unknown = "FR7699999999999999999999999";
        when(accounts.findByNumberForUpdate(unknown)).thenReturn(Optional.empty());

        TransferResultEvent result = processor.process(event(ALICE, unknown, "10.00"));

        assertThat(result.status()).isEqualTo(TransferResultEvent.Status.FAILED);
        assertThat(alice.getBalance()).isEqualByComparingTo("100.00");
    }

    @Test
    void is_idempotent_when_the_same_event_is_delivered_twice() {
        TransferRequestedEvent e = event(ALICE, BOB, "30.00");
        when(processed.findById(e.transferId()))
                .thenReturn(Optional.of(new ProcessedTransfer(e.transferId(), "COMPLETED", null)));

        TransferResultEvent result = processor.process(e);

        assertThat(result.status()).isEqualTo(TransferResultEvent.Status.COMPLETED);
        assertThat(alice.getBalance()).isEqualByComparingTo("100.00"); // pas de second débit
        verify(processed, never()).save(any());
    }

    @Test
    void rejects_transfer_to_same_account() {
        TransferResultEvent result = processor.process(event(ALICE, ALICE, "10.00"));
        assertThat(result.status()).isEqualTo(TransferResultEvent.Status.FAILED);
    }

    private static TransferRequestedEvent event(String from, String to, String amount) {
        return new TransferRequestedEvent(UUID.randomUUID(), from, to, new BigDecimal(amount));
    }
}
