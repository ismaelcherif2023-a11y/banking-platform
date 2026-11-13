package com.isma.bank.account.web;

import com.isma.bank.account.domain.Account;
import com.isma.bank.account.domain.AccountRepository;
import com.isma.bank.account.domain.AppUser;
import com.isma.bank.account.domain.AppUserRepository;
import com.isma.bank.account.web.dto.AccountResponse;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.util.UUID;

@RestController
@RequestMapping("/api/accounts")
public class AccountController {

    private final AccountRepository accounts;
    private final AppUserRepository users;

    public AccountController(AccountRepository accounts, AppUserRepository users) {
        this.accounts = accounts;
        this.users = users;
    }

    @GetMapping("/me")
    public AccountResponse me(@AuthenticationPrincipal Jwt jwt) {
        UUID userId = UUID.fromString(jwt.getSubject());
        Account account = accounts.findByOwnerId(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Compte introuvable"));
        Instant lastLoginAt = users.findById(userId).map(AppUser::getLastLoginAt).orElse(null);
        return new AccountResponse(account.getNumber(), jwt.getClaimAsString("name"),
                jwt.getClaimAsString("email"), account.getBalance(), account.getCurrency(),
                account.getCreatedAt(), lastLoginAt);
    }
}
