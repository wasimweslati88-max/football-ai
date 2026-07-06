# Football AI 🏆

AI-powered football match prediction platform that analyzes daily matches worldwide and selects only the safest betting opportunities.

## Features

- 🤖 **AI Analysis**: Advanced statistical analysis of all daily matches
- 🎯 **Top 10 Only**: Displays only the 10 safest matches worldwide
- 🛡️ **Low Risk Only**: Filters out all high and medium risk matches
- 📊 **Detailed Stats**: Team form, H2H, standings, expected goals
- 🔄 **Auto Updates**: Daily automatic data fetching and analysis
- ✅ **Result Tracking**: Automatic verification of predictions
- 🗑️ **Auto Cleanup**: Removes started/finished matches automatically
- 🔐 **Access Codes**: Secure login system with admin-generated codes
- 📱 **Responsive**: Works on all devices

## Tech Stack

- **Backend**: Node.js + Express
- **Database**: MongoDB (Mongoose)
- **AI Engine**: Custom statistical analysis engine
- **Data Source**: API-Football (free tier - 100 requests/day)
- **Hosting**: Render

## Quick Start (Local Development)

### 1. Clone & Install

```bash
git clone <your-repo>
cd football-ai
npm install
```

### 2. Environment Variables

Copy `.env.example` to `.env` and fill in your values:

```bash
cp .env.example .env
```

Edit `.env`:

```env
# API-Football (get free key from api-football.com)
API_FOOTBALL_KEY=your_api_football_key

# MongoDB Atlas (see setup below)
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/football_ai?retryWrites=true&w=majority

# JWT Secret (generate random string)
JWT_SECRET=your_random_secret_key_here

# Admin Password
ADMIN_PASSWORD=your_secure_admin_password

# Server
PORT=10000
NODE_ENV=development
```

### 3. Setup Database

```bash
npm run seed
```

### 4. Run

```bash
# Development
npm run dev

# Production
npm start
```

## Deployment Guide

### Step 1: MongoDB Atlas Setup

1. Go to [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Create a free account
3. Create a new cluster (M0 - Free Tier)
4. Create a database user with password
5. In **Network Access**, add IP: `0.0.0.0/0` (allows all - needed for Render)
6. Click **Connect** → **Drivers** → **Node.js**
7. Copy the connection string
8. Replace `<password>` with your database user password
9. Add `football_ai` as the database name in the URL

Example:
```
mongodb+srv://myuser:mypassword@cluster0.abc123.mongodb.net/football_ai?retryWrites=true&w=majority
```

### Step 2: API-Football Setup

1. Go to [API-Football](https://www.api-football.com)
2. Sign up for free account
3. Get your API key from dashboard
4. Free tier: 100 requests/day (sufficient for this app)

### Step 3: GitHub Setup

```bash
# Initialize git
git init

# Add all files
git add .

# Commit
git commit -m "Initial commit - Football AI v1.0"

# Create repo on GitHub, then:
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/football-ai.git
git push -u origin main
```

### Step 4: Render Deployment

1. Go to [Render](https://render.com) and sign up
2. Click **New** → **Web Service**
3. Connect your GitHub repository
4. Configure:
   - **Name**: `football-ai`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: Free

5. Add Environment Variables in Render Dashboard:
   - `NODE_ENV` = `production`
   - `API_FOOTBALL_KEY` = your_api_key
   - `API_FOOTBALL_BASE_URL` = `https://v3.football.api-sports.io`
   - `MONGODB_URI` = your_mongodb_connection_string
   - `JWT_SECRET` = generate_random_string_32+_chars
   - `ADMIN_PASSWORD` = your_admin_password

6. Click **Create Web Service**
7. Wait for deployment (2-4 minutes)
8. Your app is live at `https://football-ai.onrender.com`

### Step 5: First Admin Setup

After deployment, run the seed script once:

```bash
# Via Render Shell (paid plan) or locally with production env
npm run seed
```

Or manually create admin via MongoDB Compass:
```javascript
db.users.insertOne({
  accessCode: "ADMIN_" + Date.now(),
  role: "admin",
  name: "Administrator",
  isActive: true,
  createdAt: new Date()
})
```

## How It Works

### Daily Automation (00:05 UTC)
1. Fetches all matches for the day from API-Football
2. For each match, fetches:
   - Team statistics (form, goals, clean sheets)
   - Head-to-head history
   - League standings
3. AI engine analyzes all data
4. Selects only matches with:
   - **Risk Level: Low**
   - **Confidence: ≥70%**
5. Stores top 10 in database

### Every 30 Minutes
- Checks finished matches
- Compares actual results with predictions
- Logs accuracy statistics

### Every Hour
- Removes started matches from upcoming list
- Deletes old finished matches (7+ days)
- Cleans cancelled/postponed matches

## API Endpoints

### Authentication
- `POST /api/auth/login` - Login with access code
- `POST /api/auth/admin-login` - Admin login with password
- `GET /api/auth/verify` - Verify token

### Matches
- `GET /api/matches/today` - Get today's top 10 low-risk matches
- `GET /api/matches/:id` - Get match details

### Admin
- `GET /api/admin/dashboard` - Dashboard stats
- `POST /api/admin/codes` - Generate access code
- `GET /api/admin/codes` - List access codes
- `GET /api/admin/users` - List users
- `POST /api/admin/fetch-matches` - Manual fetch trigger

### Predictions
- `GET /api/predictions/history` - Prediction history
- `GET /api/predictions/accuracy` - Accuracy stats

## Pages

| Page | URL | Access |
|------|-----|--------|
| Home | `/` | Public (login required for data) |
| Login | `/login` | Public |
| History | `/history` | User |
| Stats | `/stats` | User |
| Admin | `/admin` | Admin only |

## AI Analysis Criteria

A match is recommended ONLY if:
- Risk Level = **Low**
- Confidence ≥ **70%**
- Significant strength gap between teams
- Strong H2H record for favorite
- Consistent recent form

Risk is calculated from:
- Team strength difference
- Form consistency
- H2H dominance
- Standings gap
- Goals predictability

## Troubleshooting

### "MongoDB connection error"
- Check MONGODB_URI is correct
- Ensure IP whitelist includes `0.0.0.0/0`
- Verify database user password

### "API quota exhausted"
- Free tier: 100 requests/day
- App uses ~5 requests per match
- Limit: ~20 matches/day on free tier

### "No matches showing"
- Check API_FOOTBALL_KEY is valid
- Verify date has matches scheduled
- Check server logs for errors

### "Admin login not working"
- Verify ADMIN_PASSWORD matches
- Check admin user exists in database
- Ensure JWT_SECRET is set

## License

MIT License - Free for personal and commercial use.

---

**Note**: All predictions are for informational purposes only. Bet responsibly.
