#!/usr/bin/env python3
"""
LearnFMPA User Management Script

Automatically connects to the Vercel deployment API.

Usage:
  python manage_users.py add "Name" "email@example.com"
  python manage_users.py add "Name" "email@example.com" -y "3ème année" -d 150 --paid
  python manage_users.py list
  python manage_users.py reset "email@example.com"
  python manage_users.py set-year "email@example.com" "3ème année"
  python manage_users.py set-days "email@example.com" 300
  python manage_users.py set-paid "email@example.com" true
    python manage_users.py migrate "user1@email.com" "user2@email.com" --from "2ème année" --to "3ème année"

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
from datetime import datetime, timedelta

DEFAULT_API_URL = os.environ.get("API_URL", "https://www.learnfmpa.com")
DEFAULT_ADMIN_SECRET = os.environ.get("ADMIN_SECRET", "learnfmpa2024")

VALID_YEARS = [
    "1ère année",
    "2ème année",
    "3ème année",
    "4ème année",
    "5ème année",
    "6ème année",
]


def generate_temp_password(length: int = 12) -> str:
    alphabet = string.ascii_letters + string.digits + "!@#$%^&*"
    return "".join(secrets.choice(alphabet) for _ in range(length))


def api_request(
    api_url: str,
    admin_secret: str,
    endpoint: str,
    method: str = "GET",
    data: dict = None,
) -> dict:
    """Make an API request to the Vercel deployment."""
    url = f"{api_url}{endpoint}"

    headers = {"Content-Type": "application/json"}

    if "admin_secret" not in endpoint:
        url = f"{url}{'?' if '?' not in url else '&'}admin_secret={admin_secret}"

    req_data = None
    if data:
        data["admin_secret"] = admin_secret
        req_data = json.dumps(data).encode("utf-8")

    try:
        req = urllib.request.Request(url, data=req_data, headers=headers, method=method)

        with urllib.request.urlopen(req, timeout=30) as response:
            return json.loads(response.read().decode("utf-8"))

    except urllib.error.HTTPError as e:
        error_body = e.read().decode("utf-8")
        try:
            return json.loads(error_body)
        except:
            return {"error": error_body}
    except urllib.error.URLError as e:
        return {"error": f"Cannot connect to {api_url}: {e}"}
    except Exception as e:
        return {"error": str(e)}


def add_user(
    api_url: str,
    admin_secret: str,
    name: str,
    email: str,
    temp_password: str = None,
    years: list = None,
    activation_days: int = None,
    has_paid: bool = False,
):
    """Add a new user via API."""
    if not temp_password:
        temp_password = generate_temp_password()

    payload = {
        "name": name,
        "email": email,
        "password": temp_password,
        "has_paid": has_paid,
    }
    if years:
        payload["years"] = years
    if activation_days is not None:
        payload["activation_days"] = activation_days

    result = api_request(api_url, admin_secret, "/api/admin/users", "POST", payload)

    if result.get("success"):
        subject = f"Bienvenue sur LearnFMPA - Vos identifiants de connexion"
        body = f"""Bonjour {name},

Votre compte LearnFMPA a été créé avec succès.

Voici vos identifiants de connexion :

📧 Email : {email}
🔑 Mot de passe temporaire : {temp_password}
🎓 Année(s) : {", ".join(years) if years else "3ème année"}
⏳ Durée d'accès : {activation_days or 150} jours
💰 Paiement : {"Oui" if has_paid else "Non"}

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
        print(f"  Year(s): {', '.join(years) if years else '3ème année'}")
        print(f"  Activation Days: {activation_days or 150}")
        print(f"  Has Paid: {'Yes' if has_paid else 'No'}")
        print(f"  User ID: {result.get('user', {}).get('id', 'N/A')}")
        print(f"\n📧 Send email to user:")
        print(f"  {mailto_link}")
        print(f"\n  ⚠️  Or share the temporary password securely.")
        print(f"  The user must change it on first login.\n")
    else:
        print(f"\n✗ Error: {result.get('error', 'Unknown error')}\n")


