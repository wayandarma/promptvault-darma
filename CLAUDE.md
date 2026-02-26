# CLAUDE.md — PromptVault Coding Guide

> This file tells Claude everything it needs to know to assist efficiently on the PromptVault project.
> Read this fully before writing any code or making any suggestion.

---

## Project Identity

**Name:** PromptVault — Local Prompt Library Tool  
**Owner:** Darma  
**Goal:** A local-first, offline-capable web app that ingests prompts from `prompts.chat`, stores them in SQLite, and surfaces them through a fast, filterable React UI.  
**Design reference:** `prompt-library-dashboard.html` — dark editorial aesthetic, DM Serif Display + DM Mono typography, color-coded categories.  
**PRD reference:** `prompt-library-PRD.md` — all functional requirements, schema, API spec, and phased plan.

---

## Stack at a Glance

| Layer | Tech | Notes |
|-------|------|-------|
| Ingest | Node.js + `csv-parse` | Fetches CSV from GitHub raw URL |
| Database | SQLite via `better-sqlite3` | Synchronous API — no async/await needed |
| Backend | Express.js | REST API on port 3001 |
| Frontend | React + Vite + Tailwind CSS | Client on port 5173 |
| Search | SQLite FTS5 | Falls back to LIKE if FTS5 unavailable |
| Runtime | Node.js 18+ | ESM modules (`"type": "module"` in package.json) |

---

## Project Structure

```
prompt-library/
├── db/
│   └── prompts.db
├── scripts/
│   └── ingest.js
├── server/
│   ├── index.js
│   ├── db.js
│   └── routes/
│       ├── prompts.js
│       └── ingest.js
├── client/
│   ├── index.html
│   ├── vite.config.js
│   └── src/
│       ├── main.jsx
│       ├── App.jsx
│       ├── api.js
│       └── components/
│           ├── Header.jsx
│           ├── CategorySidebar.jsx
│           ├── TagFilter.jsx
│           ├── PromptCard.jsx
│           └── AddPromptModal.jsx
├── .env
├── .env.example
├── package.json
└── README.md
```

---

## Database Schema

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
  INSERT INTO prompts_fts(prompts_fts, rowid, act, prompt) VALUES ('delete', old.id, old.act, old.prompt);
  INSERT INTO prompts_fts(rowid, act, prompt) VALUES (new.id, new.act, new.prompt);
END;
```

---

## Category Map

Used in `scripts/ingest.js` to auto-assign categories from the `act` field:

```js
export const CATEGORY_MAP = {
  'Writing & Editing':   ['writer', 'editor', 'copywriter', 'poet', 'journalist', 'novelist', 'proofreader', 'ghostwriter'],
  'Development':         ['developer', 'programmer', 'terminal', 'linux', 'sql', 'regex', 'debugger', 'engineer', 'python', 'javascript'],
  'Business':            ['marketing', 'sales', 'startup', 'ceo', 'product manager', 'recruiter', 'advertiser', 'entrepreneur'],
  'Education':           ['teacher', 'tutor', 'instructor', 'academic', 'researcher', 'professor', 'mentor'],
  'Creative':            ['storyteller', 'character', 'screenwriter', 'comedian', 'artist', 'rapper', 'composer', 'director'],
  'Personal & Wellness': ['life coach', 'therapist', 'advisor', 'motivational', 'psychologist', 'career counselor'],
  'Language':            ['translator', 'english', 'language', 'pronunciation', 'interpreter', 'grammar'],
  'Data & Analysis':     ['data scientist', 'statistician', 'analyst', 'excel', 'spreadsheet', 'database'],
};

export function assignCategory(act) {
  const lower = act.toLowerCase();
  for (const [category, keywords] of Object.entries(CATEGORY_MAP)) {
    if (keywords.some(k => lower.includes(k))) return category;
  }
  return 'Uncategorized';
}

