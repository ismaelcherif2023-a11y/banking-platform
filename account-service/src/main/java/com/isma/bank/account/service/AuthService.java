package com.isma.bank.account.service;

import com.isma.bank.account.domain.*;
import com.isma.bank.account.web.dto.AuthResponse;
import com.isma.bank.account.web.dto.ChangePasswordRequest;
import com.isma.bank.account.web.dto.LoginRequest;
import com.isma.bank.account.web.dto.RegisterRequest;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.security.SecureRandom;
import java.util.UUID;

@Service
public class AuthService {

    private static final SecureRandom RANDOM = new SecureRandom();

    private final AppUserRepository users;
    private final AccountRepository accounts;
    private final PasswordEncoder passwordEncoder;
    private final TokenService tokenService;
    private final BigDecimal welcomeBalance;

    public AuthService(AppUserRepository users, AccountRepository accounts, PasswordEncoder passwordEncoder,
                       TokenService tokenService, @Value("${bank.welcome-balance}") BigDecimal welcomeBalance) {
        this.users = users;
        this.accounts = accounts;
        this.passwordEncoder = passwordEncoder;
        this.tokenService = tokenService;
        this.welcomeBalance = welcomeBalance;
    }

    @Transactional
    public AuthResponse register(RegisterRequest req) {
        if (users.existsByEmailIgnoreCase(req.email())) {
            throw new EmailAlreadyUsedException(req.email());
        }
        AppUser user = users.save(new AppUser(req.fullName().trim(), req.email().trim().toLowerCase(),
                passwordEncoder.encode(req.password())));
        Account account = accounts.save(new Account(generateAccountNumber(), user.getId(), welcomeBalance));
        return new AuthResponse(tokenService.issue(user, account), account.getNumber());
    }

    @Transactional
    public AuthResponse login(LoginRequest req) {
        AppUser user = users.findByEmailIgnoreCase(req.email().trim())
                .filter(u -> passwordEncoder.matches(req.password(), u.getPasswordHash()))
                .orElseThrow(() -> new BadCredentialsException("Email ou mot de passe incorrect"));
        Account account = accounts.findByOwnerId(user.getId())
                .orElseThrow(() -> new IllegalStateException("Aucun compte pour cet utilisateur"));
        user.recordLogin();
        users.save(user);
        return new AuthResponse(tokenService.issue(user, account), account.getNumber());
    }

    /** Change le mot de passe après vérification de l'ancien (BCrypt). */
    @Transactional
    public void changePassword(UUID userId, ChangePasswordRequest req) {
        AppUser user = users.findById(userId)
                .orElseThrow(() -> new BadCredentialsException("Utilisateur introuvable"));
        if (!passwordEncoder.matches(req.currentPassword(), user.getPasswordHash())) {
            throw new BadCredentialsException("Le mot de passe actuel est incorrect");
        }
        user.setPasswordHash(passwordEncoder.encode(req.newPassword()));
        users.save(user);
    }

    /** Numéro au format IBAN français (FR76 + 23 chiffres) — fictif, pour la démo. */
    private String generateAccountNumber() {
        String number;
        do {
            StringBuilder sb = new StringBuilder("FR76");
            for (int i = 0; i < 23; i++) {
                sb.append(RANDOM.nextInt(10));
            }
            number = sb.toString();
        } while (accounts.existsByNumber(number));
        return number;
    }
}
