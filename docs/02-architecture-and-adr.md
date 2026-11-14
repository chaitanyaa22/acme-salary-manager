# System Architecture & Architecture Decision Records (ADRs)

## High-Level Architecture

```mermaid
graph LR
    UI[React + Tailwind + shadcn/ui] -->|HTTPS / REST + JWT| API[NestJS API]
    API -->|Guards & Pipes| SVC[Domain Services]
    SVC -->|In-Memory Cache| CACHE[(Cache Manager)]
    SVC -->|TypeORM| DB[(PostgreSQL)]