def list_users(api_url: str, admin_secret: str):
    """List all users via API."""
    result = api_request(api_url, admin_secret, "/api/admin/users", "GET")

    if result.get("success"):
        users = result.get("users", [])
        if not users:
            print("\nNo users found.\n")
            return

        print(f"\n{'=' * 140}")
        print(
            f"{'ID':<22} {'Name':<18} {'Email':<28} {'Year(s)':<30} {'Days':<6} {'Paid':<6} {'Status':<10}"
        )
        print(f"{'=' * 140}")

        for user in users:
            status = "Pending" if user.get("must_change_password", False) else "Active"
            if not user.get("is_active", True):
                status = "Inactive"
            years_list = user.get("years", ["3ème année"])
            years_str = (
                ", ".join(years_list)
                if isinstance(years_list, list)
                else str(years_list)
            )
            days = str(user.get("activation_days", 150))
            paid = "Yes" if user.get("has_paid", False) else "No"

            activated_at = user.get("activated_at")
            if activated_at and user.get("is_active", True):
                try:
                    activated_date = datetime.fromisoformat(
                        activated_at.replace("Z", "+00:00")
                    )
                    expiration = activated_date + timedelta(
                        days=user.get("activation_days", 150)
                    )
                    if datetime.now(expiration.tzinfo) > expiration:
                        status = "Expired"
                except:
                    pass

            print(
                f"{user['id']:<22} {user['name']:<18} {user['email']:<28} {years_str:<30} {days:<6} {paid:<6} {status:<10}"
            )

        print(f"{'=' * 140}")
        print(f"Total: {len(users)} users")
        print(f"API: {api_url}\n")
    else:
        print(f"\n✗ Error: {result.get('error', 'Unknown error')}\n")


def reset_password(
    api_url: str, admin_secret: str, email: str, new_password: str = None
):
    """Reset a user's password via API."""
    if not new_password:
        new_password = generate_temp_password()

    result = api_request(
        api_url,
        admin_secret,
        "/api/admin/users",
        "POST",
        {"action": "reset_password", "email": email, "new_password": new_password},
    )

    if result.get("success"):
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
    result = api_request(
        api_url, admin_secret, f"/api/admin/users?email={email}", "GET"
    )

    if result.get("success"):
        user = result.get("user", {})
        activated_at = user.get("activated_at")
        activation_days = user.get("activation_days", 150)
        expiration_str = "N/A"

        if activated_at:
            try:
                activated_date = datetime.fromisoformat(
                    activated_at.replace("Z", "+00:00")
                )
                expiration = activated_date + timedelta(days=activation_days)
                expiration_str = expiration.strftime("%Y-%m-%d")
            except:
                pass

        print(f"\n{'=' * 50}")
        print(f"User Details")
        print(f"{'=' * 50}")
        print(f"  ID: {user.get('id', 'N/A')}")
        print(f"  Name: {user.get('name', 'N/A')}")
        print(f"  Email: {user.get('email', 'N/A')}")
        print(f"  Status: {'Active' if user.get('is_active', True) else 'Inactive'}")
        print(
            f"  Password Change Required: {'Yes' if user.get('must_change_password', False) else 'No'}"
        )
        years_list = user.get("years", ["3ème année"])
        years_str = (
            ", ".join(years_list) if isinstance(years_list, list) else str(years_list)
        )
        print(f"  Year(s): {years_str}")
        print(f"  Activation Days: {activation_days}")
        print(f"  Activated At: {activated_at or 'N/A'}")
        print(f"  Expires On: {expiration_str}")
        print(f"  Has Paid: {'Yes' if user.get('has_paid', False) else 'No'}")
        print(f"  Created: {user.get('created_at', 'N/A')}")
        print(f"  Last Login: {user.get('last_login', 'Never')}")
        print(f"{'=' * 50}\n")
    else:
        print(f"\n✗ Error: {result.get('error', 'Unknown error')}\n")


def set_user_status(api_url: str, admin_secret: str, email: str, is_active: bool):
    """Activate/Deactivate a user via API."""
    result = api_request(
        api_url,
        admin_secret,
        "/api/admin/users",
        "POST",
        {"action": "set_active", "email": email, "is_active": is_active},
    )

    if result.get("success"):
        print(
            f"\n✓ User '{email}' has been {'activated' if is_active else 'deactivated'}.\n"
        )
    else:
        print(f"\n✗ Error: {result.get('error', 'Unknown error')}\n")


def set_user_years(api_url: str, admin_secret: str, email: str, years: list):
    """Set a user's study year(s) via API."""
    invalid = [y for y in years if y not in VALID_YEARS]
    if invalid:
        print(
            f"\n✗ Invalid year(s): {', '.join(invalid)}. Valid options: {', '.join(VALID_YEARS)}\n"
        )
        return

    result = api_request(
        api_url,
        admin_secret,
        "/api/admin/users",
        "POST",
        {"action": "update_user", "email": email, "years": years},
    )

    if result.get("success"):
        print(f"\n✓ User '{email}' year(s) set to '{', '.join(years)}'.\n")
    else:
        print(f"\n✗ Error: {result.get('error', 'Unknown error')}\n")


def set_user_activation_days(api_url: str, admin_secret: str, email: str, days: int):
    """Set a user's activation days via API."""
    if days <= 0:
        print(f"\n✗ Activation days must be a positive number.\n")
        return

    result = api_request(
        api_url,
        admin_secret,
        "/api/admin/users",
        "POST",
        {"action": "update_user", "email": email, "activation_days": days},
    )

    if result.get("success"):
        print(f"\n✓ User '{email}' activation days set to {days}.\n")
    else:
        print(f"\n✗ Error: {result.get('error', 'Unknown error')}\n")


