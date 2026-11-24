# Project Plan

**Status**: In Progress
**Created**: 2026-11-23
**Mode**: NEW

---

## 1. Project Overview

**Goal**: Build SingEDoc, a browser-based e-signature MVP that lets an authenticated sender upload a document, invite recipients using secure signing links, track progress, and retrieve the completed document. The named sample, nonprofitanchor-website-privacy-notice.docx, was not found in the workspace and has not been processed. E-signature validity, legal compliance, identity verification, and jurisdiction-specific retention requirements are not guaranteed by this plan; those require explicit requirements and an appropriate signing/compliance provider or qualified review. The project is designed so that every module is independently testable.

**App Type**: SPA + API

**API Login**: Yes

**Mode**: NEW

**Deployment Plan**: No deployment plan found

---

## 2. Backend - Azure Functions

| Component | Technology |
|-----------|-----------|
| **Language** | TypeScript |
| **Runtime** | Node |
| **Framework** | Azure Functions |
| **Package Manager** | npm |
| **Test Runner** | vitest |
| **Mocking Library** | vi.mock |
| **Test Command** | npm test |
| **Orchestration** | docker-compose |

## 3. Frontend — Web App

| Component | Technology |
|-----------|-----------|
| **Language** | TypeScript |
| **Framework** | React + Vite |
| **Package Manager** | npm |
| **Test Runner** | vitest |
| **Mocking Library** | vi.mock |
| **Test Command** | npm test |

## 4. Services Required

| Azure Service | Role in App | Environment Variable | Default Value (Local) | Classification |
|---------------|------------|---------------------|----------------------|----------------|
| Azure Blob Storage | Store private original uploads and completed signed-document files; use private containers and short-lived scoped download access. | `AZURE_STORAGE_CONNECTION_STRING` | `UseDevelopmentStorage=true` | Essential |
| PostgreSQL | Store sender accounts, document metadata, recipient invitations, signing status, and audit-event metadata. Store file bytes only in Blob Storage. | `DATABASE_URL` | `postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@localhost:5432/signedoc` | Essential |
| Azure Functions | Host the signing and document API; use managed identity for Azure resource access in Azure. | `AzureWebJobsStorage` | `UseDevelopmentStorage=true` | Essential |

MVP signing flow: sender uploads a supported document and enters recipient details; the API records a document and invitation, sends a recipient signing link, and exposes status to the sender. The recipient opens the scoped link, reviews the document, applies an electronic signature, and submits. The API records a timestamped signing event and updates status; sender can retrieve the completed file. Signing links must be random, non-guessable, narrowly scoped, revocable/expirable, and stored as hashes where practicable. Enforce file type/size limits, private storage, authorization checks, rate limits, and safe error handling. Email delivery is an MVP integration seam and can use a development-only mail sink locally; a production email provider is not selected in the requirements and must be confirmed before external sending.

## 5. Prerequisites

Unconfirmed (`❓`) tools should be verified before running the project. Node and npm were detected in both the current and initialized login shell. Browser is Chrome. Docker CLI and Compose are present, but the Docker daemon readiness probe did not return a server version, so local container emulators are unconfirmed. Azure Functions Core Tools and its VS Code integration extension were not confirmed. No Azure CLI was confirmed in the earlier environment scan.

### Run

| Tool | Service(s) | Installed | Version |
|------|------------|-----------|---------|
| Node.js | * | ✅ | v23.10.0 |
| npm | * | ✅ | 11.19.1 |
| Azure Functions Core Tools | backend | ❓ | Unconfirmed |

### Debug

| Tool | Service(s) | Installed | Version |
|------|------------|-----------|---------|
| Docker | backend (Blob Storage emulator) | ❓ | CLI 20.10.21; engine readiness unconfirmed |
| Docker Compose | backend (Blob Storage emulator) | ✅ | v2.23.3-desktop.2 |
| Google Chrome | frontend | ✅ | 157.0.8103.79 |
| VS Code extension `ms-azuretools.vscode-azurefunctions` | backend | ❓ | Unconfirmed |

## 6. Design System & UI

**Component Library**: Fluent UI v9
**Style Direction**: A calm, trustworthy document workflow with a restrained ink-blue and teal palette, clear signing-status indicators, readable document metadata, and accessible, focused forms. Use balanced spacing and subtle card elevation to keep sharing and signature actions unambiguous.
**Typography**: Segoe UI Variable, system-ui

### Color Palette

| Token | Hex | Usage |
|-------|-----|-------|
| `primary` | `#174A7E` | SignDoc identity, primary actions, active navigation, and signing-link emphasis |
| `accent` | `#167C80` | Secondary workflow highlights and completed-signature accents |
| `surface` | `#F5F8FC` | Application page background |
| `text` | `#172B3A` | Document titles, instructions, and primary interface text |
| `muted` | `#5D6F80` | Recipient details, dates, and supporting status text |
| `border` | `#D9E2EC` | Document rows, upload boundaries, and form control dividers |

### Pages

