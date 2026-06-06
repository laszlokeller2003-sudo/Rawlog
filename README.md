# ⚡ RAWLOG — No Filter. Your Life. Raw.

Welcome to **RAWLOG**, a premium, local-first, privacy-focused life tracking web application designed to track substances, intimacy, sleep, mood, finances, productivity, and health with zero filters.

---

## 🚨 IMPORTANT: DO NOT OPEN INDEX.HTML DIRECTLY

If you open the `index.html` file directly in your browser (which opens a `file:///...` URL), **you will see a blank/black screen**. 

### Why does this happen?
RAWLOG is a modern React + TypeScript SPA utilizing ES modules. For security reasons, modern web browsers (Chrome, Safari, Firefox) **block ES module script execution over the `file://` protocol** due to CORS restrictions. The HTML loads (which makes the background black), but the JavaScript app is blocked from starting.

---

## 🚀 How to Run and View the App

To see and interact with RAWLOG, you must run the local development server and open the application URL:

### Step 1: Open Terminal
Open the **Terminal** app on your Mac.

### Step 2: Navigate to the Project Folder
Type the following command to go to the RAWLOG folder on your Desktop:
```bash
cd ~/Desktop/RAWLOG
```

### Step 3: Start the Development Server
Run the start command:
```bash
npm run dev
```
*(If you are running the project for the first time, you may need to install the dependencies first using `npm install`)*

Once started, the terminal will show that the server is ready:
```text
  VITE v8.0.14  ready in 348 ms

  ➜  Local:   http://localhost:5173/
```

### Step 4: Open in Browser
Click or navigate to the following link in Safari, Chrome, or any other browser:
👉 **[http://localhost:5173/](http://localhost:5173/)**

---

## 🛠️ Features Completed
1. **5-Screen Animated Onboarding**: Welcome, Profile details, Lifestyle selections, Privacy settings, and Ready screen.
2. **Dashboard Overview**: Home Screen with Streaks, Daily Entry Score, Quick Logging grid, and Recent activity feeds.
3. **10 Log Forms**: Customized forms for substances, sleep, mood, nutrition, finance, social, work, health, intimacy, and fitness.
4. **Specialized Dashboards**:
   - **💰 Finance**: Incomes, expenses, savings rate, and category breakdowns.
   - **💪 Body & Health**: Weight graphs, body measurements, and symptoms tracker.
   - **👥 Relations**: Social interactions, energy balance, and contact logging.
   - **⚡ Productivity**: Deep work tracking, focus scores, and peak hours.
5. **AI Insights & PA Chat**: Structured data-context analyzer that feeds into a Claude Edge API proxy for brutal, data-driven feedback.
6. **Data Storage & Syncing**: Zustand stores synced local-first via IndexedDB/LocalStorage, export options (JSON & CSV), and optional Supabase auth-based cloud sync.
7. **Premium Paywall Mode**: Beautiful lock screens and modal prompts gating advanced dashboards and unlimited entries.
