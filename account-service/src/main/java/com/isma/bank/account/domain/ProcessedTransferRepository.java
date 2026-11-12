package com.isma.bank.account.domain;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface ProcessedTransferRepository extends JpaRepository<ProcessedTransfer, UUID> {
}
