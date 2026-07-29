# Backend Architecture Design & Production Blueprint
## Dr. Banner AI — Enterprise Interview & Placement Platform

This document outlines the scalable, secure, and production-ready backend architecture for the **Dr. Banner AI** platform. It has been designed from the ground up to support high-throughput real-time voice sessions, robust ATS resume processing, deep structured evaluation pipelines, role-based governance, and seamless multicloud SaaS deployments.

---

## 1. Architectural Overview

Dr. Banner AI utilizes a **modular, service-oriented architecture** (transitionable to microservices) to ensure independent scalability, fault isolation, and clear domain boundaries.

```
                  ┌────────────────────────────────────────┐
                  │          Client Applications           │
                  │   (React SPA Web / Mobile Apps)        │
                  └───────────────────┬────────────────────┘
                                      │
                                      ▼ HTTPS / WebSockets (Port 3000)
                  ┌────────────────────────────────────────┐
                  │     API Gateway / Reverse Proxy        │
                  │     (Nginx / Cloud Load Balancer)      │
                  └───────────────────┬────────────────────┘
                                      │
       ┌──────────────────────────────┼──────────────────────────────┐
       │ (Internal Routing)           │                              │
       ▼                              ▼                              ▼
┌──────────────┐               ┌──────────────┐               ┌──────────────┐
│ Auth Service │               │ User Service │               │ Resume       │
│ (JWT / RBAC) │               │ (Profiles)   │               │ Service      │
└──────┬───────┘               └──────┬───────┘               └──────┬───────┘
       │                              │                              │
       ├──────────────────────────────┼──────────────────────────────┤
       ▼                              ▼                              ▼
┌──────────────┐               ┌──────────────┐               ┌──────────────┐
│ Interview    │               │ AI Service   │               │ Analytics &  │
│ Manager      │               │ Layer        │               │ Reports      │
└──────┬───────┘               └──────┬───────┘               └──────┬───────┘
       │                              │                              │
       ├──────────────────────────────┼──────────────────────────────┤
       ▼                              ▼                              ▼
┌──────────────┐               ┌──────────────┐               ┌──────────────┐
│ Notification │               │ Settings     │               │ Audit Log    │
│ Service      │               │ Service      │               │ Service      │
└──────┬───────┘               └──────┬───────┘               └──────┬───────┘
       │                              │                              │
       └──────────────────────────────┼──────────────────────────────┘
                                      │
                                      ▼
             ┌──────────────────────────────────────────────────┐
             │            Data & Caching Backbone               │
             │  • Cloud SQL (PostgreSQL) - Primary Relational   │
             │  • Redis - Caching, Session Store, Rate Limiting │
             │  • Cloud Storage - Audio files, PDF Resumes     │
             └──────────────────────────────────────────────────┘
```

### Core Modular Services
1. **Authentication Service**: Manages secure logins, registration, password hashing (bcrypt), token issuance (AccessToken and RefreshToken), and rotation.
2. **User Service**: Manages candidate and admin profile details, user state, and onboarding metadata.
3. **Resume Service**: Handles upload (multipart), text extraction, and ATS rating evaluations.
4. **Interview Management Service**: Drives structured interview stages, orchestrates Live-WS speech connections, and records answers.
5. **AI Integration Service**: Dedicated secure proxy for AI API calls (Gemini 3.5 Flash & 3.1 Live), handling retries, fallback generators, response schemas, and caching.
6. **Analytics & Reports Service**: Computes metrics, aggregates performance statistics, generates PDF feedback forms, and curates learning roadmaps.
7. **Notification Service**: Manages event-driven notifications (web push, alert feeds, and email notifications).
8. **Administration Service**: Central console for user deprovisioning, custom interview question injection, and system calibration toggles.
9. **Audit & Logging Service**: Tracks system transactions, authentication attempts, state changes, and compliance logs.

---

## 2. Database Schema (PostgreSQL Relational Design)

The primary datastore is **PostgreSQL** (deployed on Cloud SQL). It is fully normalized, highly indexed, and enforces referential integrity through foreign keys with cascading updates and deletes where appropriate.

