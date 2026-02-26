# GEMINI.md — PromptVault Coding Guide

> Read this entire file before writing any code. This file is the single source of truth
> for architecture decisions, constraints, and conventions for the PromptVault project.

---

## What This Project Is

**PromptVault** is a local-first prompt library web application. It ingests 200+ prompts from the public `prompts.chat` GitHub repository (`prompts.csv`), stores them in a local SQLite database, and provides a fast, searchable, filterable React UI for browsing, copying, favoriting, and adding custom prompts.

It runs entirely on localhost. No cloud, no auth, no Docker required.

**Owner:** Darma  
**Reference files in this repo:**
- `prompt-library-PRD.md` — full product requirements, schema, API spec, implementation plan
- `prompt-library-dashboard.html` — static HTML mockup of the UI (use this as the visual reference)

---

## Technology Stack

Do not deviate from this stack without being asked.

```
Backend:
  Runtime:    Node.js 18+ (ESM modules)
  Server:     Express.js
  Database:   SQLite via better-sqlite3 (synchronous API)
  CSV Parser: csv-parse
  Search:     SQLite FTS5 (full-text search)
  Config:     dotenv

Frontend:
  Framework:  React 18 (via Vite)
  Styling:    Tailwind CSS
  HTTP:       native fetch() — no axios
  State:      useState + useEffect only — no Redux, Zustand, or Context needed

Dev tooling:
  Concurrent: concurrently (to run server + client in one command)
  Linting:    none required
```

---

## File & Folder Layout

Respect this structure exactly. Do not create files outside of it unless asked.

```
prompt-library/
├── db/
│   └── prompts.db                  ← auto-created by db.js on first run
├── scripts/
│   └── ingest.js                   ← one-time + refresh seeding script
├── server/
│   ├── index.js                    ← Express entry point
│   ├── db.js                       ← SQLite init + helper functions
│   └── routes/
│       ├── prompts.js              ← CRUD + search routes
│       └── ingest.js               ← /api/ingest trigger route
├── client/
│   ├── index.html
│   ├── vite.config.js
│   └── src/
│       ├── main.jsx
│       ├── App.jsx                 ← all filter/search state lives here
│       ├── api.js                  ← all fetch() calls live here
│       └── components/
│           ├── Header.jsx
│           ├── CategorySidebar.jsx
│           ├── TagFilter.jsx
│           ├── PromptCard.jsx
│           └── AddPromptModal.jsx
├── .env                            ← not committed
├── .env.example
├── package.json                    ← root, contains "type": "module"
└── README.md
```

---

## Environment Variables

All runtime config goes through `.env`. Read with `dotenv`.

```ini
# .env.example
PORT=3001
DB_PATH=./db/prompts.db
CSV_URL=https://raw.githubusercontent.com/f/prompts.chat/main/prompts.csv
```

Access in code:
```js
import 'dotenv/config';
const PORT = process.env.PORT || 3001;
const DB_PATH = process.env.DB_PATH || './db/prompts.db';
const CSV_URL = process.env.CSV_URL || 'https://raw.githubusercontent.com/f/prompts.chat/main/prompts.csv';
```

---

## Database: Schema & Rules

### Schema

```sql
CREATE TABLE IF NOT EXISTS prompts (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  act         TEXT NOT NULL UNIQUE,
  prompt      TEXT NOT NULL,
  category    TEXT DEFAULT 'Uncategorized',
  tags        TEXT DEFAULT '',
  source      TEXT DEFAULT 'prompts.chat',
  is_favorite INTEGER DEFAULT 0,
  created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE VIRTUAL TABLE IF NOT EXISTS prompts_fts USING fts5(
  act, prompt,
  content='prompts',
  content_rowid='id'
);

CREATE TRIGGER IF NOT EXISTS prompts_ai AFTER INSERT ON prompts BEGIN
  INSERT INTO prompts_fts(rowid, act, prompt) VALUES (new.id, new.act, new.prompt);
END;

CREATE TRIGGER IF NOT EXISTS prompts_au AFTER UPDATE ON prompts BEGIN
  INSERT INTO prompts_fts(prompts_fts, rowid, act, prompt)
    VALUES ('delete', old.id, old.act, old.prompt);
  INSERT INTO prompts_fts(rowid, act, prompt) VALUES (new.id, new.act, new.prompt);
END;
```

### Critical Rules for `better-sqlite3`

`better-sqlite3` is **synchronous**. There is no `.then()`, no `await`, no async/await for any database operation.