def set_user_paid(api_url: str, admin_secret: str, email: str, has_paid: bool):
    """Set a user's payment status via API."""
    result = api_request(
        api_url,
        admin_secret,
        "/api/admin/users",
        "POST",
        {"action": "update_user", "email": email, "has_paid": has_paid},
    )

    if result.get("success"):
        print(
            f"\n✓ User '{email}' payment status set to {'paid' if has_paid else 'unpaid'}.\n"
        )
    else:
        print(f"\n✗ Error: {result.get('error', 'Unknown error')}\n")


def renew_user(api_url: str, admin_secret: str, email: str, days: int = None):
    """Renew a user's account by resetting activation from today."""
    result_get = api_request(
        api_url, admin_secret, f"/api/admin/users?email={email}", "GET"
    )

    if not result_get.get("success"):
        print(f"\n✗ Error: {result_get.get('error', 'Unknown error')}\n")
        return

    user = result_get.get("user", {})
    current_days = days or user.get("activation_days", 150)

    payload = {
        "action": "update_user",
        "email": email,
        "activation_days": current_days,
    }

    result = api_request(api_url, admin_secret, "/api/admin/users", "POST", payload)

    if result.get("success"):
        expiration = datetime.now() + timedelta(days=current_days)
        print(f"\n✓ User '{email}' account renewed.")
        print(f"  Activation days: {current_days}")
        print(f"  New expiration: {expiration.strftime('%Y-%m-%d')}\n")
    else:
        print(f"\n✗ Error: {result.get('error', 'Unknown error')}\n")


def delete_user(api_url: str, admin_secret: str, email: str):
    """Delete a user via API."""
    result = api_request(
        api_url, admin_secret, f"/api/admin/users?email={email}", "DELETE"
    )

    if result.get("success"):
        print(f"\n✓ User '{email}' has been deleted.\n")
    else:
        print(f"\n✗ Error: {result.get('error', 'Unknown error')}\n")


def show_progress(api_url: str, admin_secret: str, email: str):
    """Show user progress via API."""
    result = api_request(
        api_url, admin_secret, f"/api/admin/users/progress?email={email}", "GET"
    )

    if result.get("success"):
        progress = result.get("progress", {})
        print(f"\n{'=' * 60}")
        print(f"Progress for: {email}")
        print(f"{'=' * 60}")

        total_answered = 0
        for key, value in progress.items():
            if key.startswith("module_"):
                answered = (
                    len([k for k, v in value.items() if v])
                    if isinstance(value, dict)
                    else 0
                )
                total_answered += answered
                print(f"  {key}: {answered} questions answered")

        print(f"\n  Total questions answered: {total_answered}")
        print(f"{'=' * 60}\n")
    else:
        print(f"\n✗ Error: {result.get('error', 'Unknown error')}\n")


def migrate_users(
    api_url: str, admin_secret: str, emails: list, from_year: str, to_year: str
):
    """Migrate specified users from one year to another."""
    if from_year not in VALID_YEARS:
        print(
            f"\n✗ Invalid source year '{from_year}'. Valid options: {', '.join(VALID_YEARS)}\n"
        )
        return
    if to_year not in VALID_YEARS:
        print(
            f"\n✗ Invalid target year '{to_year}'. Valid options: {', '.join(VALID_YEARS)}\n"
        )
        return

    migrated = 0
    skipped = 0
    failed = 0

    for email in emails:
        result = api_request(
            api_url, admin_secret, f"/api/admin/users?email={email}", "GET"
        )

        if not result.get("success"):
            print(f"  ✗ {email}: User not found")
            failed += 1
            continue

        user = result.get("user", {})
        current_years = user.get("years", ["3ème année"])

        if not isinstance(current_years, list):
            current_years = [current_years]

        if from_year not in current_years:
            print(
                f"  ⚠ {email}: Not in '{from_year}' (currently: {', '.join(current_years)})"
            )
            skipped += 1
            continue

        new_years = [y if y != from_year else to_year for y in current_years]

        set_result = api_request(
            api_url,
            admin_secret,
            "/api/admin/users",
            "POST",
            {"action": "update_user", "email": email, "years": new_years},
        )

        if set_result.get("success"):
            migrated += 1
            old_str = ", ".join(current_years)
            new_str = ", ".join(new_years)
            print(f"  ✓ {email}: '{old_str}' → '{new_str}'")
        else:
            failed += 1
            print(f"  ✗ {email}: {set_result.get('error', 'Failed')}")

    print(
        f"\nMigration complete: {migrated} migrated, {skipped} skipped, {failed} failed.\n"
    )


