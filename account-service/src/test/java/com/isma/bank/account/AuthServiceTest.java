package com.isma.bank.account;

import com.isma.bank.account.domain.AppUser;
import com.isma.bank.account.domain.AppUserRepository;
import com.isma.bank.account.domain.AccountRepository;
import com.isma.bank.account.service.AuthService;
import com.isma.bank.account.service.TokenService;
import com.isma.bank.account.web.dto.ChangePasswordRequest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.math.BigDecimal;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class AuthServiceTest {

    private AppUserRepository users;
    private AccountRepository accounts;
    private PasswordEncoder passwordEncoder;
    private TokenService tokenService;
    private AuthService authService;

    private AppUser user;
    private UUID userId;

    @BeforeEach
    void setUp() {
        users = mock(AppUserRepository.class);
        accounts = mock(AccountRepository.class);
        passwordEncoder = mock(PasswordEncoder.class);
        tokenService = mock(TokenService.class);
        authService = new AuthService(users, accounts, passwordEncoder, tokenService, new BigDecimal("50000.00"));

        user = new AppUser("Alice Martin", "alice@example.com", "HASH_ANCIEN");
        userId = user.getId();
        when(users.findById(userId)).thenReturn(Optional.of(user));
    }

    @Test
    void change_password_updates_hash_when_current_password_matches() {
        when(passwordEncoder.matches("ancien-mdp", "HASH_ANCIEN")).thenReturn(true);
        when(passwordEncoder.encode("nouveau-mdp-123")).thenReturn("HASH_NOUVEAU");

        authService.changePassword(userId, new ChangePasswordRequest("ancien-mdp", "nouveau-mdp-123"));

        assertThat(user.getPasswordHash()).isEqualTo("HASH_NOUVEAU");
        verify(users).save(user);
    }

    @Test
    void change_password_is_refused_when_current_password_is_wrong() {
        when(passwordEncoder.matches("mauvais-mdp", "HASH_ANCIEN")).thenReturn(false);

        assertThatThrownBy(() ->
                authService.changePassword(userId, new ChangePasswordRequest("mauvais-mdp", "nouveau-mdp-123")))
                .isInstanceOf(BadCredentialsException.class);

        assertThat(user.getPasswordHash()).isEqualTo("HASH_ANCIEN"); // inchangé
        verify(users, never()).save(any());
        verify(passwordEncoder, never()).encode(any());
    }

    @Test
    void change_password_is_refused_when_user_does_not_exist() {
        UUID unknown = UUID.randomUUID();
        when(users.findById(unknown)).thenReturn(Optional.empty());

        assertThatThrownBy(() ->
                authService.changePassword(unknown, new ChangePasswordRequest("x", "nouveau-mdp-123")))
                .isInstanceOf(BadCredentialsException.class);

        verify(users, never()).save(any());
    }
}
