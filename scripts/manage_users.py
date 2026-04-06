#!/usr/bin/env python3
"""
LearnFMPA User Management Script

This script allows administrators to:
- Add new users with name and email
- Generate temporary passwords
- List all users
- Reset passwords
- Import/export users

Users will be prompted to change their password on first login.
Progress is synced and stored per user.
"""

import json
import os
import secrets
import string
import hashlib
import argparse
from datetime import datetime
from pathlib import Path
import getpass

SCRIPT_DIR = Path(__file__).parent.parent
USERS_FILE = SCRIPT_DIR / "data" / "users" / "users.json"
PROGRESS_DIR = SCRIPT_DIR / "data" / "users" / "progress"


def ensure_directories():
    """Ensure required directories exist."""
    USERS_FILE.parent.mkdir(parents=True, exist_ok=True)
    PROGRESS_DIR.mkdir(parents=True, exist_ok=True)


def load_users() -> dict:
    """Load users from JSON file."""
    ensure_directories()
    if USERS_FILE.exists():
        with open(USERS_FILE, 'r', encoding='utf-8') as f:
            return json.load(f)
    return {"users": {}}


def save_users(data: dict):
    """Save users to JSON file."""
    ensure_directories()
    with open(USERS_FILE, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)


def generate_temp_password(length: int = 12) -> str:
    """Generate a secure temporary password."""
    alphabet = string.ascii_letters + string.digits + "!@#$%^&*"
    password = ''.join(secrets.choice(alphabet) for _ in range(length))
    return password


def hash_password(password: str) -> str:
    """Hash a password using SHA-256."""
    return hashlib.sha256(password.encode()).hexdigest()


def add_user(name: str, email: str, temp_password: str = None):
    """Add a new user."""
    users_data = load_users()
    
    # Check if email already exists
    for user_id, user in users_data["users"].items():
        if user["email"].lower() == email.lower():
            print(f"Error: A user with email '{email}' already exists.")
            return None
    
    # Generate user ID
    user_id = f"user_{secrets.token_hex(8)}"
    
    # Generate or use provided temporary password
    if not temp_password:
        temp_password = generate_temp_password()
    
    # Create user entry
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
    print(f"\n  ⚠️  Please share the temporary password with the user securely.")
    print(f"  The user will be prompted to change it on first login.\n")
    
    return user_id


def list_users():
    """List all users."""
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


def reset_password(email: str, new_password: str = None):
    """Reset a user's password."""
    users_data = load_users()
    
    for user_id, user in users_data["users"].items():
        if user["email"].lower() == email.lower():
            if not new_password:
                new_password = generate_temp_password()
            
            user["password_hash"] = hash_password(new_password)
            user["temp_password"] = new_password
            user["must_change_password"] = True
            
            save_users(users_data)
            
            print(f"\n✓ Password reset successfully for {user['name']}")
            print(f"  New Temporary Password: {new_password}")
            print(f"  The user will need to change it on next login.\n")
            return
    
    print(f"Error: No user found with email '{email}'")


def deactivate_user(email: str):
    """Deactivate a user account."""
    users_data = load_users()
    
    for user_id, user in users_data["users"].items():
        if user["email"].lower() == email.lower():
            user["is_active"] = False
            save_users(users_data)
            print(f"✓ User '{user['name']}' has been deactivated.")
            return
    
    print(f"Error: No user found with email '{email}'")


def activate_user(email: str):
    """Activate a user account."""
    users_data = load_users()
    
    for user_id, user in users_data["users"].items():
        if user["email"].lower() == email.lower():
            user["is_active"] = True
            save_users(users_data)
            print(f"✓ User '{user['name']}' has been activated.")
            return
    
    print(f"Error: No user found with email '{email}'")


def delete_user(email: str):
    """Delete a user account."""
    users_data = load_users()
    
    user_to_delete = None
    for user_id, user in users_data["users"].items():
        if user["email"].lower() == email.lower():
            user_to_delete = user_id
            break
    
    if user_to_delete:
        del users_data["users"][user_to_delete]
        save_users(users_data)
        print(f"✓ User with email '{email}' has been deleted.")
        return
    
    print(f"Error: No user found with email '{email}'")


def get_user_details(email: str):
    """Get detailed information about a user."""
    users_data = load_users()
    
    for user_id, user in users_data["users"].items():
        if user["email"].lower() == email.lower():
            print(f"\n{'='*50}")
            print(f"User Details")
            print(f"{'='*50}")
            print(f"  ID: {user_id}")
            print(f"  Name: {user['name']}")
            print(f"  Email: {user['email']}")
            print(f"  Status: {'Active' if user.get('is_active', True) else 'Inactive'}")
            print(f"  Password Change Required: {'Yes' if user.get('must_change_password', False) else 'No'}")
            print(f"  Created: {user.get('created_at', 'N/A')}")
            print(f"  Last Login: {user.get('last_login', 'Never')}")
            
            # Load progress if exists
            progress_file = PROGRESS_DIR / f"{user_id}.json"
            if progress_file.exists():
                with open(progress_file, 'r') as f:
                    progress = json.load(f)
                print(f"\n  Progress Summary:")
                for module_id, module_progress in progress.items():
                    if module_id.startswith("module_"):
                        answered = len([k for k, v in module_progress.items() if v])
                        print(f"    Module {module_id}: {answered} questions answered")
            
            print(f"{'='*50}\n")
            return
    
    print(f"Error: No user found with email '{email}'")