```js
// ✅ CORRECT — synchronous
import Database from 'better-sqlite3';
const db = new Database(DB_PATH);
const rows = db.prepare('SELECT * FROM prompts LIMIT ?').all(100);
const row  = db.prepare('SELECT * FROM prompts WHERE id = ?').get(id);
const info = db.prepare('INSERT INTO prompts (act, prompt) VALUES (?, ?)').run(act, prompt);

// ❌ WRONG — do not do this
const rows = await db.prepare('...').all();
```

Always run schema creation at server startup inside `db.js`, not in route files.

---

## Category Auto-Assignment

Used in `scripts/ingest.js` to derive `category` from the `act` field:

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

function assignCategory(act) {
  const lower = act.toLowerCase();
  for (const [category, keywords] of Object.entries(CATEGORY_MAP)) {
    if (keywords.some(k => lower.includes(k))) return category;
  }
  return 'Uncategorized';
}

function extractTags(act) {
  return act
    .toLowerCase()
    .replace(/^act as (a|an) /i, '')
    .split(/[\s,]+/)
    .filter(w => w.length > 3)
    .slice(0, 4)
    .join(',');
}
```

---

## API Specification

Server base URL: `http://localhost:3001`

### GET `/api/prompts`

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `search` | string | — | FTS5 query on `act` + `prompt` |
| `category` | string | — | Exact match on `category` |
| `tags` | string | — | Comma-separated, OR logic |
| `favorites` | `1` | — | Return only `is_favorite = 1` |
| `limit` | number | `100` | Max results |
| `offset` | number | `0` | Pagination offset |

Response shape:
```json
{
  "prompts": [
    {
      "id": 1,
      "act": "Linux Terminal",
      "prompt": "I want you to act as a linux terminal...",
      "category": "Development",
      "tags": "linux,terminal,code",
      "source": "prompts.chat",
      "is_favorite": 0,
      "created_at": "2026-02-26T08:00:00.000Z"
    }
  ],
  "total": 214
}
```

### GET `/api/categories`

```json
{ "categories": [{ "name": "Development", "count": 38 }] }
```

### GET `/api/tags`

```json
{ "tags": [{ "name": "writing", "count": 23 }] }
```

### POST `/api/prompts`

Request body:
```json
{ "act": "SEO Writer", "prompt": "You are...", "category": "Business", "tags": "seo,writing" }
```

Server auto-sets `source: "custom"`. Returns the inserted row.

### PATCH `/api/prompts/:id/favorite`

No body. Toggles `is_favorite` (0 ↔ 1). Returns `{ "id": 1, "is_favorite": 1 }`.

### POST `/api/ingest`

No body. Re-fetches CSV from `CSV_URL`, upserts new prompts (skips existing `act` values).

Returns:
```json
{ "inserted": 5, "skipped": 209, "total": 214 }
```

---

## Search Implementation

Always implement FTS5 with a LIKE fallback. Never skip the fallback — FTS5 may not be compiled into every SQLite binary.

```js
// In server/db.js or routes/prompts.js
export function searchPrompts(query, limit = 100, offset = 0) {
  try {
    // FTS5 path
    return db.prepare(`
      SELECT p.* FROM prompts_fts fts
      JOIN prompts p ON p.id = fts.rowid
      WHERE prompts_fts MATCH ?
      ORDER BY rank
      LIMIT ? OFFSET ?
    `).all(query + '*', limit, offset);
  } catch {
    // LIKE fallback
    const like = `%${query}%`;
    return db.prepare(`
      SELECT * FROM prompts
      WHERE act LIKE ? OR prompt LIKE ?
      LIMIT ? OFFSET ?
    `).all(like, like, limit, offset);
  }
}
```

---

## Frontend State Architecture

All state lives in `App.jsx`. Props flow down; callbacks flow up. No Context, no external state library.

```js
// App.jsx — canonical state shape
const [prompts, setPrompts]       = useState([]);
const [total, setTotal]           = useState(0);
const [categories, setCategories] = useState([]);
const [tags, setTags]             = useState([]);
const [filters, setFilters]       = useState({
  search:    '',
  category:  '',       // '' means all
  tags:      [],       // array of tag strings, OR logic
  favorites: false,
});
const [activeTab, setActiveTab]   = useState('grid'); // 'grid' | 'list'
const [modalOpen, setModalOpen]   = useState(false);
const [loading, setLoading]       = useState(false);
```

Fetch strategy:
```js
// useEffect fires on filter change, debounced 200ms
useEffect(() => {
  const timer = setTimeout(() => {
    fetchPrompts(filters).then(data => {
      setPrompts(data.prompts);
      setTotal(data.total);
    });
  }, 200);
  return () => clearTimeout(timer);
}, [filters]);
```

---

## `api.js` — All Fetch Wrappers

