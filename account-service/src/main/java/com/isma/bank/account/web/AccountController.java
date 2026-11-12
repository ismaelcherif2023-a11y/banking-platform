package com.isma.bank.account.web;

import com.isma.bank.account.domain.AccountRepository;
import com.isma.bank.account.web.dto.AccountResponse;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.util.UUID;

@RestController
@RequestMapping("/api/accounts")
public class AccountController {

    private final AccountRepository accounts;

    public AccountController(AccountRepository accounts) {
        this.accounts = accounts;
    }

    @GetMapping("/me")
    public AccountResponse me(@AuthenticationPrincipal Jwt jwt) {
        return accounts.findByOwnerId(UUID.fromString(jwt.getSubject()))
                .map(a -> new AccountResponse(a.getNumber(), jwt.getClaimAsString("name"),
                        jwt.getClaimAsString("email"), a.getBalance(), a.getCurrency()))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Compte introuvable"));
    }
}
