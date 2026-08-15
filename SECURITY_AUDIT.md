# NeuraChat — Comprehensive Production Security Audit (SECURITY_AUDIT.md)

**Date**: August 2026  
**Auditor**: Senior Application Security Engineer & Full-Stack Architect  
**Target Application**: NeuraChat (React + Node.js/Express + MongoDB + Socket.io + Google Identity + Gemini AI + Lifo.sh Runtime)

---

## Executive Summary

A comprehensive application security audit was performed across the complete NeuraChat architecture, including backend Express routes, controllers, services, database models, Socket.io real-time pipelines, Google OAuth verification, file uploads, AI generation endpoints, browser storage, and the Lifo sandbox execution environment.

A total of **12 security vulnerabilities** were identified across 4 severity tiers:
- **Critical**: 3 vulnerabilities
- **High**: 4 vulnerabilities
- **Medium**: 3 vulnerabilities
- **Low**: 2 vulnerabilities

---

## Vulnerability Inventory

### 1. [CRITICAL] Insecure Direct Object Reference (IDOR) on Project & Workspace Endpoints
* **Affected Files**: `backend/controllers/project.controller.js`, `backend/services/project.service.js`
* **Affected Endpoints**:
  * `GET /projects/get-project/:projectId`
  * `GET /projects/get-messages/:projectId`
  * `PUT /projects/update-file-tree`
  * `POST /projects/:projectId/workspaces`
  * `PUT /projects/:projectId/workspaces/:workspaceId`
  * `DELETE /projects/:projectId/workspaces/:workspaceId`
* **Attack Scenario**: An authenticated attacker registers an account (User A) and crafts HTTP requests substituting `projectId` with User B's project ID (`/projects/get-project/66a1b2c3...`).
* **Impact**: Full unauthorized read and write access to all source code, workspaces, chat history, tasks, and file trees across arbitrary user projects.
* **Recommended Fix**: Enforce server-side ownership/membership checks (`project.users.includes(userId)`) on every single project and workspace endpoint.
* **Status**: In Progress / Remediation Active.

---

### 2. [CRITICAL] Socket.io Project Room Hijacking & Missing Member Authorization
* **Affected File**: `backend/server.js`
* **Affected Component**: Socket.io Connection Middleware (`io.use`)
* **Attack Scenario**: An attacker with a valid JWT connects to Socket.io passing another user's project ID in query parameters (`?projectId=TARGET_PROJECT_ID`). The middleware verified JWT validity and project existence, but failed to verify if the decoded user is a member of `socket.project.users`.
* **Impact**: The attacker joins the private project room, listens to real-time chat messages, intercepts code generation output, and can emit arbitrary `project-message` prompts to consume the victim's project resources.
* **Recommended Fix**: Resolve user from database during handshake and reject the socket connection immediately if `!socket.project.users.includes(user._id)`.
* **Status**: In Progress / Remediation Active.

---

### 3. [CRITICAL] Unauthenticated & Unrated Public AI Generation Endpoint
* **Affected Files**: `backend/routes/ai.routes.js`, `backend/controllers/ai.controller.js`
* **Affected Endpoint**: `GET /ai/get-result`
* **Attack Scenario**: Any unauthenticated client on the public internet issues GET requests to `https://api.neurachat.com/ai/get-result?prompt=...`.
* **Impact**: Uncontrolled financial cost, quota exhaustion, and denial of service on the Gemini AI service.
* **Recommended Fix**: Protect the endpoint with `authMiddleWare.authUser`, apply rate limiting, and validate maximum prompt payload length.
* **Status**: In Progress / Remediation Active.

---

### 4. [HIGH] Unauthenticated Arbitrary File Upload to Database
* **Affected File**: `backend/routes/file.routes.js`
* **Affected Endpoint**: `POST /files/upload`
* **Attack Scenario**: Unauthenticated bots or attackers upload arbitrary binary files up to 15MB each in batches of 10 files without logging in.
* **Impact**: Storage exhaustion (Denial of Service) on MongoDB, potential storage of illicit files.
* **Recommended Fix**: Enforce `authMiddleWare.authUser`, record `uploadedBy` user ID, and validate MIME types against strict allowlist.
* **Status**: In Progress / Remediation Active.

---

