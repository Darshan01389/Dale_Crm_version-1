# DealCRM v0.1 - Error Manual & Troubleshooting Guide

This document catalogs the known and potential errors across the DealCRM version 0.1 project (both frontend and backend). It provides step-by-step manual solutions to resolve them.

---

## 1. Backend Server Refuses Connection
**Error:** 
`[WinError 10061] No connection could be made because the target machine actively refused it`

**Cause:** 
The FastAPI backend server is not running, or the port is blocked. This commonly occurs when running API tests or when the frontend tries to fetch data without the backend being active.

**Manual Solution:**
1. Open a terminal and navigate to the `backend` directory.
2. Activate your virtual environment if you have one.
3. Start the backend server manually by running: 
   ```bash
   uvicorn main:app --reload --port 8000
   ```
4. Verify by navigating to `http://localhost:8000/health` in your browser.

---

## 2. CRM Login Error (HTTP 500 Internal Server Error)
**Error:** 
"Internal Server Error" encountered in the UI when attempting to log in or authenticate.

**Cause:** 
The PostgreSQL database connection is failing, the `users` table doesn't exist, or the necessary user/role data is missing.

**Manual Solution:**
1. Ensure your local PostgreSQL service is running.
2. Check the `.env` file inside the `backend` directory to ensure `DATABASE_URL` is configured correctly.
3. If the database is empty, navigate to the `backend` directory and run the initialization script:
   ```bash
   python init_db.py
   ```
4. To fix missing roles or users, run the provided role-fixing scripts:
   ```bash
   python fix_roles.py
   python fix_backend_roles.py
   ```

---

## 3. Frontend Build Chunk Size Warning
**Error:** 
`(!) Some chunks are larger than 500 kB after minification.` (Encountered during `npm run build`).

**Cause:** 
Vite is warning that the main JavaScript bundle (often containing Three.js and React) is too large, which can negatively impact initial page load performance.

**Manual Solution:**
1. Open `frontend/vite.config.js`.
2. Configure `build.rollupOptions.output.manualChunks` to split vendor dependencies into separate chunks.
3. Alternatively, implement dynamic `import()` for heavy components (like 3D elements using `@react-three/fiber`) so they are only loaded when needed.

---

## 4. ESLint Command Not Found
**Error:** 
`'eslint' is not recognized as an internal or external command` (Encountered during `npm run lint`).

**Cause:** 
The `package.json` contains a `lint` script that calls `eslint`, but ESLint is not installed in the project's `devDependencies`.

**Manual Solution:**
1. Open a terminal and navigate to the `frontend` directory.
2. Install ESLint manually:
   ```bash
   npm install eslint --save-dev
   ```
3. Run `npm run lint` again.

---

## 5. UI: Community Page Search, Filter, and New Post Not Working
**Error:** 
Buttons and inputs on the Community page are unresponsive, or typing in the search bar does not filter the displayed posts.

**Cause:** 
React state variables (e.g., `searchQuery`, `selectedFilter`) are not properly wired to their respective `onChange` or `onClick` event handlers, or the filtered data is not being mapped correctly to the UI.

**Manual Solution:**
1. Locate the Community page component in `frontend/src`.
2. Ensure the input fields have an `onChange={(e) => setSearchQuery(e.target.value)}` handler.
3. Update the rendering logic to map over `filteredPosts` instead of the raw `posts` array, where `filteredPosts` is derived by filtering `posts` based on the current `searchQuery` and `selectedFilter`.

---

## 6. UI: Empty "Today" Task View & Broken Calendar Navigation
**Error:** 
Tasks assigned for today are not showing up for the Salesperson persona, and clicking calendar dates does nothing.

**Cause:** 
Date matching logic comparing the task's due date with the current date is failing (likely due to timezone discrepancies or time-of-day mismatch). Calendar navigation lacks state update functions.

**Manual Solution:**
1. Normalize dates in the React component before comparison by setting the time to midnight:
   ```javascript
   const today = new Date();
   today.setHours(0, 0, 0, 0);
   ```
2. For the calendar, ensure `onClick={(date) => setSelectedDate(date)}` is implemented on the date cells.
3. *Note:* If integrating Google Calendar, replace the custom calendar grid with the Google Calendar embed iframe or API integration to automatically sync events.

---

## 7. AI/Ollama Integration Connection Refused
**Error:** 
Failures in lead classification or content generation features (HTTP 500 or timeout).

**Cause:** 
The backend is attempting to reach a local Ollama model that is not running, or the OpenAI API key is expired/invalid (if still using the old implementation).

**Manual Solution:**
1. If using local Ollama, open a separate terminal and ensure the service is running:
   ```bash
   ollama serve
   ```
   *And ensure the specific model is downloaded:*
   ```bash
   ollama run llama3 (or the specific model name used)
   ```
2. Verify the `.env` configuration in the `backend` points to the correct local endpoint (typically `http://localhost:11434`).
