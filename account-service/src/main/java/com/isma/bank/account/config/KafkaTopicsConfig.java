package com.isma.bank.account.config;

import org.apache.kafka.clients.admin.NewTopic;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.kafka.config.TopicBuilder;

@Configuration
public class KafkaTopicsConfig {

    public static final String TRANSFER_REQUESTED = "transfer.requested";
    public static final String TRANSFER_RESULT = "transfer.result";

    @Bean
    NewTopic transferRequestedTopic() {
        return TopicBuilder.name(TRANSFER_REQUESTED).partitions(3).replicas(1).build();
    }

    @Bean
    NewTopic transferResultTopic() {
        return TopicBuilder.name(TRANSFER_RESULT).partitions(3).replicas(1).build();
    }
}
