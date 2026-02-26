# Prompt Library — Product Requirements & Implementation Plan

**Project:** Local Prompt Library Tool  
**Source:** [github.com/f/prompts.chat](https://github.com/f/prompts.chat)  
**Author:** Darma  
**Status:** Draft v1.0  
**Date:** February 2026

---

## 1. Overview

### 1.1 Problem Statement

AI power users accumulate a large number of prompts across sessions, tools, and use cases. They rely on memory, browser bookmarks, or scattered notes to recall and reuse them — all of which fail at scale. The existing prompts.chat library is world-class in breadth (200+ prompts, CC0 licensed) but lacks personalization, offline access, and advanced filtering that a solo operator needs.

### 1.2 Goal

Build a local-first prompt library tool that ingests all prompts from the `prompts.chat` GitHub repository, stores them in a structured SQLite database, and presents a fast, searchable, filterable interface for daily use — with the ability to add custom prompts over time.

### 1.3 Success Metrics

- All prompts from `prompts.csv` ingested and browsable on first run
- Search returns results in under 100ms
- Prompts can be filtered by category and keyword tag in one click
- "Copy to clipboard" available on every prompt
- Custom prompts addable without touching code
- Zero external dependencies at runtime (fully local)

---

## 2. Users & Use Cases

**Primary User:** Darma — digital marketer, content creator, and affiliate marketer who uses AI daily across marketing, copywriting, web development, and product ideation.

### Key Use Cases

| ID | Use Case | Priority |
|----|----------|----------|
| UC-01 | Browse all prompts by category | High |
| UC-02 | Search prompts by keyword | High |
| UC-03 | Filter prompts by tag or use case | High |
| UC-04 | Copy a prompt to clipboard in one click | High |
| UC-05 | Add a custom prompt | High |
| UC-06 | Favorite a prompt for quick access | Medium |
| UC-07 | Refresh prompts from latest GitHub CSV | Medium |
| UC-08 | Export favorites as JSON or Markdown | Low |

---

## 3. Functional Requirements

### 3.1 Data Ingestion

- **FR-01:** System shall fetch `prompts.csv` from `https://raw.githubusercontent.com/f/prompts.chat/main/prompts.csv` on first run and on manual refresh
- **FR-02:** Each row shall be parsed and stored as a record with `act`, `prompt`, `category`, `tags`, `source`, `is_favorite`, and `created_at`
- **FR-03:** Categories shall be auto-assigned from keyword matching on the `act` field using a predefined category map
- **FR-04:** Tags shall be extracted from prominent nouns in the `act` field
- **FR-05:** Duplicate records (matching `act`) shall be skipped on re-ingest

### 3.2 Search & Filter

- **FR-06:** Full-text search shall query both `act` and `prompt` fields
- **FR-07:** Results shall update on each keystroke with a 200ms debounce
- **FR-08:** Category filter shall be exclusive (one at a time) with an "All" default
- **FR-09:** Tag filter shall support multi-select
- **FR-10:** Filters shall be combinable (search + category + tags simultaneously)

### 3.3 Prompt Management

- **FR-11:** Each prompt card shall display: title (`act`), truncated prompt body, category badge, and tags
- **FR-12:** Expanding a card shall reveal the full prompt text
- **FR-13:** A "Copy" button shall write the full prompt to the clipboard and show a confirmation state
- **FR-14:** Users shall be able to toggle favorites; favorites shall persist across sessions
- **FR-15:** Users shall be able to add custom prompts via a modal form (fields: act, prompt, category, tags)
- **FR-16:** Custom prompts shall be marked with `source: "custom"` and visually distinguished

### 3.4 Navigation & Layout

- **FR-17:** Sidebar shall list all categories with prompt counts
- **FR-18:** A "Favorites" tab shall show only favorited prompts
- **FR-19:** A prompt count shall be visible at all times in the header
- **FR-20:** The interface shall be fully functional offline after first ingest

---

## 4. Non-Functional Requirements

- **NFR-01 Performance:** Search results rendered under 100ms for up to 1,000 prompts
- **NFR-02 Offline-first:** No internet required after initial data load
- **NFR-03 Portability:** Runs on any machine with Node.js 18+; no Docker required
- **NFR-04 Data durability:** SQLite database stored locally at `./db/prompts.db`; prompts survive restarts
- **NFR-05 Simplicity:** Startable with a single command: `npm run dev`

---

## 5. Architecture

### 5.1 Stack

| Layer | Technology | Rationale |
|-------|-----------|-----------|
| Ingest Script | Node.js + `csv-parse` | Lightweight CSV parsing |
| Database | SQLite via `better-sqlite3` | Zero-config, local, fast |
| Backend API | Express.js | Minimal REST API |
| Frontend | React + Vite + Tailwind CSS | Fast dev, component-based |
| Search | SQLite FTS5 | No extra service, native full-text search |

### 5.2 Database Schema

```sql
-- Main prompts table
CREATE TABLE prompts (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  act         TEXT NOT NULL,
  prompt      TEXT NOT NULL,
  category    TEXT DEFAULT 'Uncategorized',
  tags        TEXT DEFAULT '',        -- comma-separated
  source      TEXT DEFAULT 'prompts.chat',
  is_favorite INTEGER DEFAULT 0,
  created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Full-text search virtual table
CREATE VIRTUAL TABLE prompts_fts USING fts5(
  act, prompt,
  content='prompts',
  content_rowid='id'
);

-- Trigger to keep FTS in sync
CREATE TRIGGER prompts_ai AFTER INSERT ON prompts BEGIN
  INSERT INTO prompts_fts(rowid, act, prompt) VALUES (new.id, new.act, new.prompt);
END;
```

### 5.3 Category Map (Ingest Logic)

```js
const CATEGORY_MAP = {
  'Writing & Editing':   ['writer', 'editor', 'copywriter', 'poet', 'journalist', 'novelist', 'proofreader', 'ghostwriter'],
  'Development':         ['developer', 'programmer', 'terminal', 'linux', 'sql', 'regex', 'debugger', 'engineer', 'python', 'javascript'],
  'Business':            ['marketing', 'sales', 'startup', 'ceo', 'product manager', 'recruiter', 'advertiser', 'entrepreneur'],
  'Education':           ['teacher', 'tutor', 'instructor', 'academic', 'researcher', 'professor', 'mentor'],
  'Creative':            ['storyteller', 'character', 'screenwriter', 'comedian', 'artist', 'rapper', 'composer', 'director'],
  'Personal & Wellness': ['life coach', 'therapist', 'advisor', 'motivational', 'psychologist', 'career counselor'],
  'Language':            ['translator', 'english', 'language', 'pronunciation', 'interpreter', 'grammar'],
  'Data & Analysis':     ['data scientist', 'statistician', 'analyst', 'excel', 'spreadsheet', 'database'],
};
```

### 5.4 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/prompts` | Get prompts; supports `?search=`, `?category=`, `?tags=`, `?favorites=1` |
| `GET` | `/api/categories` | Get all categories with prompt counts |
| `GET` | `/api/tags` | Get all tags with counts |
| `POST` | `/api/prompts` | Add a custom prompt |
| `PATCH` | `/api/prompts/:id/favorite` | Toggle favorite status |
| `POST` | `/api/ingest` | Trigger a fresh pull from GitHub CSV |

### 5.5 Project Structure

```
prompt-library/
├── db/
│   └── prompts.db              # SQLite database (auto-created)
├── scripts/
│   └── ingest.js               # CSV fetch + parse + seed script
├── server/
│   ├── index.js                # Express app entry
│   ├── db.js                   # better-sqlite3 connection + helpers
│   └── routes/
│       ├── prompts.js          # CRUD + search routes
│       └── ingest.js           # Ingest trigger route
├── client/
│   ├── index.html
│   ├── vite.config.js
│   └── src/
│       ├── main.jsx
│       ├── App.jsx
│       ├── api.js              # fetch wrappers for all endpoints
│       └── components/
│           ├── SearchBar.jsx
│           ├── CategorySidebar.jsx
│           ├── TagFilter.jsx
│           ├── PromptCard.jsx
│           ├── AddPromptModal.jsx
│           └── Header.jsx
├── .env.example
├── package.json
└── README.md
```

---

## 6. Implementation Plan

### Phase 1 — Foundation & Data (Day 1 Morning, ~2 hrs)

**Goal:** Database exists and is populated with all prompts from prompts.chat

| Task | Detail |
|------|--------|
| 1.1 | Init project with `npm init`, install `express`, `better-sqlite3`, `csv-parse`, `cors`, `dotenv` |
| 1.2 | Create `db.js` — initializes SQLite DB, creates tables + FTS virtual table on first run |
| 1.3 | Write `scripts/ingest.js` — fetches CSV from GitHub raw URL, parses rows, applies category map, inserts to DB |
| 1.4 | Run ingest script, verify 200+ prompts in DB via sqlite3 CLI |

**Deliverable:** `prompts.db` populated, ingest script working

---

### Phase 2 — Backend API (Day 1 Afternoon, ~1.5 hrs)

**Goal:** REST API serving prompts with search and filter

| Task | Detail |
|------|--------|
| 2.1 | Build Express server in `server/index.js` with CORS and JSON body parser |
| 2.2 | Implement `GET /api/prompts` with FTS5 search and SQLite filter clauses for category + tags |
| 2.3 | Implement `GET /api/categories` and `GET /api/tags` |
| 2.4 | Implement `POST /api/prompts` for custom prompts |
| 2.5 | Implement `PATCH /api/prompts/:id/favorite` |
| 2.6 | Test all endpoints with curl or Postman |

**Deliverable:** Fully working API, tested and returning real data

---

### Phase 3 — Frontend UI (Day 1 Afternoon + Evening, ~3 hrs)

**Goal:** Usable, polished React interface

| Task | Detail |
|------|--------|
| 3.1 | Scaffold Vite + React project in `client/`, configure Tailwind CSS |
| 3.2 | Set up `api.js` with fetch wrappers for all backend endpoints |
| 3.3 | Build `Header.jsx` — logo, prompt count, search bar, "Add Prompt" button |
| 3.4 | Build `CategorySidebar.jsx` — category list with counts, click to filter |
| 3.5 | Build `PromptCard.jsx` — title, truncated body, category badge, tags, copy button, favorite toggle |
| 3.6 | Build `AddPromptModal.jsx` — form with act, prompt, category (select), tags (text input) |
| 3.7 | Wire state in `App.jsx` — search, category filter, favorites tab, prompt list |
| 3.8 | Add debounced search (200ms) using `useCallback` + `setTimeout` |

**Deliverable:** Full working UI connected to backend

---

### Phase 4 — Polish & Packaging (Day 2 Morning, ~1 hr)

**Goal:** One-command startup, clean README, refresh flow

| Task | Detail |
|------|--------|
| 4.1 | Add `concurrently` package to run both server and client from root `npm run dev` |
| 4.2 | Add `POST /api/ingest` route that re-fetches CSV and upserts new prompts |
| 4.3 | Add "Refresh from GitHub" button in the UI header |
| 4.4 | Write `README.md` — setup instructions, one-command start |
| 4.5 | Create `.env.example` with `PORT=3001`, `DB_PATH=./db/prompts.db` |

**Deliverable:** Fully packaged, one-command tool

---

### Phase 5 — Optional Enhancements (Future)

| Feature | Notes |
|---------|-------|
| AI-powered tagging | Use Claude API to auto-generate tags on ingest |
| Export to Markdown | Export favorites as a `.md` file |
| Keyboard shortcuts | `Ctrl+K` to open search, `C` to copy focused card |
| Dark/light mode toggle | CSS variable swap |
| Prompt rating system | 1–5 star rating stored in DB |
| Browser extension | Inject saved prompts into Claude.ai / ChatGPT input |

---

## 7. Risks & Mitigations

| Risk | Mitigation |
|------|-----------|
| GitHub CSV URL changes | Store URL in `.env`; add fallback to local CSV copy |
| SQLite FTS5 not available | Fall back to `LIKE '%query%'` search with graceful error handling |
| Port conflict on 3001 | Make port configurable via `.env` |
| Ingest fails mid-run | Wrap in a transaction; rollback on error |

---

## 8. Definition of Done

- [ ] `npm run setup` fetches and seeds all prompts on first run
- [ ] `npm run dev` starts both server and client in one command
- [ ] Search works with instant results across 200+ prompts
- [ ] Category sidebar filters correctly
- [ ] Copy-to-clipboard works on all prompts
- [ ] Custom prompts can be added and persist after restart
- [ ] Favorites persist across sessions
- [ ] README documents setup and usage clearly
