CREATE TABLE users (
  id uuid PRIMARY KEY,
  email varchar(254) NOT NULL UNIQUE,
  display_name varchar(100) NOT NULL,
  password_hash text NOT NULL,
  created_at timestamptz NOT NULL,
  updated_at timestamptz NOT NULL
);

CREATE TABLE documents (
  id uuid PRIMARY KEY,
  owner_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  file_name varchar(255) NOT NULL,
  content_type text NOT NULL CHECK (content_type = 'application/pdf'),
  size integer NOT NULL CHECK (size > 0 AND size <= 10485760),
  status text NOT NULL CHECK (status IN ('draft', 'awaiting_signature', 'completed', 'expired')),
  original_blob_name text NOT NULL UNIQUE,
  completed_blob_name text UNIQUE,
  created_at timestamptz NOT NULL,
  updated_at timestamptz NOT NULL,
  completed_at timestamptz,
  uploaded_at timestamptz
);

CREATE TABLE recipients (
  id uuid PRIMARY KEY,
  document_id uuid NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  name varchar(100) NOT NULL,
  email varchar(254) NOT NULL,
  message varchar(1000),
  status text NOT NULL CHECK (status IN ('awaiting_signature', 'completed', 'expired')),
  token_hash char(64) NOT NULL UNIQUE,
  expires_at timestamptz NOT NULL,
  signed_at timestamptz,
  created_at timestamptz NOT NULL,
  updated_at timestamptz NOT NULL
);

CREATE TABLE audit_events (
  id uuid PRIMARY KEY,
  document_id uuid NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  recipient_id uuid REFERENCES recipients(id) ON DELETE SET NULL,
  actor varchar(255) NOT NULL,
  event_type text NOT NULL CHECK (event_type IN ('request_created', 'invitation_sent', 'link_opened', 'signature_submitted', 'invitation_resent')),
  status varchar(100) NOT NULL,
  created_at timestamptz NOT NULL
);

CREATE INDEX documents_owner_updated_idx ON documents (owner_id, updated_at DESC);
CREATE INDEX recipients_document_created_idx ON recipients (document_id, created_at);
CREATE INDEX audit_events_document_created_idx ON audit_events (document_id, created_at);