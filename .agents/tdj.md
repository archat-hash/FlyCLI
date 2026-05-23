# 📖 THE DREAM JOB ENGINE: USER GUIDE (tdj.md)

## 🎯 OBJECTIVE
Guide the user/agent through the full lifecycle of career transition engineering.

## 🛠️ WORKFLOW STEPS

### 1. 📥 DATA INGESTION (Once or on CV update)
Atomize your master experience into the local SQLite DB.
```bash
npm start ingest -- -f <path_to_pdf>
```
*Artifact: `ExperienceAtom` records in DB.*

### 2. 🏹 MARKET HUNTING
Find direct ATS portals using Google Dorking patterns.
```bash
npm start hunt -- -r "<role>" -l "<location>"
```
*Artifact: List of safe job URLs.*

### 3. 🔍 VACANCY SCANNING
Identify ATS type, check domain safety, and get AI Quality Score.
```bash
npm start scan <url>
```
*Artifact: `JobApplication` record (Safety/Reputation/JD).*

### 4. 🧠 INTELLIGENT TAILORING
RAG-based matching, AI Re-Verbing, and PDF synthesis.
```bash
npm start match <url>
```
*Artifact: Tailored PDF + `context_*.json` in `output/`.*

### 5. 🚀 BROWSER PILOT (The "Human-in-the-Loop" Auto-fill)
Launch Playwright, map DOM, fill fields, and upload tailored PDF.
```bash
npm start apply <url>
```
*Requirement: Manual "Click-to-Submit" in browser.*

---

## 🚦 SAFETY & PRIVACY RULES
1. **Safety First**: Never `apply` to `Blacklisted` domains.
2. **Privacy First**: All PII stays in `VaultService` (local).
3. **Human Guard**: Automated submission is forbidden (KR 2.2).

## 📊 OBSERVABILITY
- Check progress: `npm start status`
- Check market sentiment: `npm start pulse`