```sql
-- PostgreSQL Normalized Relational Schema
-- Target: Cloud SQL / PostgreSQL v15+

-- Enable UUID extension for high-scale primary keys
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. USERS TABLE
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    display_name VARCHAR(100) NOT NULL,
    photo_url TEXT,
    role VARCHAR(20) NOT NULL DEFAULT 'candidate' CHECK (role IN ('candidate', 'admin')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_users_email ON users(email);

-- 2. USER TOKENS (JWT REFRESH TOKENS)
CREATE TABLE user_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    refresh_token TEXT NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    is_revoked BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_tokens_refresh ON user_tokens(refresh_token);

-- 3. RESUMES TABLE
CREATE TABLE resumes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    file_name VARCHAR(255) NOT NULL,
    file_url TEXT,
    score INTEGER NOT NULL CHECK (score BETWEEN 0 AND 100),
    role_alignment VARCHAR(100) NOT NULL,
    extracted_skills TEXT[] NOT NULL,
    experience JSONB NOT NULL DEFAULT '[]'::jsonb,
    education JSONB NOT NULL DEFAULT '[]'::jsonb,
    projects JSONB NOT NULL DEFAULT '[]'::jsonb,
    certifications TEXT[] NOT NULL DEFAULT '{}',
    recommendations JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_resumes_user_id ON resumes(user_id);

-- 4. INTERVIEW SESSIONS TABLE
CREATE TABLE interview_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    candidate_name VARCHAR(100) NOT NULL,
    department VARCHAR(100) NOT NULL,
    target_role VARCHAR(100) NOT NULL,
    overall_score INTEGER CHECK (overall_score BETWEEN 0 AND 100),
    status VARCHAR(20) NOT NULL DEFAULT 'started' CHECK (status IN ('started', 'in_progress', 'completed', 'failed')),
    started_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP WITH TIME ZONE
);
CREATE INDEX idx_interviews_user_id ON interview_sessions(user_id);
CREATE INDEX idx_interviews_status ON interview_sessions(status);

-- 5. INTERVIEW QUESTIONS TABLE (Custom or AI Generated)
CREATE TABLE questions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID REFERENCES interview_sessions(id) ON DELETE CASCADE,
    question_text TEXT NOT NULL,
    category VARCHAR(50) NOT NULL,
    difficulty VARCHAR(20) NOT NULL CHECK (difficulty IN ('Junior', 'Mid', 'Senior')),
    expected_keywords TEXT[] NOT NULL DEFAULT '{}',
    order_index INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_questions_session ON questions(session_id);

-- 6. CANDIDATE ANSWERS TABLE
CREATE TABLE answers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL REFERENCES interview_sessions(id) ON DELETE CASCADE,
    question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
    response_text TEXT NOT NULL,
    audio_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_answers_session ON answers(session_id);

-- 7. AI EVALUATIONS TABLE
CREATE TABLE ai_evaluations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    answer_id UUID UNIQUE NOT NULL REFERENCES answers(id) ON DELETE CASCADE,
    confidence_score INTEGER NOT NULL CHECK (confidence_score BETWEEN 0 AND 100),
    technical_score INTEGER NOT NULL CHECK (technical_score BETWEEN 0 AND 100),
    communication_score INTEGER NOT NULL CHECK (communication_score BETWEEN 0 AND 100),
    clarity_score INTEGER NOT NULL CHECK (clarity_score BETWEEN 0 AND 100),
    relevance_score INTEGER NOT NULL CHECK (relevance_score BETWEEN 0 AND 100),
    filler_words_count INTEGER NOT NULL DEFAULT 0,
    strength TEXT NOT NULL,
    improvement TEXT NOT NULL,
    evaluated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_evaluations_answer ON ai_evaluations(answer_id);

-- 8. COMPREHENSIVE REPORTS TABLE
CREATE TABLE reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID UNIQUE NOT NULL REFERENCES interview_sessions(id) ON DELETE CASCADE,
    summary TEXT NOT NULL,
    technical_review TEXT NOT NULL,
    communication_review TEXT NOT NULL,
    confidence_review TEXT NOT NULL,
    career_fit TEXT NOT NULL,
    suggested_roles TEXT[] NOT NULL DEFAULT '{}',
    generated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 9. LEARNING ROADMAPS
CREATE TABLE learning_roadmaps (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    report_id UUID REFERENCES reports(id) ON DELETE SET NULL,
    title VARCHAR(150) NOT NULL,
    description TEXT NOT NULL,
    estimated_weeks INTEGER NOT NULL,
    difficulty_level VARCHAR(20) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_roadmaps_user ON learning_roadmaps(user_id);

-- 10. ROADMAP MILESTONES
CREATE TABLE roadmap_milestones (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    roadmap_id UUID NOT NULL REFERENCES learning_roadmaps(id) ON DELETE CASCADE,
    title VARCHAR(150) NOT NULL,
    description TEXT NOT NULL,
    resources TEXT[] NOT NULL DEFAULT '{}',
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed')),
    order_index INTEGER NOT NULL
);
CREATE INDEX idx_milestones_roadmap ON roadmap_milestones(roadmap_id);

-- 11. NOTIFICATIONS TABLE
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(150) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(30) NOT NULL DEFAULT 'info' CHECK (type IN ('info', 'roadmap', 'interview', 'security')),
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_notifications_user_read ON notifications(user_id, is_read);

-- 12. SYSTEM CONFIG / CALIBRATION SETTINGS
CREATE TABLE system_settings (
    id SERIAL PRIMARY KEY,
    key VARCHAR(100) UNIQUE NOT NULL,
    value JSONB NOT NULL,
    description TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 13. CENTRALIZED AUDIT LOGS
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id VARCHAR(100),
    ip_address VARCHAR(45) NOT NULL,
    user_agent TEXT NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_audit_logs_timestamp ON audit_logs(timestamp);
CREATE INDEX idx_audit_logs_user ON audit_logs(user_id);
```

