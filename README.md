# 📊 Origin Customer Churn Analysis App

An automated, intelligent customer churn & retention analytics web app. Users upload customer datasets (`.csv`, `.xlsx`, `.xls`) and receive instantaneous machine-learning-driven churn insights, risk cohort breakdowns, statistical drivers, lifecycle retention curves, and per-customer risk scoring with confidence intervals and PDF/CSV export.

---

## ✨ Features

- **Multi-Format Ingestion**: Supports `.csv`, `.xlsx`, `.xls` with multi-sheet detection and automatic schema inference.
- **Statistical Driver Detection**: Chi-square analysis and Cramér's V dependency ranking across all dataset columns.
- **Risk Cohort Segmentation**: Automatically extracts high-risk customer segments with financial value at risk calculations.
- **Dynamic Lifecycle Retention Curve**: Composed charts plotting churn rate & cumulative revenue lost across customer tenures.
- **Machine Learning Risk Engine**: Random Forest predictor providing per-customer churn probabilities, confidence intervals ($\pm$), and top contributing drivers.
- **Export System**: Real-time paginated PDF generation and structured tabular CSV export.
- **Modern Dark Gallery UX**: Built with Origin Financial dark design tokens (`#0f1011` canvas, Iris Gleam `#847dff`, Cyan Signal `#00b3dd`).
- **Session Persistence**: UUID-based analysis storage via SQLite for instant reloads without re-uploading.

---

## 🏗️ Architecture

- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS v4, Recharts, Lucide Icons, Vitest.
- **Backend**: FastAPI, Pandas, Scikit-Learn, SciPy, OpenPyXL, SQLite.

---

## 🚀 Deployment on Vercel

The frontend is ready for 1-click deployment on [Vercel](https://vercel.com).

### Option 1: Root Directory (Default)
1. Push this repository to GitHub.
2. Import the repository into Vercel.
3. Vercel will automatically detect the root `vercel.json` and build the frontend from `frontend/dist`.
4. In **Project Settings > Environment Variables**, add:
   ```env
   VITE_API_BASE_URL=https://your-backend-service.onrender.com
   ```
5. Click **Deploy**.

### Option 2: Set Root Directory to `frontend`
1. When importing into Vercel, set the **Root Directory** to `frontend`.
2. Framework preset: **Vite**.
3. Build command: `npm run build`.
4. Output directory: `dist`.
5. Add `VITE_API_BASE_URL` in Environment Variables.

> **Note**: If `VITE_API_BASE_URL` is omitted, the app runs in demo/sample mode with complete mock insights and offline fallback.

---

## 💻 Local Development Setup

### 1. Backend (FastAPI)
```bash
cd backend
python -m venv venv
# On Windows:
.\venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate

pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```
Backend runs at `http://localhost:8000`.

### 2. Frontend (Vite + React)
```bash
cd frontend
npm install
npm run dev
```
Frontend runs at `http://localhost:5173`.

### 3. Running Tests
```bash
# Frontend Unit Tests (Vitest)
npm test --prefix frontend

# Backend Tests
cd backend && python tests/test_improvements.py
```
