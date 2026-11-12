package com.isma.bank.transfer;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.isma.bank.transfer.domain.Transfer;
import com.isma.bank.transfer.domain.TransferRepository;
import com.isma.bank.transfer.domain.TransferStatus;
import com.isma.bank.transfer.messaging.TransferResultEvent;
import com.isma.bank.transfer.service.InvalidTransferException;
import com.isma.bank.transfer.service.TransferService;
import io.micrometer.core.instrument.simple.SimpleMeterRegistry;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.kafka.support.SendResult;

import java.math.BigDecimal;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.CompletableFuture;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

class TransferServiceTest {

    private TransferRepository repo;
    private KafkaTemplate<String, String> kafka;
    private TransferService service;
    private SimpleMeterRegistry meters;

    @BeforeEach
    @SuppressWarnings("unchecked")
    void setUp() {
        repo = mock(TransferRepository.class);
        kafka = mock(KafkaTemplate.class);
        meters = new SimpleMeterRegistry();
        service = new TransferService(repo, kafka, new ObjectMapper().findAndRegisterModules(), meters);
        when(repo.save(any(Transfer.class))).thenAnswer(inv -> inv.getArgument(0));
        CompletableFuture<SendResult<String, String>> ok = CompletableFuture.completedFuture(null);
        when(kafka.send(anyString(), anyString(), anyString())).thenReturn(ok);
    }

    @Test
    void creates_pending_transfer_and_publishes_event_keyed_by_source_account() {
        Transfer t = service.create(UUID.randomUUID(), "FR76A", "FR76B", new BigDecimal("25.00"), "Loyer");

        assertThat(t.getStatus()).isEqualTo(TransferStatus.PENDING);
        verify(kafka).send(eq("transfer.requested"), eq("FR76A"), contains(t.getId().toString()));
    }

    @Test
    void refuses_transfer_to_own_account() {
        assertThatThrownBy(() -> service.create(UUID.randomUUID(), "FR76A", "FR76A", BigDecimal.TEN, null))
                .isInstanceOf(InvalidTransferException.class);
        verifyNoInteractions(kafka);
    }

    @Test
    void applies_completed_result() {
        Transfer t = new Transfer(UUID.randomUUID(), "FR76A", "FR76B", BigDecimal.TEN, null);
        when(repo.findById(t.getId())).thenReturn(Optional.of(t));

        service.applyResult(new TransferResultEvent(t.getId(), TransferResultEvent.Status.COMPLETED, null));

        assertThat(t.getStatus()).isEqualTo(TransferStatus.COMPLETED);
        assertThat(t.getCompletedAt()).isNotNull();
        assertThat(meters.counter("bank.transfers", "status", "COMPLETED").count()).isEqualTo(1.0);
    }

    @Test
    void applies_failed_result_with_reason_and_ignores_later_duplicates() {
        Transfer t = new Transfer(UUID.randomUUID(), "FR76A", "FR76B", BigDecimal.TEN, null);
        when(repo.findById(t.getId())).thenReturn(Optional.of(t));

        service.applyResult(new TransferResultEvent(t.getId(), TransferResultEvent.Status.FAILED, "Solde insuffisant"));
        service.applyResult(new TransferResultEvent(t.getId(), TransferResultEvent.Status.COMPLETED, null));

        assertThat(t.getStatus()).isEqualTo(TransferStatus.FAILED);
        assertThat(t.getFailureReason()).isEqualTo("Solde insuffisant");
        // La relivraison (COMPLETED) ne doit pas recompter : 1 seul FAILED, 0 COMPLETED.
        assertThat(meters.counter("bank.transfers", "status", "FAILED").count()).isEqualTo(1.0);
        assertThat(meters.counter("bank.transfers", "status", "COMPLETED").count()).isEqualTo(0.0);
    }
}