---

## 3. REST API Specification

Dr. Banner AI utilizes a strict, REST-compliant endpoint system. All responses adhere to a consistent JSON specification to guarantee high developer usability and seamless parsing.

### Global Request/Response Format

#### Standard Success Payload
```json
{
  "success": true,
  "data": { ... },
  "metadata": {
    "timestamp": "2026-07-18T11:53:00Z",
    "requestId": "req_8ffb736b6bc7"
  }
}
```

#### Standard Error Payload
```json
{
  "success": false,
  "error": {
    "code": "AUTHENTICATION_FAILED",
    "message": "The credentials provided are invalid.",
    "details": []
  }
}
```

---

### Endpoints Directory

| Method | Endpoint | Access Level | Description |
| :--- | :--- | :--- | :--- |
| **POST** | `/api/v1/auth/register` | Public | Register a candidate user. |
| **POST** | `/api/v1/auth/login` | Public | Sign in and receive secure HTTPOnly token cookies. |
| **POST** | `/api/v1/auth/refresh` | Public | Refresh the access token using the HttpOnly refresh token. |
| **POST** | `/api/v1/auth/logout` | Session | Revoke refresh tokens and clear HTTP cookies. |
| **GET** | `/api/v1/users/profile` | Session | Retrieve current logged-in profile. |
| **POST** | `/api/v1/resume/analyze` | Session | Parse and score resume text/binary with Gemini. |
| **POST** | `/api/v1/interviews/sessions` | Session | Initiate a new structured interview session. |
| **GET** | `/api/v1/interviews/sessions` | Session | Get past session records. Support pagination. |
| **GET** | `/api/v1/interviews/sessions/:id` | Session | Fetch details of a session, including transcriptions. |
| **POST** | `/api/v1/interviews/sessions/:id/evaluate` | Session | Score candidate's audio transcriptions. |
| **GET** | `/api/v1/interviews/sessions/:id/report` | Session | Fetch comprehensive performance reports and roadmaps. |
| **GET** | `/api/v1/analytics/readiness` | Session | Aggregate performance indicators across candidate sessions. |
| **GET** | `/api/v1/notifications` | Session | Fetch notification inbox. Supports sorting. |
| **POST** | `/api/v1/notifications/:id/read` | Session | Mark a notification as read. |
| **GET** | `/api/v1/admin/users` | Admin | Search, filter, and paginate through platform users. |
| **PUT** | `/api/v1/admin/users/:id/role` | Admin | Change authorization roles (Candidate <-> Admin). |
| **DELETE** | `/api/v1/admin/users/:id` | Admin | Decommission a user profile and delete their history. |
| **POST** | `/api/v1/admin/questions` | Admin | Add custom evaluation question to the dynamic bank. |
| **DELETE** | `/api/v1/admin/questions/:id` | Admin | Retire a custom question from the bank. |
| **GET** | `/api/v1/admin/system/health` | Admin | Fetch system telemetry (CPU, Memory, API latency, Logs). |
| **GET** | `/api/v1/admin/audit-logs` | Admin | Fetch compliance audit logs. |

---

## 4. Security & Access Governance (RBAC & JWT)

### Authentication Flow
1. **Password Hashing**: Users' passwords are encrypted server-side using **bcrypt** with a work factor of 12.
2. **Double-Token Design**:
   - **Access Token**: Short-lived (15 minutes), passed inside the `Authorization: Bearer <JWT>` header. Contains `userId`, `email`, and `role`.
   - **Refresh Token**: Long-lived (7 days), stored inside a secure `HttpOnly`, `SameSite=Strict`, `Secure` cookie. Stored inside PostgreSQL table `user_tokens` to support immediate revocation.
3. **Token Rotation (Security Measure)**: Refreshing an access token revokes the old refresh token and issues a new pair to prevent reuse attacks.

### Role-Based Access Control Middleware (RBAC)
Routes are protected by a hierarchy of validation gates. Only authenticated users can request session data, and only accounts with the `admin` role flag can execute administrative endpoints.

