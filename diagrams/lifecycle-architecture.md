# Lifecycle & Architecture Diagrams

Mermaid diagrams (GitHub renders these natively). Sanitized — placeholders only.

---

## 1. System architecture

```mermaid
flowchart TB
    Visitor((Prospect /<br/>Customer))
    Owner((Owner /<br/>Operator))

    subgraph Edge["Web API + Edge · Next.js / Vercel"]
        MW[Host-aware routing]
        BOT[Public sales bot]
        CTX[Source-of-truth context]
        PROD[Queue producer]
    end

    subgraph Portal["Portal · Vite/React / Vercel"]
        UI[Dashboards · settings · site editor]
    end

    subgraph Supa["Supabase · Postgres / Auth / Edge fns"]
        PG[(Postgres + RLS)]
        FN[Comms · booking · billing ·<br/>workflow engine · reputation]
    end

    subgraph Worker["Render Worker · Node·BullMQ / Railway"]
        ORCH[Render orchestrator]
        QA[Validator + vision critic]
    end

    DAEMON[Render daemon · agent loop]
    CRAWL[Crawl sidecar]
    R2[(Cloudflare R2 · CDN)]
    COMMS[Voice · SMS · iMessage · Email]

    Visitor --> MW --> CTX --> PG
    BOT --> PG
    MW --> PROD -->|Redis queue| ORCH
    Owner --> UI <--> FN <--> PG
    FN <--> COMMS
    Owner <--> COMMS
    ORCH --> CRAWL
    ORCH --> DAEMON
    ORCH --> QA --> R2
    Visitor -. served demo .-> R2
```

---

## 2. Lead → customer lifecycle

```mermaid
sequenceDiagram
    autonumber
    participant P as Prospect
    participant W as Worker / Render
    participant AI as AI Receptionist
    participant ENG as Workflow Engine
    participant O as Owner

    P->>W: Lead captured (site / call / SMS)
    W->>W: Scrape intel · build fenced prompt
    W->>W: Render demo → QA → CDN
    W-->>P: Personalized demo site
    P->>AI: Inbound call / text
    AI->>AI: Ground in client source-of-truth
    AI-->>P: Answer (refuse + escalate if unconfigured)
    AI->>ENG: Booking intent detected
    ENG->>O: 📋 Draft action — approve?
    O-->>ENG: Y (confirm)
    ENG-->>P: Booking confirmed (idempotent)
    ENG->>ENG: Schedule follow-up · metrics
    ENG->>O: Notify + report
```

---

## 3. Render pipeline (with guardrails)

```mermaid
flowchart LR
    A[Claim lead] --> B[Scrape + enrich intel]
    B --> C[Derive render inputs]
    C --> D{Research<br/>flag on?}
    D -- yes --> E[Claude research agent]
    D -- no --> F
    E --> F[Build FENCED prompt]
    F --> G[Render<br/>daemon agent loop]
    G --> H[Deterministic validator]
    H --> I{Blocking<br/>issue?}
    I -- yes --> J[Bounded repair<br/>budget-capped]
    J --> H
    I -- no --> K[White-label transform<br/>zero-LLM]
    K --> L{Vision-QA<br/>flag on?}
    L -- yes --> M[Claude critic<br/>never regress]
    L -- no --> N
    M --> N[Sanitize fail-closed]
    N --> O[Upload to CDN]
    O --> P[Persist cost + status]
```

---

## 4. Responsible-AI defense-in-depth

```mermaid
flowchart TB
    IN[Untrusted input<br/>scrape · inbound message]
    IN --> FENCE[Fence + injection scrub]
    FENCE --> GROUND[Grounded prompt<br/>refuse if unconfigured]
    GROUND --> MODEL[Routed model<br/>budget-capped]
    MODEL --> DEC{Output type}
    DEC -- consequential action --> GATE[Approval gate]
    DEC -- generated HTML --> SAN[Sanitize fail-closed]
    DEC -- any call --> LOG[Log cost + audit]
    SAN --> VAL[Validate + bounded repair]
    VAL --> WL[Deterministic white-label]
    GATE --> DONE[Execute on confirm only]
    WL --> SERVE[Serve]
    LOG --> OBS[(Observability)]
```
