# Vercel Deployment Guide

## Quick Fix (Works Immediately)

The API has been updated to work on Vercel using in-memory storage. This means:

1. **Data persists in memory** during serverless function lifetime
2. **Data resets on new deployments**
3. **Good for testing** - not for production

## Recommended: Set up Vercel KV (Persistent Storage)

### Step 1: Install Vercel KV

```bash
npm install @vercel/kv
```

### Step 2: Create KV Database on Vercel

1. Go to your project on [Vercel Dashboard](https://vercel.com)
2. Navigate to **Storage** tab
3. Click **Create Database**
4. Select **KV** (Redis)
5. Give it a name (e.g., `learnfmpa-kv`)
6. Click **Create**

### Step 3: Link Database to Project

1. In your KV database, go to **Settings**
2. Click **Connect to Project**
3. Select your project
4. This adds environment variables automatically

### Step 4: Add Users

After deploying, add users via API:

```bash
# Using the Python script (with --api flag)
python scripts/manage_users.py add "John Doe" "john@example.com" --api

# Or directly with curl
curl -X POST https://www.learnfmpa.com/api/admin/users \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "temp_password_123",
    "admin_secret": "learnfmpa2024"
  }'
```

### Step 5: List Users

```bash
python scripts/manage_users.py list --api

# Or with curl
curl "https://www.learnfmpa.com/api/admin/users?admin_secret=learnfmpa2024"
```

## Security Recommendation

Change the admin secret in production:

1. Go to Vercel Dashboard → Project → Settings → Environment Variables
2. Add `ADMIN_SECRET` with a secure value
3. Redeploy

Then use:
```bash
ADMIN_SECRET=your_secure_secret python scripts/manage_users.py add "Name" "email@example.com" --api
```

## Alternative: Use Environment File

Create `.env.local`:
```
ADMIN_SECRET=your_secure_secret_here
```

Then the script will use that value automatically.

## Current Status

- ✅ Login API works on Vercel
- ✅ Password change works
- ✅ Progress sync works
- ⚠️ Data stored in memory (resets on deployment)
- 🔄 Install @vercel/kv for persistent storage

## Testing the Deployment

1. Add a user via API
2. Login with the temporary password
3. Change password when prompted
4. Progress will be synced

The system is now functional on Vercel!