```typescript
// Conceptual RBAC Middleware implementation
export const authorizeRole = (requiredRole: 'admin' | 'candidate') => {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = req.user; // Appended by verifyJWT middleware
    
    if (!user) {
      return res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Authentication required' }
      });
    }

    if (requiredRole === 'admin' && user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'Administrative permissions required' }
      });
    }

    next();
  };
};
```

---

## 5. Scalable AI Integration Service Layer

Rather than allowing the frontend client to communicate directly with third-party providers (e.g., Google Gemini), Dr. Banner AI implements a **strict backend AI Service Layer**. This design offers major structural advantages:

```
┌─────────────────┐       HTTPS       ┌───────────────────┐      SSL/TLS      ┌────────────────────┐
│ Frontend Client  ├─────────────────>│  AI Service Layer ├──────────────────>│ Gemini API / LLM   │
│                 │   (Port 3000)     │ (Express Backend) │ (Secure Server Key)│ (Google Cloud Run) │
└─────────────────┘                   └─────────┬─────────┘                    └────────────────────┘
                                                │
                                                ▼ Cache Verification
                                      ┌───────────────────┐
                                      │ Redis Cache Store │
                                      └───────────────────┘
```

### Strategic Benefits
- **API Key Secrecy**: The `GEMINI_API_KEY` remains securely loaded inside the environment variables of the custom server. No external user can ever extract it.
- **Strict Response Schema Enforcement**: The server guarantees that incoming LLM payloads conform to typing guidelines through structural configuration schema variables.
- **Fail-safe Local Fallback**: If the Gemini API experiences network timeouts or rate limits, the AI service seamlessly switches to a rule-based prompt resolver without crashing the UI.
- **Caching Repetitive Requests**: Identical resume analysis strings or questions can be computed once and cached on Redis to eliminate redundant LLM costs.

---

## 6. Performance Optimization Strategies

1. **Redis Caching**:
   - Frequently requested static resources (like custom interview questions) are kept in memory on Redis with an expiration window of 2 hours.
   - User profile details are cached to minimize direct PostgreSQL reads.
2. **Database Indexing**:
   - Foreign keys (`user_id`, `session_id`, `answer_id`) and search targets (`email`, `status`) are fully indexed to support constant-time operations.
3. **Pagination & Query Limits**:
   - Candidate history logs and administrator directory tables are fetched in paginated blocks of 10 items using SQL limits and offsets.
4. **Asynchronous PDF and Roadmap Generation**:
   - Generating large structured PDFs or AI-generated roadmap curriculums is handled off-thread in the background, signaling completion to the client via notifications or WebSocket updates.

---

## 7. Cloud-Ready Architecture & Deployment (SaaS)

Dr. Banner AI is engineered to run in a fully containers-first, modern SaaS cloud ecosystem.

```
┌──────────────────────────────────────────────────────────────────────────┐
│                           Google Cloud Platform                          │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌────────────────────────┐                   ┌───────────────────────┐  │
│  │   Google Cloud Run     │                   │  Cloud Storage Bucket │  │
│  │   (Express Container)  │◄─────────────────►│ (Audio & PDF Uploads) │  │
│  └───────────┬────────────┘                   └───────────────────────┘  │
│              │                                                           │
│              ▼ VPC Access Connector                                      │
│  ┌────────────────────────────────────────────────────────────────────┐  │
│  │                            Private VPC                             │  │
│  │                                                                    │  │
│  │   ┌──────────────────────────┐         ┌────────────────────────┐  │  │
│  │   │     Cloud SQL (Postgres) │         │     Cloud Memorystore  │  │  │
│  │   │  • Managed Relational DB │         │  • Managed Redis Cache │  │  │
│  │   └──────────────────────────┘         └────────────────────────┘  │  │
│  └────────────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────────────┘
```

### Production Deployment Stack
- **Server Platform**: Deployed on **Google Cloud Run** inside serverless containers, allowing the API instances to automatically scale up on traffic spikes and scale to zero during off-hours.
- **Relational Databases**: Powered by **Google Cloud SQL** running PostgreSQL with High Availability configuration.
- **In-Memory Store**: Powered by **Google Cloud Memorystore (Redis)** for low-latency session and caching workloads.
- **Object Storage**: Powered by **Google Cloud Storage (GCS)** for storing resumes, voice tracks, and custom generated scorecards.
- **Process Worker Orchestration**: Powered by **Cloud Pub/Sub** to handle resource-heavy asynchronous tasks (e.g., ATS resume keyword ranking).

---

## 8. Logging, Monitoring & Structured Errors

- **Structured System Logging**: Logs are written as single-line JSON streams directly to standard output, making them fully queryable on **Google Cloud Logging** (Stackdriver).
- **Audit Trails**: Security actions (failed logins, profile deletions, role switches) are written to the database `audit_logs` table for absolute accountability.
- **Error Middleware**: Consistent error payload structure returned for all 4xx/5xx requests.
