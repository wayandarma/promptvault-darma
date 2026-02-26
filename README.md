# PromptVault

**PromptVault** is a local-first prompt library web application designed to help you browse, search, favorite, and manage thousands of AI prompts. It runs entirely on localhost with a fast, responsive UI built with React and Tailwind CSS, powered by a Node.js and SQLite backend.

No cloud, no forced authentication — just your personal, lightning-fast prompt vault.

## Features

- **Local First**: Runs entirely on your machine.
- **Fast Search**: Utilizes SQLite FTS5 for full-text search.
- **Categorization & Tagging**: Automatically categorizes prompts during ingestion.
- **Favorites**: Mark prompts as favorites for easy access later.
- **Custom Prompts**: Add and manage your own custom prompts directly from the UI.

## Tech Stack

- **Frontend**: React 18, Vite, Tailwind CSS
- **Backend**: Node.js, Express.js
- **Database**: SQLite (via `better-sqlite3`)

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- npm (comes with Node.js)

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/wayandarma/promptvault-darma.git
   cd promptvault-darma
   ```

2. **Install root dependencies (Backend):**
   ```bash
   npm install
   ```

3. **Install client dependencies (Frontend):**
   ```bash
   cd client
   npm install
   cd ..
   ```

4. **Environment Configuration:**
   Copy the example environment file to create your own configuration:
   ```bash
   cp .env.example .env
   ```

5. **Initialize Database:**
   Seed the database with the initial set of public prompts:
   ```bash
   npm run setup
   ```

### Running the App

Start both the backend server and the frontend client concurrently:

```bash
npm run dev
```

- **Frontend UI**: [http://localhost:5173](http://localhost:5173)
- **Backend API**: [http://localhost:3001](http://localhost:3001)

## Architecture Layout

```text
prompt-dashboard/
├── db/                 # SQLite database storage
├── scripts/            # Ingestion and initialization scripts
├── server/             # Express standalone backend
│   ├── index.js        # Server entry point
│   ├── db.js           # Database wrapper
│   └── routes/         # API endpoints
├── client/             # React (Vite) frontend application
│   ├── index.html      # App entry point
│   ├── vite.config.js  # Vite config
│   └── src/            # React code (App.jsx, api.js, components)
```

## Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

## License

[MIT](https://choosealicense.com/licenses/mit/)
