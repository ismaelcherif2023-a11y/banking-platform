package com.isma.bank.transfer.web;

import com.isma.bank.transfer.service.TransferService;
import com.isma.bank.transfer.web.dto.CreateTransferRequest;
import com.isma.bank.transfer.web.dto.TransferResponse;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/transfers")
public class TransferController {

    private final TransferService transferService;

    public TransferController(TransferService transferService) {
        this.transferService = transferService;
    }

    /** 202 Accepted : le virement est accepté, son exécution est asynchrone (Kafka). */
    @PostMapping
    @ResponseStatus(HttpStatus.ACCEPTED)
    public TransferResponse create(@AuthenticationPrincipal Jwt jwt, @Valid @RequestBody CreateTransferRequest req) {
        var transfer = transferService.create(UUID.fromString(jwt.getSubject()), accountOf(jwt),
                req.toAccount().trim(), req.amount(), req.label());
        return TransferResponse.of(transfer);
    }

    @GetMapping
    public List<TransferResponse> history(@AuthenticationPrincipal Jwt jwt) {
        return transferService.history(accountOf(jwt)).stream().map(TransferResponse::of).toList();
    }

    @GetMapping("/{id}")
    public TransferResponse get(@AuthenticationPrincipal Jwt jwt, @PathVariable UUID id) {
        return transferService.findForAccount(id, accountOf(jwt))
                .map(TransferResponse::of)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Virement introuvable"));
    }

    private static String accountOf(Jwt jwt) {
        return jwt.getClaimAsString("accountNumber");
    }
}
