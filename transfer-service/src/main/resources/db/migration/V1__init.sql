CREATE TABLE transfer (
    id             UUID PRIMARY KEY,
    initiator_id   UUID           NOT NULL,
    from_account   VARCHAR(34)    NOT NULL,
    to_account     VARCHAR(34)    NOT NULL,
    amount         NUMERIC(19, 2) NOT NULL CHECK (amount > 0),
    label          VARCHAR(140),
    status         VARCHAR(16)    NOT NULL,
    failure_reason VARCHAR(255),
    created_at     TIMESTAMP WITH TIME ZONE NOT NULL,
    completed_at   TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_transfer_from ON transfer (from_account, created_at DESC);
CREATE INDEX idx_transfer_to   ON transfer (to_account, created_at DESC);