def main():
    parser = argparse.ArgumentParser(
        description="LearnFMPA User Management Script - Connects to Vercel API",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=f"""
Environment Variables:
  API_URL      - API endpoint (current: {DEFAULT_API_URL})
  ADMIN_SECRET - Admin key (required for operations)

Valid Years:
  {", ".join(VALID_YEARS)}

Examples:
   python manage_users.py add "John Doe" "john@example.com"
   python manage_users.py add "John Doe" "john@example.com" -y "3ème année" -d 150 --paid
   python manage_users.py add "John Doe" "john@example.com" -y "2ème année" -y "3ème année" -d 300
   python manage_users.py list
   python manage_users.py details "john@example.com"
   python manage_users.py set-year "john@example.com" "3ème année"
   python manage_users.py set-year "john@example.com" "2ème année" "3ème année"
   python manage_users.py set-days "john@example.com" 300
   python manage_users.py set-paid "john@example.com" true
   python manage_users.py renew "john@example.com"
   python manage_users.py renew "john@example.com" -d 300
  python manage_users.py migrate user1@email.com user2@email.com --from "2ème année" --to "3ème année"
    python manage_users.py reset "john@example.com"
   python manage_users.py deactivate "john@example.com"
   python manage_users.py delete "john@example.com"
""",
    )

    parser.add_argument("--url", default=DEFAULT_API_URL, help="Override API URL")
    parser.add_argument(
        "--secret", default=DEFAULT_ADMIN_SECRET, help="Override admin secret"
    )

    subparsers = parser.add_subparsers(dest="command", help="Available commands")

    add_parser = subparsers.add_parser("add", help="Add a new user")
    add_parser.add_argument("name", help="User's full name")
    add_parser.add_argument("email", help="User's email address")
    add_parser.add_argument(
        "-p", "--password", help="Temporary password (auto-generated if not provided)"
    )
    add_parser.add_argument(
        "-y",
        "--year",
        choices=VALID_YEARS,
        default=None,
        action="append",
        help="Study year (can be specified multiple times, default: 3ème année)",
    )
    add_parser.add_argument(
        "-d", "--days", type=int, default=None, help="Activation days (default: 150)"
    )
    add_parser.add_argument("--paid", action="store_true", help="Mark user as paid")

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

    set_year_parser = subparsers.add_parser("set-year", help="Set user's study year(s)")
    set_year_parser.add_argument("email", help="User's email address")
    set_year_parser.add_argument(
        "year",
        choices=VALID_YEARS,
        nargs="+",
        help="Study year(s) to set (can specify multiple)",
    )

    set_days_parser = subparsers.add_parser(
        "set-days", help="Set user's activation days"
    )
    set_days_parser.add_argument("email", help="User's email address")
    set_days_parser.add_argument("days", type=int, help="Number of activation days")

    set_paid_parser = subparsers.add_parser(
        "set-paid", help="Set user's payment status"
    )
    set_paid_parser.add_argument("email", help="User's email address")
    set_paid_parser.add_argument(
        "paid", choices=["true", "false"], help="Payment status (true/false)"
    )

    renew_parser = subparsers.add_parser(
        "renew", help="Renew user's account activation"
    )
    renew_parser.add_argument("email", help="User's email address")
    renew_parser.add_argument(
        "-d",
        "--days",
        type=int,
        default=None,
        help="New activation days (keeps current if not set)",
    )

    migrate_parser = subparsers.add_parser(
        "migrate",
        help="Migrate specific users from one year to another",
    )
    migrate_parser.add_argument(
        "email",
        nargs="+",
        help="Email address(es) of user(s) to migrate",
    )
    migrate_parser.add_argument(
        "--from",
        dest="from_year",
        choices=VALID_YEARS,
        required=True,
        help="Source year to migrate from",
    )
    migrate_parser.add_argument(
        "--to",
        dest="to_year",
        choices=VALID_YEARS,
        required=True,
        help="Target year to migrate to",
    )

    args = parser.parse_args()

    api_url = args.url
    admin_secret = args.secret

    if not args.command:
        parser.print_help()
        return

    print(f"\n📡 Connecting to: {api_url}")

    if args.command == "add":
        add_user(
            api_url,
            admin_secret,
            args.name,
            args.email,
            args.password,
            years=args.year,
            activation_days=args.days,
            has_paid=args.paid,
        )
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
    elif args.command == "set-year":
        set_user_years(api_url, admin_secret, args.email, args.year)
    elif args.command == "set-days":
        set_user_activation_days(api_url, admin_secret, args.email, args.days)
    elif args.command == "set-paid":
        set_user_paid(api_url, admin_secret, args.email, args.paid == "true")
    elif args.command == "renew":
        renew_user(api_url, admin_secret, args.email, args.days)
    elif args.command == "migrate":
        migrate_users(api_url, admin_secret, args.email, args.from_year, args.to_year)


if __name__ == "__main__":
    main()
