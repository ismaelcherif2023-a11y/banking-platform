CREATE TABLE app_user (
    id            UUID PRIMARY KEY,
    full_name     VARCHAR(100) NOT NULL,
    email         VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    created_at    TIMESTAMP WITH TIME ZONE NOT NULL
);

CREATE TABLE account (
    id         UUID PRIMARY KEY,
    number     VARCHAR(34)    NOT NULL UNIQUE,
    owner_id   UUID           NOT NULL REFERENCES app_user (id),
    balance    NUMERIC(19, 2) NOT NULL CHECK (balance >= 0),
    currency   VARCHAR(3)     NOT NULL,
    version    BIGINT         NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL
);

CREATE INDEX idx_account_owner ON account (owner_id);

CREATE TABLE processed_transfer (
    transfer_id  UUID PRIMARY KEY,
    status       VARCHAR(16) NOT NULL,
    reason       VARCHAR(255),
    processed_at TIMESTAMP WITH TIME ZONE NOT NULL
);
