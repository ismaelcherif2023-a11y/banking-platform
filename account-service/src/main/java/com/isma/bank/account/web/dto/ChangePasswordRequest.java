package com.isma.bank.account.web.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/** Changement de mot de passe depuis l'espace « Mon compte » > Sécurité. */
public record ChangePasswordRequest(
        @NotBlank(message = "Le mot de passe actuel est requis") String currentPassword,
        @NotBlank @Size(min = 8, max = 72, message = "8 caractères minimum") String newPassword) {
}
