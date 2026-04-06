#!/usr/bin/env python3
"""
LearnFMPA User Management Script

Usage:
  python manage_users.py add "Name" "email@example.com" --api
  python manage_users.py list --api
  python manage_users.py reset "email@example.com" --api

API mode (--api flag):
  Uses the REST API to create users (works with Vercel deployment)

Local mode (no --api flag):
  Directly modifies the users.json file (for local development)
"""

import json
import os
import secrets
import string
import hashlib
import argparse
from datetime import datetime
from pathlib import Path
import sys

SCRIPT_DIR = Path(__file__).parent.parent
USERS_FILE = SCRIPT_DIR / "data" / "users" / "users.json"
PROGRESS_DIR = SCRIPT_DIR / "data" / "users" / "progress"

API_URL = os.environ.get('API_URL', 'https://www.learnfmpa.com')
ADMIN_SECRET = os.environ.get('ADMIN_SECRET', 'learnfmpa2024')


def ensure_directories():
    USERS_FILE.parent.mkdir(parents=True, exist_ok=True)
    PROGRESS_DIR.mkdir(parents=True, exist_ok=True)


def load_users() -> dict:
    ensure_directories()
    if USERS_FILE.exists():
        with open(USERS_FILE, 'r', encoding='utf-8') as f:
            return json.load(f)
    return {"users": {}}


def save_users(data: dict):
    ensure_directories()
    with open(USERS_FILE, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)


def generate_temp_password(length: int = 12) -> str:
    alphabet = string.ascii_letters + string.digits + "!@#$%^&*"
    return ''.join(secrets.choice(alphabet) for _ in range(length))


def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()


def add_user_api(name: str, email: str, temp_password: str = None):
    """Add user via API (for Vercel deployment)."""
    import urllib.request
    import urllib.error
    
    if not temp_password:
        temp_password = generate_temp_password()
    
    url = f"{API_URL}/api/admin/users"
    data = {
        "name": name,
        "email": email,
        "password": temp_password,
        "admin_secret": ADMIN_SECRET
    }
    
    try:
        req = urllib.request.Request(
            url,
            data=json.dumps(data).encode('utf-8'),
            headers={'Content-Type': 'application/json'},
            method='POST'
        )
        
        with urllib.request.urlopen(req) as response:
            result = json.loads(response.read().decode('utf-8'))
            
            if result.get('success'):
                print(f"\n✓ User created successfully!")
                print(f"  Name: {name}")
                print(f"  Email: {email}")
                print(f"  Temporary Password: {temp_password}")
                print(f"  User ID: {result['user']['id']}")
                print(f"\n  ⚠️  Share the temporary password securely.")
                print(f"  The user must change it on first login.\n")
            else:
                print(f"Error: {result.get('error', 'Unknown error')}")
                
    except urllib.error.HTTPError as e:
        error_body = e.read().decode('utf-8')
        try:
            error_data = json.loads(error_body)
            print(f"Error: {error_data.get('error', error_body)}")
        except:
            print(f"Error: {error_body}")
    except Exception as e:
        print(f"Error connecting to API: {e}")
        print(f"Make sure the API is running at {API_URL}")


def list_users_api():
    """List users via API."""
    import urllib.request
    import urllib.error
    
    url = f"{API_URL}/api/admin/users?admin_secret={ADMIN_SECRET}"
    
    try:
        with urllib.request.urlopen(url) as response:
            result = json.loads(response.read().decode('utf-8'))
            
            users = result.get('users', [])
            if not users:
                print("No users found.")
                return
            
            print(f"\n{'='*80}")
            print(f"{'ID':<20} {'Name':<20} {'Email':<30} {'Status':<10}")
            print(f"{'='*80}")
            
            for user in users:
                status = "Pending" if user.get('must_change_password', False) else "Active"
                print(f"{user['id']:<20} {user['name']:<20} {user['email']:<30} {status:<10}")
            
            print(f"{'='*80}")
            print(f"Total: {len(users)} users\n")
            
    except urllib.error.HTTPError as e:
        error_body = e.read().decode('utf-8')
        print(f"Error: {error_body}")
    except Exception as e:
        print(f"Error connecting to API: {e}")


def add_user_local(name: str, email: str, temp_password: str = None):
    """Add user locally (modifies users.json directly)."""
    users_data = load_users()
    
    for user_id, user in users_data["users"].items():
        if user["email"].lower() == email.lower():
            print(f"Error: A user with email '{email}' already exists.")
            return None
    
    user_id = f"user_{secrets.token_hex(8)}"
    
    if not temp_password:
        temp_password = generate_temp_password()
    
    users_data["users"][user_id] = {
        "id": user_id,
        "name": name,
        "email": email.lower(),
        "password_hash": hash_password(temp_password),
        "temp_password": temp_password,
        "must_change_password": True,
        "created_at": datetime.now().isoformat(),
        "last_login": None,
        "is_active": True
    }
    
    save_users(users_data)
    
    print(f"\n✓ User created successfully!")
    print(f"  Name: {name}")
    print(f"  Email: {email}")
    print(f"  Temporary Password: {temp_password}")
    print(f"  User ID: {user_id}")
    print(f"\n  ⚠️  Share the temporary password securely.")
    print(f"  The user must change it on first login.\n")
    
    return user_id


def list_users_local():
    """List users locally."""
    users_data = load_users()
    
    if not users_data["users"]:
        print("No users found.")
        return
    
    print(f"\n{'='*80}")
    print(f"{'ID':<20} {'Name':<20} {'Email':<30} {'Status':<10}")
    print(f"{'='*80}")
    
    for user_id, user in users_data["users"].items():
        status = "Pending" if user.get("must_change_password", False) else "Active"
        print(f"{user_id:<20} {user['name']:<20} {user['email']:<30} {status:<10}")
    
    print(f"{'='*80}")
    print(f"Total: {len(users_data['users'])} users\n")


def main():
    parser = argparse.ArgumentParser(
        description="LearnFMPA User Management Script"
    )
    
    parser.add_argument('--api', action='store_true', help='Use REST API instead of local files')
    parser.add_argument('--url', default=API_URL, help='API URL (default: https://www.learnfmpa.com)')
    
    subparsers = parser.add_subparsers(dest="command", help="Commands")
    
    # Add user
    add_parser = subparsers.add_parser("add", help="Add a new user")
    add_parser.add_argument("name", help="User's full name")
    add_parser.add_argument("email", help="User's email address")
    add_parser.add_argument("--password", "-p", help="Temporary password")
    
    # List users
    subparsers.add_parser("list", help="List all users")
    
    args = parser.parse_args()
    
    if not args.command:
        parser.print_help()
        return
    
    if args.api:
        global API_URL
        API_URL = args.url
        
    if args.command == "add":
        if args.api:
            add_user_api(args.name, args.email, args.password)
        else:
            add_user_local(args.name, args.email, args.password)
    elif args.command == "list":
        if args.api:
            list_users_api()
        else:
            list_users_local()


if __name__ == "__main__":
    main()
