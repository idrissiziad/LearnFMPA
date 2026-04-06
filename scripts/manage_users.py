#!/usr/bin/env python3
"""
LearnFMPA User Management Script

Automatically connects to the Vercel deployment API.

Usage:
  python manage_users.py add "Name" "email@example.com"
  python manage_users.py list
  python manage_users.py reset "email@example.com"

Set environment variables:
  API_URL - Your Vercel deployment URL (default: https://www.learnfmpa.com)
  ADMIN_SECRET - Admin secret key (default: learnfmpa2024)
"""

import json
import os
import secrets
import string
import argparse
import urllib.request
import urllib.error
import urllib.parse

DEFAULT_API_URL = os.environ.get('API_URL', 'https://www.learnfmpa.com')
DEFAULT_ADMIN_SECRET = os.environ.get('ADMIN_SECRET', 'learnfmpa2024')


def generate_temp_password(length: int = 12) -> str:
    alphabet = string.ascii_letters + string.digits + "!@#$%^&*"
    return ''.join(secrets.choice(alphabet) for _ in range(length))


def api_request(api_url: str, admin_secret: str, endpoint: str, method: str = 'GET', data: dict = None) -> dict:
    """Make an API request to the Vercel deployment."""
    url = f"{api_url}{endpoint}"
    
    headers = {'Content-Type': 'application/json'}
    
    if method == 'GET' and 'admin_secret' not in endpoint:
        url = f"{url}{'?' if '?' not in url else '&'}admin_secret={admin_secret}"
    
    req_data = None
    if data:
        data['admin_secret'] = admin_secret
        req_data = json.dumps(data).encode('utf-8')
    
    try:
        req = urllib.request.Request(
            url,
            data=req_data,
            headers=headers,
            method=method
        )
        
        with urllib.request.urlopen(req, timeout=30) as response:
            return json.loads(response.read().decode('utf-8'))
            
    except urllib.error.HTTPError as e:
        error_body = e.read().decode('utf-8')
        try:
            return json.loads(error_body)
        except:
            return {'error': error_body}
    except urllib.error.URLError as e:
        return {'error': f'Cannot connect to {api_url}: {e}'}
    except Exception as e:
        return {'error': str(e)}


def add_user(api_url: str, admin_secret: str, name: str, email: str, temp_password: str = None):
    """Add a new user via API."""
    if not temp_password:
        temp_password = generate_temp_password()
    
    result = api_request(api_url, admin_secret, '/api/admin/users', 'POST', {
        'name': name,
        'email': email,
        'password': temp_password
    })
    
    if result.get('success'):
        subject = f"Bienvenue sur LearnFMPA - Vos identifiants de connexion"
        body = f"""Bonjour {name},

Votre compte LearnFMPA a été créé avec succès.

Voici vos identifiants de connexion :

📧 Email : {email}
🔑 Mot de passe temporaire : {temp_password}

⚠️ IMPORTANT : Vous devrez changer ce mot de passe lors de votre première connexion.

Pour vous connecter, rendez-vous sur :
{api_url}/login

Cordialement,
L'équipe LearnFMPA"""
        
        encoded_subject = urllib.parse.quote(subject)
        encoded_body = urllib.parse.quote(body)
        mailto_link = f"mailto:{email}?subject={encoded_subject}&body={encoded_body}"
        
        print(f"\n✓ User created successfully!")
        print(f"  Name: {name}")
        print(f"  Email: {email}")
        print(f"  Temporary Password: {temp_password}")
        print(f"  User ID: {result.get('user', {}).get('id', 'N/A')}")
        print(f"\n📧 Send email to user:")
        print(f"  {mailto_link}")
        print(f"\n  ⚠️  Or share the temporary password securely.")
        print(f"  The user must change it on first login.\n")
    else:
        print(f"\n✗ Error: {result.get('error', 'Unknown error')}\n")


