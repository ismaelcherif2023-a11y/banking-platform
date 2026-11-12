package com.isma.bank.transfer.config;

import io.swagger.v3.oas.annotations.OpenAPIDefinition;
import io.swagger.v3.oas.annotations.enums.SecuritySchemeType;
import io.swagger.v3.oas.annotations.info.Info;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.security.SecurityScheme;
import org.springframework.context.annotation.Configuration;

/**
 * Déclare le schéma de sécurité « bearerAuth » pour Swagger UI :
 * le bouton <b>Authorize</b> apparaît et injecte l'en-tête
 * {@code Authorization: Bearer <token>} dans chaque appel.
 */
@Configuration
@OpenAPIDefinition(
        info = @Info(title = "transfer-service API", version = "1.0.0",
                description = "Création et suivi des virements (orchestration événementielle via Kafka)."),
        security = @SecurityRequirement(name = "bearerAuth"))
@SecurityScheme(
        name = "bearerAuth",
        type = SecuritySchemeType.HTTP,
        scheme = "bearer",
        bearerFormat = "JWT")
public class OpenApiConfig {
}