```js
const BASE = 'http://localhost:3001/api';

export async function fetchPrompts({ search, category, tags, favorites, limit = 100, offset = 0 } = {}) {
  const params = new URLSearchParams();
  if (search)    params.set('search', search);
  if (category)  params.set('category', category);
  if (tags?.length) params.set('tags', tags.join(','));
  if (favorites) params.set('favorites', '1');
  params.set('limit', limit);
  params.set('offset', offset);
  const res = await fetch(`${BASE}/prompts?${params}`);
  return res.json();
}

export async function fetchCategories() {
  const res = await fetch(`${BASE}/categories`);
  return res.json();
}

export async function fetchTags() {
  const res = await fetch(`${BASE}/tags`);
  return res.json();
}

export async function addPrompt(data) {
  const res = await fetch(`${BASE}/prompts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function toggleFavorite(id) {
  const res = await fetch(`${BASE}/prompts/${id}/favorite`, { method: 'PATCH' });
  return res.json();
}

export async function triggerIngest() {
  const res = await fetch(`${BASE}/ingest`, { method: 'POST' });
  return res.json();
}
```

---

## Visual Design System

Match the `prompt-library-dashboard.html` reference exactly.

### Colors

```
Background:  #0d0f11
Surface:     #131619   (sidebar, modal backgrounds)
Card:        #191d21   (prompt cards)
Border:      #252a2f
Border2:     #2e353d
Text:        #e8eaec
Muted:       #606870
Muted2:      #8a949e
Accent:      #e8c97a   (gold — primary actions, active states)
Green:       #5eb87f   (custom prompts, success states)
```

### Category Colors

| Category | Color |
|----------|-------|
| Writing & Editing | `#5b9bd5` |
| Development | `#5eb87f` |
| Business | `#e8c97a` |
| Education | `#c47bb0` |
| Creative | `#d4845a` |
| Personal & Wellness | `#4fa8a0` |
| Language | `#8b7acc` |
| Data & Analysis | `#c46a6a` |

### Typography

- Headings / card titles: `DM Serif Display` (Google Fonts)
- Tags, badges, meta, code: `DM Mono` (Google Fonts)
- Body, labels, buttons: `Outfit` (Google Fonts)

---

## Constraints & Forbidden Patterns

| Constraint | Reason |
|-----------|--------|
| No TypeScript | Plain JS project — keeps it simple |
| No Axios | Native fetch is sufficient |
| No ORM | Raw SQL only — `better-sqlite3` is used directly |
| No async DB calls | `better-sqlite3` is synchronous — await is incorrect |
| No Redux/Zustand/Context | State is simple enough for `useState` + props |
| No Docker | Local-only tool — Node.js 18+ is the only requirement |
| No schema changes without flagging | FTS5 triggers must stay in sync with schema |

---

## npm Scripts (root `package.json`)

```json
{
  "type": "module",
  "scripts": {
    "setup": "node scripts/ingest.js",
    "server": "node server/index.js",
    "client": "cd client && npm run dev",
    "dev": "concurrently \"npm run server\" \"npm run client\""
  }
}
```

---

## Implementation Phases

When asked "what's next" or "where are we", refer to this:

**Phase 1 — Data Foundation**
- [ ] `server/db.js` — DB init, schema creation, helper functions
- [ ] `scripts/ingest.js` — fetch CSV, parse, assign category + tags, insert to DB
- [ ] Verify: `node scripts/ingest.js` → 200+ rows in DB

**Phase 2 — Backend API**
- [ ] `server/index.js` — Express setup, CORS, JSON body parser
- [ ] `server/routes/prompts.js` — all prompt endpoints
- [ ] `server/routes/ingest.js` — ingest trigger
- [ ] Verify: curl/Postman tests pass for all endpoints

**Phase 3 — Frontend**
- [ ] Vite + React scaffold in `client/`
- [ ] `src/api.js` — all fetch wrappers
- [ ] All 5 components built and functional
- [ ] `App.jsx` state wired: search, filter, favorites, modal

**Phase 4 — Polish**
- [ ] `concurrently` `npm run dev` working
- [ ] Refresh button in UI calls `POST /api/ingest`
- [ ] README with setup instructions

---

## Key Behaviors to Always Preserve

1. **Upsert on ingest** — never duplicate prompts with the same `act`. Use `INSERT OR IGNORE`.
2. **Favorites persist** — stored in SQLite `is_favorite` field, not localStorage.
3. **Search is debounced** — 200ms delay before firing the API call.
4. **Custom prompts are visually distinct** — `source: "custom"` shows a green "custom" badge.
5. **Filters are combinable** — search + category + tags all apply simultaneously via AND logic on the backend.
6. **FTS5 always has a LIKE fallback** — the app must not crash if FTS5 is unavailable.