def list_users(api_url: str, admin_secret: str):
    """List all users via API."""
    result = api_request(api_url, admin_secret, '/api/admin/users', 'GET')
    
    if result.get('success'):
        users = result.get('users', [])
        if not users:
            print("\nNo users found.\n")
            return
        
        print(f"\n{'='*80}")
        print(f"{'ID':<22} {'Name':<20} {'Email':<30} {'Status':<10}")
        print(f"{'='*80}")
        
        for user in users:
            status = "Pending" if user.get('must_change_password', False) else "Active"
            print(f"{user['id']:<22} {user['name']:<20} {user['email']:<30} {status:<10}")
        
        print(f"{'='*80}")
        print(f"Total: {len(users)} users")
        print(f"API: {api_url}\n")
    else:
        print(f"\n✗ Error: {result.get('error', 'Unknown error')}\n")


def reset_password(api_url: str, admin_secret: str, email: str, new_password: str = None):
    """Reset a user's password via API."""
    if not new_password:
        new_password = generate_temp_password()
    
    result = api_request(api_url, admin_secret, '/api/admin/users', 'POST', {
        'email': email,
        'new_password': new_password
    })
    
    if result.get('success'):
        subject = "LearnFMPA - Réinitialisation de votre mot de passe"
        body = f"""Bonjour,

Votre mot de passe LearnFMPA a été réinitialisé.

Voici vos nouveaux identifiants de connexion :

📧 Email : {email}
🔑 Nouveau mot de passe temporaire : {new_password}

⚠️ IMPORTANT : Vous devrez changer ce mot de passe lors de votre prochaine connexion.

Pour vous connecter, rendez-vous sur :
{api_url}/login

Cordialement,
L'équipe LearnFMPA"""
        
        encoded_subject = urllib.parse.quote(subject)
        encoded_body = urllib.parse.quote(body)
        mailto_link = f"mailto:{email}?subject={encoded_subject}&body={encoded_body}"
        
        print(f"\n✓ Password reset successfully!")
        print(f"  Email: {email}")
        print(f"  New Temporary Password: {new_password}")
        print(f"\n📧 Send email to user:")
        print(f"  {mailto_link}")
        print(f"\n  The user must change it on next login.\n")
    else:
        print(f"\n✗ Error: {result.get('error', 'Unknown error')}\n")


def get_user_details(api_url: str, admin_secret: str, email: str):
    """Get user details via API."""
    result = api_request(api_url, admin_secret, f'/api/admin/users?email={email}', 'GET')
    
    if result.get('success'):
        user = result.get('user', {})
        print(f"\n{'='*50}")
        print(f"User Details")
        print(f"{'='*50}")
        print(f"  ID: {user.get('id', 'N/A')}")
        print(f"  Name: {user.get('name', 'N/A')}")
        print(f"  Email: {user.get('email', 'N/A')}")
        print(f"  Status: {'Active' if user.get('is_active', True) else 'Inactive'}")
        print(f"  Password Change Required: {'Yes' if user.get('must_change_password', False) else 'No'}")
        print(f"  Created: {user.get('created_at', 'N/A')}")
        print(f"  Last Login: {user.get('last_login', 'Never')}")
        print(f"{'='*50}\n")
    else:
        print(f"\n✗ Error: {result.get('error', 'Unknown error')}\n")


def set_user_status(api_url: str, admin_secret: str, email: str, is_active: bool):
    """Activate/Deactivate a user via API."""
    result = api_request(api_url, admin_secret, '/api/admin/users', 'POST', {
        'email': email,
        'is_active': is_active
    })
    
    if result.get('success'):
        print(f"\n✓ User '{email}' has been {'activated' if is_active else 'deactivated'}.\n")
    else:
        print(f"\n✗ Error: {result.get('error', 'Unknown error')}\n")


def delete_user(api_url: str, admin_secret: str, email: str):
    """Delete a user via API."""
    result = api_request(api_url, admin_secret, f'/api/admin/users?email={email}', 'DELETE')
    
    if result.get('success'):
        print(f"\n✓ User '{email}' has been deleted.\n")
    else:
        print(f"\n✗ Error: {result.get('error', 'Unknown error')}\n")


