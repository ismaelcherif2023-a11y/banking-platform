package com.isma.bank.account.messaging;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.isma.bank.account.config.KafkaTopicsConfig;
import com.isma.bank.account.service.TransferProcessor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Component;

/**
 * Consomme les demandes de virement, exécute le mouvement (transaction DB)
 * puis publie le résultat pour transfer-service.
 */
@Component
public class TransferRequestedListener {

    private static final Logger log = LoggerFactory.getLogger(TransferRequestedListener.class);

    private final TransferProcessor processor;
    private final KafkaTemplate<String, String> kafka;
    private final ObjectMapper mapper;

    public TransferRequestedListener(TransferProcessor processor, KafkaTemplate<String, String> kafka, ObjectMapper mapper) {
        this.processor = processor;
        this.kafka = kafka;
        this.mapper = mapper;
    }

    @KafkaListener(topics = KafkaTopicsConfig.TRANSFER_REQUESTED, groupId = "account-service")
    public void onTransferRequested(String payload) throws JsonProcessingException {
        TransferRequestedEvent event = mapper.readValue(payload, TransferRequestedEvent.class);
        log.info("Virement reçu {} : {} -> {} ({} EUR)", event.transferId(), event.fromAccount(), event.toAccount(), event.amount());

        TransferResultEvent result = processor.process(event);

        // .join() : si l'envoi échoue, le message n'est pas acquitté et sera relivré ;
        // l'idempotence de TransferProcessor empêche tout double débit.
        kafka.send(KafkaTopicsConfig.TRANSFER_RESULT, event.transferId().toString(), mapper.writeValueAsString(result)).join();
        log.info("Virement {} -> {}", event.transferId(), result.status());
    }
}