| Page | Route | Purpose | Layout |
|------|-------|---------|--------|
| Documents | `/` | Sender dashboard for document requests, recipients, and signing progress. | `header + nav + hero + main + table + footer` |
| Share Document | `/documents/new` | Upload a document, add recipients, and create a signing request. | `header + nav + main + form + actions + footer` |
| Sign Document | `/sign/:token` | Recipient reviews the shared document and submits a signature through a scoped link. | `header + main + form + actions + footer` |
| Document Details | `/documents/:id` | Sender reviews signing timeline and retrieves the completed document. | `header + nav + main + two-column(table+actions) + footer` |

### Sample Content

Documents — signing requests:
| Document | Recipient | Status | Updated |
|---|---|---|---|
| Community Partnership Agreement | Maya Chen · maya@example.org | Awaiting signature | Nov 22, 2026 |
| Volunteer Handbook Acknowledgment | Jordan Lee · jordan@example.org | Completed | Nov 21, 2026 |
| Board Meeting Confidentiality Form | Alex Rivera · alex@example.org | Draft | Nov 20, 2026 |

Share Document — fields: Document: Board Meeting Confidentiality Form.docx · Recipient name: Alex Rivera · Recipient email: alex@example.org · Message: Please review and sign by Nov 30 · Expiration: Nov 30, 2026

Sign Document — fields: Document: Community Partnership Agreement · Sender: SingEDoc Team · Recipient: Maya Chen · Signature: Maya Chen · Consent: I agree to sign electronically

Document Details — signing events:
| Event | Person | Status | Date |
|---|---|---|---|
| Request created | SingEDoc Team | Sent | Nov 20, 2026 |
| Recipient opened link | Maya Chen | Viewed | Nov 21, 2026 |
| Signature submitted | Maya Chen | Completed | Nov 22, 2026 |

The records above are mock preview data, not real recipients or documents. Across the previews, depict populated data, loading skeletons, an empty-state call to action, and a recoverable error state. The Share Document form should communicate accepted file formats, size limits, recipient fields, and expiration without implying that the absent nonprofitanchor-website-privacy-notice.docx has been uploaded.

## 7. Project Structure

```text
services/
├── signedoc-api/
│   ├── src/
│   │   ├── functions/       # Azure Functions HTTP endpoints
│   │   ├── domain/          # Document and signing rules
│   │   ├── services/        # Storage, invitation, and signing orchestration
│   │   └── persistence/     # PostgreSQL repositories and migrations
│   └── test/
└── signedoc-web/
    ├── src/
    │   ├── app/             # React routes and application shell
    │   ├── components/      # Fluent UI workflow components
    │   ├── features/        # Documents, sharing, signing, and details
    │   └── api/             # Typed API client and mock fixtures
    └── test/
```

## 8. Route Definitions

| # | Method | Path | Description | Request Body | Response Body | Status Codes |
|---|--------|------|-------------|-------------|--------------|-------------|
| 1 | GET | `/api/health` | Health check | — | `{ status, services }` | 200, 503 |
| 2 | GET | `/api/documents` | List sender's document requests and status | Query: `status?`, `cursor?` | `{ items, nextCursor }` | 200, 401, 500 |
| 3 | POST | `/api/documents` | Create document record and initiate private upload | `{ fileName, contentType, size }` | `{ documentId, uploadUrl, expiresAt }` | 201, 400, 401, 413, 415 |
| 4 | POST | `/api/documents/{id}/invitations` | Add recipient and issue a signing invitation | `{ name, email, message?, expiresAt? }` | `{ invitationId, status }` | 201, 400, 401, 404, 409 |
| 5 | GET | `/api/sign/{token}` | Load invitation and signing view for recipient | — | `{ document, senderDisplayName, recipient, expiresAt }` | 200, 404, 410 |
| 6 | POST | `/api/sign/{token}` | Submit recipient's signature and consent | `{ signature, consent, requestId }` | `{ documentId, status, signedAt }` | 200, 400, 404, 409, 410 |
| 7 | GET | `/api/documents/{id}` | Retrieve authorized document metadata and signing timeline | — | `{ document, recipients, events }` | 200, 401, 404 |
| 8 | GET | `/api/documents/{id}/download` | Obtain authorized access to original or completed document | Query: `kind=original|completed` | `{ downloadUrl, expiresAt }` | 200, 401, 404, 409 |
| 9 | POST | `/api/sign/{token}/resend` | Resend an invitation if the request remains valid | `{ requestId }` | `{ status, sentAt }` | 200, 404, 409, 410 |

## 9. Next Steps

1. Review and approve this plan in the plan preview.
2. After approval, scaffold the React frontend, Azure Functions API, tests, and local development setup.
3. Confirm an email-delivery provider and operational requirements before enabling production invitations.
4. Review signature legal effect, consent language, identity assurance, evidence/audit requirements, retention, privacy, accessibility, and applicable jurisdictional compliance with qualified stakeholders; no legal or compliance guarantee is implied by this MVP plan.
