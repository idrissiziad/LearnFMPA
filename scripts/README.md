# LearnFMPA User Management Guide

## Overview

This system allows administrators to manage users for the LearnFMPA platform. Each user gets a temporary password on first login and must change it. User progress is synced and stored.

## Quick Start

### Adding a User

```bash
cd scripts
python manage_users.py add "John Doe" "john@example.com"
```

This will output:
- User ID
- Temporary password

Share the temporary password with the user securely.

### Listing All Users

```bash
python manage_users.py list
```

### Resetting a Password

```bash
python manage_users.py reset "john@example.com"
```

### Viewing User Details

```bash
python manage_users.py details "john@example.com"
```

### Viewing User Progress

```bash
python manage_users.py progress "john@example.com"
```

### Exporting Users

```bash
python manage_users.py export users_backup.json
```

### Importing Users

```bash
python manage_users.py import users_list.json
```

## User Flow

1. **Admin creates user** with name and email
2. **System generates** a temporary password
3. **Admin shares** the temporary password with the user
4. **User logs in** with email + temporary password
5. **User is prompted** to change password
6. **User gains access** to the platform
7. **Progress is synced** automatically

## Data Storage

- **Users**: `data/users/users.json`
- **Progress**: `data/users/progress/{user_id}.json`

## Security Notes

- Passwords are hashed using SHA-256
- Session tokens are randomly generated
- Temporary passwords should be shared securely
- Users must change password on first login

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/auth/login` | POST | Login user |
| `/api/auth/change-password` | POST | Change password |
| `/api/progress` | GET | Get user progress |
| `/api/progress` | POST | Save progress |
| `/api/progress` | DELETE | Reset progress |
| `/api/users/[id]` | GET | Get user info |

## Deployment on Vercel

The user data is stored in JSON files. For Vercel deployment:

1. **Option A**: Use Vercel KV (Redis) for production
2. **Option B**: Use Vercel Postgres database
3. **Option C**: Use an external database (Supabase, MongoDB, etc.)

For simple setups, the JSON files work locally. For production, consider migrating to a proper database.

### Recommended: Use Vercel KV

```bash
npm install @vercel/kv
```

Then update the API routes to use KV instead of filesystem.

## Example: Adding Multiple Users

Create a file `users_to_add.json`:
```json
{
  "users": [
    {"name": "Alice Martin", "email": "alice@example.com"},
    {"name": "Bob Dupont", "email": "bob@example.com"}
  ]
}
```

Then import:
```bash
python manage_users.py import users_to_add.json
```
