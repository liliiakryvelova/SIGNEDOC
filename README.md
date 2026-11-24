# SingEDoc

SingEDoc is an MVP web app for uploading a PDF, inviting one recipient through a private signing link, tracking progress, and downloading the completed PDF. Sender accounts use email/password authentication. Signing invitations are random, hashed at rest, expirable, and recipient-scoped. The recipient’s typed name and timestamp are written onto a copy of the PDF and recorded in a signing event.

**This is not a legal/compliance product.** The app does not guarantee legal enforceability, identity verification, regulatory compliance, or jurisdiction-specific retention. Have qualified stakeholders review consent language, security, and applicable requirements before any real-world use. A production email provider is not selected; the only configured sender is a local development email sink. No external email is sent.

The named `nonprofitanchor-website-privacy-notice.docx` sample was not present and was not processed or fabricated. The MVP accepts PDF only (maximum 10 MB), because it needs a browser-readable and safely stampable source. No sample DOCX or PDF is bundled.

## Local prerequisites

- Node.js 20+ and npm
- Azure Functions Core Tools v4 (`func`) to run the API
- Docker Desktop with its engine running for PostgreSQL and Azurite

Node/npm are available. At the latest local integration check, Azure Functions Core Tools (`func`) were not installed and the Docker daemon was not responding. A PostgreSQL listener answered on port 5432, but the documented local `signedoc` role was absent, so the migration could not be applied. The web app can be built and tested without these services; API builds and in-memory endpoint tests do not require them, but a real local run does.

## Start locally

1. Copy `.env.example` to `.env`; replace the local JWT secret and PostgreSQL password. Keep `.env` private.
2. Start local PostgreSQL and Azurite with `docker compose up -d`.
3. Copy `services/signedoc-api/local.settings.example.json` to `services/signedoc-api/local.settings.json` and use the same local `DATABASE_URL`, secret, and storage connection string as `.env`. This local settings file is ignored by Git.
4. Install dependencies with `npm install`.
5. Apply the schema-only PostgreSQL migration with `npm run db:migrate`. This creates the tables and indexes but does not insert seed/demo data.
6. Start the Functions API with `npm run dev:api` (port 7071).
7. In another terminal, start Vite with `npm run dev:web` (port 5173). Its `/api` requests proxy to Functions. The app uses the live API client by default; mock fixtures are retained only for isolated client tests and are not used in app workflows.

The project intentionally does not auto-create database schema or seed rows. Run the migration command before starting the API. Until migrations run, API requests requiring database access will fail. The named sample DOCX is absent and is not included or processed.

## Build and tests

- `npm test` runs shared-schema and frontend mock-client tests, API authentication tests, and an in-memory smoke test that exercises every registered API endpoint and a complete signing workflow.
- `npm run build` builds shared contracts, the Functions API, and the React app.
- `npm run test:api` and `npm run test:web` run individual suites.
- `npm run lint` checks TypeScript files.

## Implemented routes

Sender JWT auth: `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me`.

Document workflows (sender routes require bearer auth): `GET /api/health`, `GET /api/documents`, `POST /api/documents`, `PUT /api/documents/{id}/content` (upload support route), `POST /api/documents/{id}/invitations`, `GET /api/documents/{id}`, `GET /api/documents/{id}/download?kind=original|completed`.

Recipient link routes: `GET /api/sign/{token}`, `GET /api/sign/{token}/document` (private scoped PDF preview support route), `POST /api/sign/{token}`, `POST /api/sign/{token}/resend`. OpenAPI JSON is at `GET /api/openapi.json`.

PostgreSQL tables are `users`, `documents`, `recipients`, and `audit_events`; all document bytes are in private Blob containers `documents-original` and `documents-completed`. `npm run db:migrate` applies checksummed, transactional migrations, including unique email/token-hash indexes, UUID primary keys, foreign keys, and status constraints. It creates schema only; it does not add seed data.

In local development only, invitation URLs appear in the API's development log as a test sink. Do not expose those logs. In other environments invitations are persisted but not delivered until a real email provider is selected and reviewed. API process-local request throttling is only a development/basic guard; use an appropriate gateway/WAF rate policy for a scaled deployment.