def show_progress(api_url: str, admin_secret: str, email: str):
    """Show user progress via API."""
    result = api_request(api_url, admin_secret, f'/api/admin/users/progress?email={email}', 'GET')
    
    if result.get('success'):
        progress = result.get('progress', {})
        print(f"\n{'='*60}")
        print(f"Progress for: {email}")
        print(f"{'='*60}")
        
        total_answered = 0
        for key, value in progress.items():
            if key.startswith('module_'):
                answered = len([k for k, v in value.items() if v]) if isinstance(value, dict) else 0
                total_answered += answered
                print(f"  {key}: {answered} questions answered")
        
        print(f"\n  Total questions answered: {total_answered}")
        print(f"{'='*60}\n")
    else:
        print(f"\n✗ Error: {result.get('error', 'Unknown error')}\n")


def main():
    parser = argparse.ArgumentParser(
        description="LearnFMPA User Management Script - Connects to Vercel API",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=f"""
Environment Variables:
  API_URL      - API endpoint (current: {DEFAULT_API_URL})
  ADMIN_SECRET - Admin key (required for operations)

Examples:
  python manage_users.py add "John Doe" "john@example.com"
  python manage_users.py add "John Doe" "john@example.com" -p MyP@ss123
  python manage_users.py list
  python manage_users.py reset "john@example.com"
  python manage_users.py details "john@example.com"
  python manage_users.py deactivate "john@example.com"
  python manage_users.py delete "john@example.com"
"""
    )
    
    parser.add_argument('--url', default=DEFAULT_API_URL, help='Override API URL')
    parser.add_argument('--secret', default=DEFAULT_ADMIN_SECRET, help='Override admin secret')
    
    subparsers = parser.add_subparsers(dest="command", help="Available commands")
    
    add_parser = subparsers.add_parser("add", help="Add a new user")
    add_parser.add_argument("name", help="User's full name")
    add_parser.add_argument("email", help="User's email address")
    add_parser.add_argument("-p", "--password", help="Temporary password (auto-generated if not provided)")
    
    subparsers.add_parser("list", help="List all users")
    
    reset_parser = subparsers.add_parser("reset", help="Reset user's password")
    reset_parser.add_argument("email", help="User's email address")
    reset_parser.add_argument("-p", "--password", help="New temporary password")
    
    details_parser = subparsers.add_parser("details", help="Get user details")
    details_parser.add_argument("email", help="User's email address")
    
    deactivate_parser = subparsers.add_parser("deactivate", help="Deactivate a user")
    deactivate_parser.add_argument("email", help="User's email address")
    
    activate_parser = subparsers.add_parser("activate", help="Activate a user")
    activate_parser.add_argument("email", help="User's email address")
    
    delete_parser = subparsers.add_parser("delete", help="Delete a user")
    delete_parser.add_argument("email", help="User's email address")
    
    progress_parser = subparsers.add_parser("progress", help="Show user progress")
    progress_parser.add_argument("email", help="User's email address")
    
    args = parser.parse_args()
    
    api_url = args.url
    admin_secret = args.secret
    
    if not args.command:
        parser.print_help()
        return
    
    print(f"\n📡 Connecting to: {api_url}")
    
    if args.command == "add":
        add_user(api_url, admin_secret, args.name, args.email, args.password)
    elif args.command == "list":
        list_users(api_url, admin_secret)
    elif args.command == "reset":
        reset_password(api_url, admin_secret, args.email, args.password)
    elif args.command == "details":
        get_user_details(api_url, admin_secret, args.email)
    elif args.command == "deactivate":
        set_user_status(api_url, admin_secret, args.email, False)
    elif args.command == "activate":
        set_user_status(api_url, admin_secret, args.email, True)
    elif args.command == "delete":
        delete_user(api_url, admin_secret, args.email)
    elif args.command == "progress":
        show_progress(api_url, admin_secret, args.email)


if __name__ == "__main__":
    main()
