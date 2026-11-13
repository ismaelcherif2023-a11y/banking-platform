-- Date de dernière connexion réussie (affichée dans « Mon compte » > Sécurité).
ALTER TABLE app_user ADD COLUMN last_login_at TIMESTAMP WITH TIME ZONE;

-- Pour les comptes existants, on initialise à la date de création.
UPDATE app_user SET last_login_at = created_at WHERE last_login_at IS NULL;
