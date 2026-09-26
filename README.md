# Competitor Blog Spy & Real-Time Content Monitoring System

[![Engine Status](https://img.shields.io/badge/Monitoring%20Engine-ONLINE-06b6d4?style=flat-square)](#)
[![Target SLA](https://img.shields.io/badge/Detection%20Target-%E2%89%A4%205%20min-10b981?style=flat-square)](#)
[![Tests Passing](https://img.shields.io/badge/Automated%20Tests-13%20passed-10b981?style=flat-square)](#)
[![Stack](https://img.shields.io/badge/Stack-React%20%7C%20Node%20%7C%20Prisma%20%7C%20Socket.IO-8b5cf6?style=flat-square)](#)

> **Real-Time Competitor Content Intelligence & Monitoring Platform**  
> Autonomous multi-strategy blog detection engine designed to identify newly published competitor articles under 5 minutes with second-precision latency tracking, 100-site scale testing, and zero duplicate tolerance.

---

## 🌟 Key Highlights & Engineering Capabilities

1. **Sub-5-Minute Latency Tracking Engine**:
   - **Formula**: `Detection Delay = Detection Time - Publication Time`
   - Primary target: **≤ 5 minutes**.
   - **Strict transparency**: Delays above 5 minutes are NEVER rounded or concealed (e.g., `7m 08s`, `14m 32s`, `1h 04m 31s` displayed explicitly).

2. **10-Step Automatic Website Analysis**:
   - Automatically probes any domain for RSS/Atom syndication, XML sitemaps, nested sitemap indexes, article URL patterns, OpenGraph, JSON-LD schemas, and canonical links.
   - Generates recommended primary, secondary, and fallback detection strategies with architectural rationale.

3. **Three Core Detection Strategies**:
   - **Strategy 1 — RSS / Atom Feed**: High-frequency delta polling parsing title, link, guid, author, and pubDate with fallback XML parsing.
   - **Strategy 2 — XML Sitemap**: Nested sitemap index traversal extracting `<loc>` and `<lastmod>` timestamps.
   - **Strategy 3 — Direct Blog Page**: Structural HTML heuristics with Cheerio for unfeeded or JS-rendered competitor blogs.

4. **Multi-Strategy Deduplication Engine**:
   - Tracking parameter stripping (`utm_*`, `fbclid`, `gclid`, `ref`), trailing slash canonicalization, and SHA-256 content hashing.
   - If multiple strategies detect the same article, a single unique record is maintained with all detecting methods audited.

5. **100-Website Scale & Worker Pool Lab**:
   - Non-blocking concurrent worker pool (configurable: 5, 10, 20 workers) with exponential backoff retry.
   - Live interactive 100-site simulation demonstrating isolation: slow/failing sites never block healthy targets.

6. **Controlled Demo Blog & 1-Click Live Detection Workflow**:
   - Internal live competitor blog (`/demo-blog`) with dynamic RSS (`/demo-blog/feed.xml`) and Sitemap (`/demo-blog/sitemap.xml`).
   - 1-click button **"Run Live Detection Demo"** for live evaluator presentations.

7. **Production SaaS Aesthetic**:
   - Sleek dark theme (Datadog/Linear/Grafana inspired) with command palette (`Ctrl+K`), real-time WebSocket notifications, visual 7-stage detection timeline, and Recharts analytics.

---

## 🏗️ Architecture Overview

```
                          ┌───────────────────────────┐
                          │   Competitor Websites     │
                          │ (ApexTech, CloudScale...) │
                          └─────────────┬─────────────┘
                                        │
                                        ▼
                         ┌─────────────────────────────┐
                         │   10-Step Website Analyzer  │
                         └──────────────┬──────────────┘
                                        │
                 ┌──────────────────────┼──────────────────────┐
                 ▼                      ▼                      ▼
        ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
        │   RSS / Atom    │    │   XML Sitemap   │    │ Direct Blog DOM │
        │ (Fastest Delta) │    │  (<lastmod> DX) │    │ (HTML Heuristic)│
        └────────┬────────┘    └────────┬────────┘    └────────┬────────┘
                 │                      │                      │
                 └──────────────────────┼──────────────────────┘
                                        ▼
                        ┌───────────────────────────────┐
                        │   Concurrent Worker Pool      │
                        │ (Configurable 10 Workers)     │
                        └───────────────┬───────────────┘
                                        │
                                        ▼
                        ┌───────────────────────────────┐
                        │   Deduplication Engine        │
                        │ (Canonical URL + SHA256 Hash) │
                        └───────────────┬───────────────┘
                                        │
                                        ▼
                        ┌───────────────────────────────┐
                        │   Full Article Extractor      │
                        │  (OpenGraph / JSON-LD / Body) │
                        └───────────────┬───────────────┘
                                        │
                                        ▼
                        ┌───────────────────────────────┐
                        │   Prisma Database Store       │
                        │ (SQLite embedded / PG ready)  │
                        └───────────────┬───────────────┘
                                        │
                 ┌──────────────────────┼──────────────────────┐
                 ▼                      ▼                      ▼
        ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
        │ Real-Time Feed  │    │  WebSocket Push │    │ Analytics Graph │
        │  & Dashboard    │    │  Notifications  │    │ (≤ 5m SLA Line) │
        └─────────────────┘    └─────────────────┘    └─────────────────┘
```

---

## 🚀 Quick Start & Installation

### Prerequisites
- **Node.js**: v18+ (tested on Node v24)
- **NPM**: v9+

### 1. Install All Dependencies
From the repository root:
```bash
npm run install:all
```
*(Or install in `/backend` and `/frontend` individually).*

### 2. Initialize Database & Seed Baseline Data
```bash
cd backend
npx prisma db push
npm run seed
```

### 3. Run Automated Tests
```bash
npm test
```
All 13 unit & integration tests verify URL normalization, deduplication, exact delay formatting, worker pool concurrency, and XML parsing.

### 4. Start Full-Stack Application
From the repository root:
```bash
npm run dev
```

- **Frontend Console**: [http://localhost:5173](http://localhost:5173)
- **Backend API**: [http://localhost:4000](http://localhost:4000)
- **Built-in Demo Blog**: [http://localhost:4000/demo-blog](http://localhost:4000/demo-blog)
- **Demo RSS Feed**: [http://localhost:4000/demo-blog/feed.xml](http://localhost:4000/demo-blog/feed.xml)
- **Demo XML Sitemap**: [http://localhost:4000/demo-blog/sitemap.xml](http://localhost:4000/demo-blog/sitemap.xml)

---

## 🎯 Evaluator Demonstration Script (Step-by-Step)

| Step | Action | Page / Route | What to Observe |
|:---|:---|:---|:---|
| **1** | Open Dashboard | [http://localhost:5173/](http://localhost:5173/) | Live KPIs, system ONLINE badge, latency chart with 5m SLA line, real-time activity feed. |
| **2** | Inspect Competitors | `/competitors` | Baseline competitor list, detection strategies, last check, and exact unrounded average delay. |
| **3** | Add Competitor | `/competitors/new` | Enter `https://techcrunch.com` or click **ApexTech Demo** preset. Watch the **10-Step Automatic Analysis** probe RSS, sitemap, schemas, and recommend strategies. |
| **4** | 1-Click Live Demo | `/demo-lab` | Click **"Run Live Detection Demo"**. Watch an article publish to the demo blog, get detected, delay calculated (1m 49s), notification emitted, and article appear. |
| **5** | Inspect Article Detail | `/articles/:id` | View the **Visual 7-Stage Detection Timeline** with second-precision timestamps and full extracted content. |
| **6** | 100-Site Scale Test | `/scale-test` | Click **"Run 100 Website Simulation"**. Watch concurrent worker pool process fast, slow, timeout and duplicate sites in parallel. |
| **7** | View Audit Logs | `/logs` | Review check durations, URLs audited, duplicate suppression counts, and HTTP status codes. |
| **8** | Verify Checklist | `/checklist` | Review all 25 specification criteria with direct links to verify compliance. |

---

## 📊 Environment Variables (`backend/.env`)

```env
PORT=4000
DATABASE_URL="file:./dev.db"
TARGET_DELAY_SECONDS=300
DEFAULT_CONCURRENCY=10
DEFAULT_CHECK_INTERVAL_MINUTES=5
NODE_ENV=development
```

---

## 🛡️ Reliability & Duplicate Prevention

1. **URL Normalizer**:
   - Strips UTM query tags (`utm_source`, `utm_medium`, etc.)
   - Resolves relative URLs to absolute links
   - Normalizes trailing slashes and drops anchor fragments
2. **SHA-256 Content Fingerprinting**:
   - Generates cryptographic hash of sanitized title and content body to prevent republishes under different URLs.
3. **Multi-Strategy Association**:
   - If RSS detects an article and Sitemap later indexes it, the system appends `SITEMAP` to `detectedMethods` without creating a duplicate article row.
4. **Failure Isolation**:
   - Timeouts and HTTP errors increment `failureCount`, mark site as `TEMPORARILY_UNAVAILABLE`, and retry with exponential backoff without interrupting other monitored targets.
