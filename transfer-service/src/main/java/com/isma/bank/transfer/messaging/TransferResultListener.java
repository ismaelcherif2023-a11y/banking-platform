package com.isma.bank.transfer.messaging;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.isma.bank.transfer.config.KafkaTopicsConfig;
import com.isma.bank.transfer.service.TransferService;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

@Component
public class TransferResultListener {

    private final TransferService transferService;
    private final ObjectMapper mapper;

    public TransferResultListener(TransferService transferService, ObjectMapper mapper) {
        this.transferService = transferService;
        this.mapper = mapper;
    }

    @KafkaListener(topics = KafkaTopicsConfig.TRANSFER_RESULT, groupId = "transfer-service")
    public void onResult(String payload) throws JsonProcessingException {
        transferService.applyResult(mapper.readValue(payload, TransferResultEvent.class));
    }
}