export function extractTags(act) {
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

## API Contract

All endpoints are prefixed `/api`. Base URL: `http://localhost:3001`.

### GET /api/prompts

Query params:
- `search` — full-text search string (hits FTS5 `act` + `prompt`)
- `category` — exact match on `category` field
- `tags` — comma-separated, ANY match (OR logic)
- `favorites` — `1` to return only favorites
- `limit` — default `100`, max `500`
- `offset` — default `0`

Response:
```json
{
  "prompts": [ { "id": 1, "act": "...", "prompt": "...", "category": "...", "tags": "...", "source": "...", "is_favorite": 0 } ],
  "total": 214
}
```

### GET /api/categories

Response:
```json
{ "categories": [ { "name": "Writing & Editing", "count": 41 } ] }
```

### GET /api/tags

Response:
```json
{ "tags": [ { "name": "writing", "count": 23 } ] }
```

### POST /api/prompts

Body: `{ act, prompt, category, tags }`  
Sets `source: "custom"` automatically.  
Returns: `{ id, act, prompt, category, tags, source, is_favorite, created_at }`

### PATCH /api/prompts/:id/favorite

Toggles `is_favorite` (0 → 1 → 0).  
Returns: `{ id, is_favorite }`

### POST /api/ingest

No body. Triggers re-fetch from GitHub CSV. Upserts (skips existing `act` values).  
Returns: `{ inserted, skipped, total }`

---

## How Claude Should Behave on This Project

### Always do these things

**1. Write complete, runnable files.** Don't write partial snippets unless asked. If I ask for `db.js`, write the full file including imports, schema creation, and all helper functions.

**2. Use `better-sqlite3` synchronously.** This library is synchronous — never use `async/await` for database calls. Express route handlers don't need to be `async` for DB operations.

```js
// ✅ Correct
const prompts = db.prepare('SELECT * FROM prompts LIMIT ?').all(100);

// ❌ Wrong
const prompts = await db.prepare('SELECT * FROM prompts LIMIT ?').all(100);
```

**3. Always handle the FTS5 fallback.** Wrap FTS5 queries in a try/catch and fall back to `LIKE` search:

```js
function searchPrompts(query) {
  try {
    return db.prepare(`
      SELECT p.* FROM prompts_fts fts
      JOIN prompts p ON p.id = fts.rowid
      WHERE prompts_fts MATCH ?
      ORDER BY rank
    `).all(query + '*');
  } catch {
    return db.prepare(`
      SELECT * FROM prompts
      WHERE act LIKE ? OR prompt LIKE ?
    `).all(`%${query}%`, `%${query}%`);
  }
}
```

**4. Use ESM syntax throughout.** `package.json` has `"type": "module"`. Use `import`/`export`, not `require`.

**5. Respect the `.env` pattern.** All configurable values come from `process.env`:
- `PORT` — Express server port (default: 3001)
- `DB_PATH` — path to SQLite file (default: `./db/prompts.db`)
- `CSV_URL` — GitHub raw CSV URL

**6. Keep components single-responsibility.** One component, one file. `PromptCard.jsx` handles display and actions. `App.jsx` owns all state. `api.js` owns all fetch calls.

**7. Debounce search at 200ms.** Always use `useCallback` with `setTimeout` — never fire a fetch on every single keystroke.

---

### Never do these things

- Don't install unnecessary packages. The stack is locked: `better-sqlite3`, `csv-parse`, `express`, `cors`, `dotenv` for backend. `react`, `vite`, `tailwindcss` for frontend.
- Don't use `axios` — use native `fetch` in the client.
- Don't use `sequelize`, `prisma`, or any ORM — raw SQL only.
- Don't use `async better-sqlite3` — it doesn't exist; the library is synchronous by design.
- Don't add TypeScript unless explicitly asked — this is a plain JS project.
- Don't modify the database schema without flagging it — schema changes break the ingest trigger.

---

## State Architecture (Frontend)

All filter/search state lives in `App.jsx`. Child components receive props and call callbacks. No global state library needed.

```js
// App.jsx state shape
const [prompts, setPrompts] = useState([]);
const [total, setTotal] = useState(0);
const [categories, setCategories] = useState([]);
const [filters, setFilters] = useState({
  search: '',
  category: 'all',
  tags: [],        // array of tag strings
  favorites: false,
});
const [activeTab, setActiveTab] = useState('grid'); // 'grid' | 'list'
const [modalOpen, setModalOpen] = useState(false);
```

When `filters` changes, `useEffect` fires a debounced fetch to `/api/prompts`.

---

## Visual Design Tokens

Match the dashboard HTML exactly. Use these CSS variables in Tailwind via `tailwind.config.js` theme extension, or inline styles if needed:

| Token | Value | Usage |
|-------|-------|-------|
| `--bg` | `#0d0f11` | Page background |
| `--surface` | `#131619` | Sidebar, modals |
| `--card` | `#191d21` | Prompt cards |
| `--border` | `#252a2f` | Subtle dividers |
| `--accent` | `#e8c97a` | Gold — primary CTA, active states |
| `--green` | `#5eb87f` | Custom prompt badges, success |
| `--text` | `#e8eaec` | Primary text |
| `--muted` | `#606870` | Placeholder, secondary labels |
| `--muted2` | `#8a949e` | Body text, inactive nav |

Category colors: Writing=`#5b9bd5`, Dev=`#5eb87f`, Business=`#e8c97a`, Education=`#c47bb0`, Creative=`#d4845a`, Personal=`#4fa8a0`, Language=`#8b7acc`, Data=`#c46a6a`

Fonts: `DM Serif Display` (titles/headings), `DM Mono` (code, tags, meta), `Outfit` (body, UI labels)

---

## Phase Checklist

Reference this when I ask "what's next" or "where are we":

- [ ] **Phase 1** — `db.js` schema init · `scripts/ingest.js` CSV fetch + insert · verify DB populated
- [ ] **Phase 2** — Express server · all API routes · curl-tested
- [ ] **Phase 3** — Vite scaffold · `api.js` · all components built · state wired in `App.jsx`
- [ ] **Phase 4** — `concurrently` one-command start · refresh route + UI button · README

---

## Common Commands

```bash
# Install all deps
npm install

# Seed database from prompts.chat CSV
node scripts/ingest.js

# Start backend only
node server/index.js

# Start frontend only (from /client)
cd client && npm run dev

# Start both (root, after Phase 4)
npm run dev

# Inspect database
npx better-sqlite3 db/prompts.db "SELECT COUNT(*) FROM prompts"
```

---

## When I Ask for Help, Assume

- I'm building on macOS or Linux
- I have Node.js 18+ installed
- I'm comfortable reading code but want working output, not just guidance
- When I say "write the file", write the full file — not a skeleton
- When I say "fix this", look at the whole function, not just the line I pointed to
- When there are two valid approaches, pick the simpler one and tell me why
