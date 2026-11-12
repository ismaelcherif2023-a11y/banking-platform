package com.isma.bank.transfer.domain;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface TransferRepository extends JpaRepository<Transfer, UUID> {

    /** Virements émis OU reçus par ce compte, du plus récent au plus ancien. */
    List<Transfer> findTop50ByFromAccountOrToAccountOrderByCreatedAtDesc(String fromAccount, String toAccount);
}