### 5. [HIGH] Insecure Wildcard Socket.io CORS Configuration
* **Affected File**: `backend/server.js`
* **Affected Component**: `new Server(server, { cors: { origin: ... } })`
* **Attack Scenario**: In default or unset `FRONTEND_URL` environment, Socket.io CORS fell back to `*`.
* **Impact**: Cross-origin WebSocket connections permitted from unauthorized third-party origins.
* **Recommended Fix**: Bind Socket.io CORS strictly to validated `allowedOrigins` array matching the Express application.
* **Status**: In Progress / Remediation Active.

---

### 6. [HIGH] Google Authentication Missing Rate Limiting & Account Takeover Defense
* **Affected Files**: `backend/app.js`, `backend/controllers/user.controller.js`
* **Affected Endpoint**: `POST /users/google-auth`
* **Attack Scenario**: High-frequency brute force / credential stuffing of forged ID tokens against `/users/google-auth`.
* **Impact**: Resource exhaustion, potential timing attacks, unthrottled authentication attempts.
* **Recommended Fix**: Apply `authLimiter` to `POST /users/google-auth` and strictly verify Google ID token claims (`email_verified`, `aud`, `iss`, `sub`).
* **Status**: In Progress / Remediation Active.

---

### 7. [HIGH] Client-Side Path Traversal in AI-Generated Workspace Files
* **Affected Files**: `backend/server.js`, `frontend/src/config/lifoRuntime.js`
* **Affected Component**: Workspace file syncing and AI file tree generation
* **Attack Scenario**: Malicious prompt or AI hallucination outputs file paths containing `../../.env` or `../../server.js`.
* **Impact**: Attempted overwrite or leakage of parent directory configuration files.
* **Recommended Fix**: Normalize all relative file paths and reject any path containing `..`, absolute drive letters (`C:\`), or leading slashes.
* **Status**: In Progress / Remediation Active.

---

### 8. [MEDIUM] Auth Middleware Header Parsing Fragility & Fail-Open Risk
* **Affected File**: `backend/middleware/auth.middleware.js`
* **Affected Component**: `authUser`
* **Attack Scenario**: Malformed `Authorization` header without Bearer prefix triggers unhandled type errors.
* **Impact**: Unhandled server exceptions and potential crash under adversarial input.
* **Recommended Fix**: Use optional chaining `req.headers?.authorization?.split(' ')?.[1]` and handle Redis connection errors gracefully without breaking auth.
* **Status**: In Progress / Remediation Active.

---

### 9. [MEDIUM] Missing Strict Input & ObjectId Schema Validation
* **Affected Files**: `backend/routes/project.routes.js`, `backend/controllers/project.controller.js`
* **Attack Scenario**: Supplying NoSQL operators (e.g. `{ "$ne": null }`) in request parameters or body.
* **Impact**: Potential NoSQL query manipulation or unexpected query behaviors.
* **Recommended Fix**: Enforce `mongoose.Types.ObjectId.isValid` validation middleware on all route parameters (`:projectId`, `:workspaceId`, `:taskId`).
* **Status**: In Progress / Remediation Active.

---

### 10. [MEDIUM] Security Headers & Content Security Policy Tuning
* **Affected File**: `backend/app.js`
* **Affected Component**: Helmet middleware
* **Attack Scenario**: Clickjacking or XSS injection on API responses.
* **Impact**: Missing standard defence-in-depth headers.
* **Recommended Fix**: Configure production Helmet policies with explicit CSP supporting Monaco web workers, Google Fonts, and iframe sandboxes (`frame-ancestors 'self'`).
* **Status**: In Progress / Remediation Active.

---

### 11. [LOW] Raw Database Error Information Leakage
* **Affected Files**: `backend/controllers/project.controller.js`, `backend/controllers/user.controller.js`
* **Attack Scenario**: Intentional malformed payloads trigger database driver exceptions returned directly to the client.
* **Impact**: Leaks schema structure, collection names, and internal paths.
* **Recommended Fix**: Return sanitized generic error messages in production while logging details server-side.
* **Status**: In Progress / Remediation Active.

---

### 12. [LOW] Sensitive Keys in Example Environment Template
* **Affected File**: `backend/.env.example`
* **Attack Scenario**: Developers deploying default `.env.example` values without changing placeholders.
* **Impact**: Potential credential reuse in production.
* **Recommended Fix**: Clean `.env.example` with clear dummy placeholders and instructions.
* **Status**: In Progress / Remediation Active.