def export_users(output_file: str = None):
    """Export users to a JSON file (without passwords)."""
    users_data = load_users()
    
    export_data = {
        "exported_at": datetime.now().isoformat(),
        "users": []
    }
    
    for user_id, user in users_data["users"].items():
        export_user = {
            "id": user_id,
            "name": user["name"],
            "email": user["email"],
            "created_at": user.get("created_at"),
            "last_login": user.get("last_login"),
            "is_active": user.get("is_active", True)
        }
        export_data["users"].append(export_user)
    
    if not output_file:
        output_file = f"users_export_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
    
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(export_data, f, indent=2, ensure_ascii=False)
    
    print(f"✓ Exported {len(export_data['users'])} users to '{output_file}'")


def import_users(input_file: str):
    """Import users from a JSON file."""
    with open(input_file, 'r', encoding='utf-8') as f:
        import_data = json.load(f)
    
    users_data = load_users()
    imported_count = 0
    
    for user_data in import_data.get("users", []):
        email = user_data["email"]
        
        # Check if user already exists
        exists = any(u["email"].lower() == email.lower() for u in users_data["users"].values())
        
        if not exists:
            temp_password = generate_temp_password()
            user_id = f"user_{secrets.token_hex(8)}"
            
            users_data["users"][user_id] = {
                "id": user_id,
                "name": user_data["name"],
                "email": email.lower(),
                "password_hash": hash_password(temp_password),
                "temp_password": temp_password,
                "must_change_password": True,
                "created_at": datetime.now().isoformat(),
                "last_login": None,
                "is_active": True
            }
            print(f"  Imported: {user_data['name']} ({email}) - Temp password: {temp_password}")
            imported_count += 1
        else:
            print(f"  Skipped (exists): {email}")
    
    save_users(users_data)
    print(f"\n✓ Imported {imported_count} new users")


def show_user_progress(email: str):
    """Show detailed progress for a user."""
    users_data = load_users()
    
    for user_id, user in users_data["users"].items():
        if user["email"].lower() == email.lower():
            progress_file = PROGRESS_DIR / f"{user_id}.json"
            
            if not progress_file.exists():
                print(f"No progress found for {user['name']}")
                return
            
            with open(progress_file, 'r') as f:
                progress = json.load(f)
            
            print(f"\n{'='*60}")
            print(f"Progress for: {user['name']} ({user['email']})")
            print(f"{'='*60}")
            
            total_answered = 0
            for key, value in progress.items():
                if key.startswith("module_"):
                    answered = len([k for k, v in value.items() if v]) if isinstance(value, dict) else 0
                    total_answered += answered
                    print(f"  {key}: {answered} questions answered")
            
            print(f"\n  Total questions answered: {total_answered}")
            print(f"{'='*60}\n")
            return
    
    print(f"Error: No user found with email '{email}'")


def main():
    parser = argparse.ArgumentParser(
        description="LearnFMPA User Management Script",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python manage_users.py add "John Doe" "john@example.com"
  python manage_users.py list
  python manage_users.py reset "john@example.com"
  python manage_users.py progress "john@example.com"
  python manage_users.py export users_backup.json
"""
    )
    
    subparsers = parser.add_subparsers(dest="command", help="Available commands")
    
    # Add user
    add_parser = subparsers.add_parser("add", help="Add a new user")
    add_parser.add_argument("name", help="User's full name")
    add_parser.add_argument("email", help="User's email address")
    add_parser.add_argument("--password", "-p", help="Temporary password (auto-generated if not provided)")
    
    # List users
    subparsers.add_parser("list", help="List all users")
    
    # Reset password
    reset_parser = subparsers.add_parser("reset", help="Reset user's password")
    reset_parser.add_argument("email", help="User's email address")
    reset_parser.add_argument("--password", "-p", help="New temporary password")
    
    # Get user details
    details_parser = subparsers.add_parser("details", help="Get user details")
    details_parser.add_argument("email", help="User's email address")
    
    # Deactivate user
    deactivate_parser = subparsers.add_parser("deactivate", help="Deactivate a user")
    deactivate_parser.add_argument("email", help="User's email address")
    
    # Activate user
    activate_parser = subparsers.add_parser("activate", help="Activate a user")
    activate_parser.add_argument("email", help="User's email address")
    
    # Delete user
    delete_parser = subparsers.add_parser("delete", help="Delete a user")
    delete_parser.add_argument("email", help="User's email address")
    
    # Export users
    export_parser = subparsers.add_parser("export", help="Export users to JSON")
    export_parser.add_argument("output", nargs="?", help="Output file name")
    
    # Import users
    import_parser = subparsers.add_parser("import", help="Import users from JSON")
    import_parser.add_argument("input", help="Input file name")
    
    # Show progress
    progress_parser = subparsers.add_parser("progress", help="Show user progress")
    progress_parser.add_argument("email", help="User's email address")
    
    args = parser.parse_args()
    
    if not args.command:
        parser.print_help()
        return
    
    if args.command == "add":
        add_user(args.name, args.email, args.password)
    elif args.command == "list":
        list_users()
    elif args.command == "reset":
        reset_password(args.email, args.password)
    elif args.command == "details":
        get_user_details(args.email)
    elif args.command == "deactivate":
        deactivate_user(args.email)
    elif args.command == "activate":
        activate_user(args.email)
    elif args.command == "delete":
        delete_user(args.email)
    elif args.command == "export":
        export_users(args.output)
    elif args.command == "import":
        import_users(args.input)
    elif args.command == "progress":
        show_user_progress(args.email)


if __name__ == "__main__":
    main()
