# SentinelX — Website Security Scanner & Risk Assessment Platform

> **"Know Your Website. Secure Your Business."**

SentinelX is an enterprise-grade website security scanner and risk posture assessment platform built from scratch. It inspects publicly observable security signals, calculates transparent 0–100 cybersecurity scores, provides plain-language risk breakdowns, and delivers production-ready configuration fixes.

---

## Key Features

1. **Passive & Safe Reconnaissance Engine**
   - Strictly non-intrusive public checks — no destructive testing, penetration testing, exploitation, brute force, or DoS.
   - Built-in SSRF protections: blocks `localhost`, `127.0.0.1`, RFC 1918 private subnets, cloud metadata (`169.254.169.254`), and reserved addresses.

2. **Security Inspection Modules (`/lib/scanner/`)**
   - **HTTPS & TLS Handshake**: Inspects certificate chain, CA trust, validity days remaining, negotiated protocol (TLS 1.3 / 1.2), and cipher suites via Node.js TLS SNI.
   - **HTTP Security Headers**: Deep audit of Content-Security-Policy (CSP), Strict-Transport-Security (HSTS), X-Content-Type-Options, X-Frame-Options, Referrer-Policy, and Permissions-Policy.
   - **Cookie Security**: Audits public `Set-Cookie` attributes (`Secure`, `HttpOnly`, `SameSite=Lax/Strict`).
   - **Information Disclosure**: Detects verbose `Server` and `X-Powered-By` framework banners, RFC 9116 `security.txt` presence, and sensitive paths in `robots.txt`.
   - **DNS Security & Hardening**: Queries Certificate Authority Authorization (CAA) records, IPv6 readiness (AAAA), and anti-spoofing policies (SPF / DMARC).

3. **Transparent Scoring Engine**
   - Weighted categories: Headers (30%), HTTPS/TLS (25%), Cookies (15%), Information Disclosure (15%), DNS Hardening (15%).
   - Deterministic Letter Grades: `A+`, `A`, `B`, `C`, `D`, `F`.
   - Critical override rule: If an untrusted/expired certificate is detected, composite score is capped at 45.

4. **Interactive 3D "Cyber Shield"**
   - High-performance Canvas/WebGL 3D holographic shield with cursor parallax tilt, orbital particle nodes, concentric rotating rings, and scanning laser sweeps.
   - Dynamically transitions between `idle`, `scanning`, and `complete` (colored by risk level).

5. **Actionable Remediation Engine**
   - 1-click tabbed copyable configuration snippets for **Nginx**, **Apache**, **Cloudflare**, **Next.js**, and **Express/Helmet**.
   - "Mark as Reviewed" status persistence for engineering team audits.

6. **Enterprise Export & Consultation**
   - **Download PDF Report**: Formatted layout for executive and compliance reviews.
   - **Export JSON**: Full structured vulnerability and check telemetry.
   - **Request Security Consultation**: Structured workflow pre-filled with scan findings sent to `/api/consultation` (extensible via webhooks / email APIs).

7. **Surveillance & Monitoring Dashboard**
   - Continuous domain monitoring with frequency scheduling (Daily, Weekly, Continuous).
   - SVG score drift timeline chart (e.g. 78 → 81 → 84 → 79).
   - Searchable assessment history table with filtering by risk level.

8. **Security Knowledge Base (`/learn`)**
   - 7 in-depth guides explaining CSP, HSTS, TLS handshakes, cookie attributes, scoring methodology, and production pre-flight audit checklists.

---

## Technology Stack

- **Framework**: Next.js 14 (App Router, TypeScript)
- **Styling**: Tailwind CSS + Custom Cyber Design System (CSS variables, glassmorphism, neon accents)
- **Icons**: Lucide React
- **Visualization**: HTML5 Canvas 3D Cyber Shield engine
- **Scanner Core**: Native Node.js `tls`, `dns/promises`, `fetch` with SSRF Guard

---

## Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Environment Configuration
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

### 3. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 4. Build for Production
```bash
npm run build
npm run start
```

---

## API Reference

- `POST /api/scan`: Initiates a security assessment. Body: `{ "url": "https://example.com" }`
- `GET /api/scan/:id`: Retrieves a stored assessment by ID.
- `GET /api/scans`: Returns historical scan list for the dashboard.
- `POST /api/consultation`: Submits an expert assistance inquiry.
- `GET /api/monitoring`: Lists monitored website targets and score timelines.
- `POST /api/monitoring`: Adds a domain to continuous surveillance.

---

## Responsible Scanning Disclaimer
SentinelX performs non-intrusive, publicly observable assessments based on standard network and web headers. It is not a substitute for an authorized penetration test or internal source code audit.
