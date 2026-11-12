package com.isma.bank.account.domain;

import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;

import java.util.Optional;
import java.util.UUID;

public interface AccountRepository extends JpaRepository<Account, UUID> {

    Optional<Account> findByOwnerId(UUID ownerId);

    boolean existsByNumber(String number);

    /** Verrou pessimiste (SELECT ... FOR UPDATE) pendant le mouvement d'argent. */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select a from Account a where a.number = :number")
    Optional<Account> findByNumberForUpdate(String number);
}
