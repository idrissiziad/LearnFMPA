#!/usr/bin/env python3
"""
LearnFMPA User Management Script

Manages @edu.uiz.ac.ma accounts - activation, premium trials, and more.

Subscription model:
  - New activated accounts get a 7-day premium trial (configurable with --days)
  - After the trial, accounts automatically downgrade to free tier
  - Free tier: unlimited time, 10 questions/day, no explanations after 10
  - Paid tier: unlimited questions, explanations, progress tracking

Usage:
  python manage_users.py add "Name" "student@edu.uiz.ac.ma"
  python manage_users.py add "Name" "student@edu.uiz.ac.ma" --paid --days 365
  python manage_users.py activate "student@edu.uiz.ac.ma"
  python manage_users.py activate "student@edu.uiz.ac.ma" --days 30
  python manage_users.py activate-batch --edu
  python manage_users.py activate-batch --edu --paid --days 3650
  python manage_users.py list
  python manage_users.py details "student@edu.uiz.ac.ma"
  python manage_users.py set-subscription "student@edu.uiz.ac.ma" paid
  python manage_users.py set-days "student@edu.uiz.ac.ma" 30
  python manage_users.py reset "student@edu.uiz.ac.ma"
  python manage_users.py deactivate "student@edu.uiz.ac.ma"
  python manage_users.py delete "student@edu.uiz.ac.ma"
  python manage_users.py progress "student@edu.uiz.ac.ma"

Environment Variables:
  API_URL       - API endpoint (default: https://www.learnfmpa.com)
  ADMIN_SECRET  - Admin key (default: learnfmpa2024)
"""

import json
import os
import secrets
import string
import argparse
import urllib.request
import urllib.error
import urllib.parse
from datetime import datetime, timedelta, timezone

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

VALID_STATUSES = ["inactive", "free", "paid"]


def generate_temp_password(length: int = 12) -> str:
    alphabet = string.ascii_letters + string.digits + "!@#$%^&*"
    return "".join(secrets.choice(alphabet) for _ in range(length))


def api_request(api_url, admin_secret, endpoint, method="GET", data=None):
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
        except Exception:
            return {"error": error_body}
    except urllib.error.URLError as e:
        return {"error": f"Cannot connect to {api_url}: {e}"}
    except Exception as e:
        return {"error": str(e)}


def add_user(api_url, admin_secret, name, email, temp_password=None, years=None, activation_days=None, has_paid=False, subscription_status=None):
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
    if subscription_status:
        payload["subscription_status"] = subscription_status

    result = api_request(api_url, admin_secret, "/api/admin/users", "POST", payload)

    if result.get("success"):
        sub = subscription_status or ("paid" if has_paid else "free")
        trial_days = activation_days or 7
        sub_display = sub.upper() if sub == "paid" else f"TRIAL ({trial_days} jours, puis gratuit)"
        subject = f"Bienvenue sur LearnFMPA - Vos identifiants de connexion"
        body = f"""Bonjour {name},

Votre compte LearnFMPA a été créé et activé avec succès.

Voici vos identifiants de connexion :

Email : {email}
Mot de passe temporaire : {temp_password}
Anne(s) : {', '.join(years) if years else '3ème année'}
Abonnement : {sub_display}

IMPORTANT : Vous devrez changer ce mot de passe lors de votre premiere connexion.

Pour vous connecter, rendez-vous sur :
{api_url}/login

Cordialement,
L'equipe LearnFMPA"""

        encoded_subject = urllib.parse.quote(subject)
        encoded_body = urllib.parse.quote(body)
        mailto_link = f"mailto:{email}?subject={encoded_subject}&body={encoded_body}"

        print(f"\n  User created successfully!")
        print(f"  Name:               {name}")
        print(f"  Email:              {email}")
        print(f"  Temporary Password: {temp_password}")
        print(f"  Year(s):            {', '.join(years) if years else '3eme annee'}")
        print(f"  Subscription:       {sub_display}")
        print(f"  User ID:            {result.get('user', {}).get('id', 'N/A')}")
        print(f"\n  Send email to user:")
        print(f"  {mailto_link}")
        print(f"\n  Or share the temporary password securely.")
        print(f"  The user must change it on first login.\n")
    else:
        print(f"\n  Error: {result.get('error', 'Unknown error')}\n")


def activate_user(api_url, admin_secret, email, paid=False, days=None):
    duration = f"{days}" if days else "7"
    user_result = api_request(api_url, admin_secret, f"/api/admin/users?email={email}", "GET")
    user_name = email
    if user_result.get("success"):
        user_name = user_result.get("user", {}).get("name", email)

    result = api_request(api_url, admin_secret, "/api/admin/users", "POST", {
        "action": "activate",
        "email": email,
    })

    if not result.get("success"):
        print(f"\n  Error: {result.get('error', 'Unknown error')}\n")
        return

    if days is not None:
        api_request(api_url, admin_secret, "/api/admin/users", "POST", {
            "action": "update_user",
            "email": email,
            "activation_days": days,
        })

    temp_password = generate_temp_password()
    reset_result = api_request(api_url, admin_secret, "/api/admin/users", "POST", {
        "action": "reset_password",
        "email": email,
        "new_password": temp_password,
    })

    if not reset_result.get("success"):
        print(f"\n  Account activated but failed to set temp password: {reset_result.get('error')}\n")
        return

    if paid:
        update_result = api_request(api_url, admin_secret, "/api/admin/users", "POST", {
            "action": "update_user",
            "email": email,
            "subscription_status": "paid",
        })
        if not update_result.get("success"):
            print(f"\n  Account activated but subscription update failed: {update_result.get('error')}\n")
            return
        sub = "PAID (acces complet)"
    else:
        sub = f"Essai Premium ({duration} jours, puis acces gratuit)"

    subject = f"Votre compte LearnFMPA est active !"
    body = f"""Bonjour {user_name},

Votre compte LearnFMPA est maintenant active !

Voici vos identifiants de connexion :

  Email : {email}
  Mot de passe temporaire : {temp_password}

IMPORTANT : Vous devez changer ce mot de passe lors de votre premiere connexion.

  Abonnement : {sub}

Connectez-vous sur : {api_url}/login

Bonnes revisions !
L'equipe LearnFMPA"""

    encoded_subject = urllib.parse.quote(subject)
    encoded_body = urllib.parse.quote(body)
    mailto_link = f"mailto:{email}?subject={encoded_subject}&body={encoded_body}"

    print(f"\n  {'=' * 50}")
    print(f"  Account activated successfully!")
    print(f"  {'=' * 50}")
    print(f"  Name:          {user_name}")
    print(f"  Email:         {email}")
    print(f"  Subscription:  {sub}")
    print(f"  Duration:      {duration}")
    print(f"  Temp Password: {temp_password}")
    print(f"")
    print(f"  IMPORTANT: Send this password to the user.")
    print(f"  They must change it on first login.")
    print(f"")
    print(f"  Send activation email:")
    print(f"  {mailto_link}")
    print(f"  {'=' * 50}\n")


def activate_batch(api_url, admin_secret, emails, paid=False, edu_only=False, days=None):
    if edu_only:
        print("  Fetching inactive @edu.uiz.ac.ma accounts...")
        result = api_request(api_url, admin_secret, "/api/admin/users", "GET")
        if not result.get("success"):
            print(f"\n  Error: {result.get('error', 'Unknown error')}\n")
            return
        all_users = result.get("users", [])
        emails = [u["email"] for u in all_users if u.get("email", "").endswith("@edu.uiz.ac.ma") and not u.get("is_active", True)]
        if not emails:
            print("\n  No inactive @edu.uiz.ac.ma accounts found.\n")
            return
        print(f"  Found {len(emails)} inactive edu account(s):\n")
        for e in emails:
            print(f"    - {e}")
        print()

    success = 0
    failed = 0
    mailto_links = []
    duration = f"{days} days" if days else "7"

    for email in emails:
        activate_result = api_request(api_url, admin_secret, "/api/admin/users", "POST", {
            "action": "activate",
            "email": email,
        })
        if not activate_result.get("success"):
            print(f"  x {email}: {activate_result.get('error', 'Failed')}")
            failed += 1
            continue

        temp_password = generate_temp_password()
        reset_result = api_request(api_url, admin_secret, "/api/admin/users", "POST", {
            "action": "reset_password",
            "email": email,
            "new_password": temp_password,
        })

        if not reset_result.get("success"):
            print(f"  ~ {email}: activated but failed to set temp password")
            failed += 1
            continue

        if paid:
            api_request(api_url, admin_secret, "/api/admin/users", "POST", {
                "action": "update_user",
                "email": email,
                "subscription_status": "paid",
            })
            print(f"  + {email}: activated (PAID) | temp: {temp_password}")
        else:
            print(f"  + {email}: activated (TRIAL {duration}) | temp: {temp_password}")

        if days is not None:
            api_request(api_url, admin_secret, "/api/admin/users", "POST", {
                "action": "update_user",
                "email": email,
                "activation_days": days,
            })

        user_result = api_request(api_url, admin_secret, f"/api/admin/users?email={email}", "GET")
        user_name = email
        if user_result.get("success"):
            user_name = user_result.get("user", {}).get("name", email)

        sub = "PAID (acces complet)" if paid else f"Essai Premium ({duration} jours, puis acces gratuit)"
        subject = f"Votre compte LearnFMPA est active !"
        body = f"""Bonjour {user_name},

Votre compte LearnFMPA est maintenant active !

Voici vos identifiants de connexion :

  Email : {email}
  Mot de passe temporaire : {temp_password}

IMPORTANT : Vous devez changer ce mot de passe lors de votre premiere connexion.

  Abonnement : {sub}

Connectez-vous sur : {api_url}/login

Bonnes revisions !
L'equipe LearnFMPA"""

        encoded_subject = urllib.parse.quote(subject)
        encoded_body = urllib.parse.quote(body)
        mailto_links.append(f"mailto:{email}?subject={encoded_subject}&body={encoded_body}")

        success += 1

    sub_type = "PAID" if paid else f"TRIAL ({duration} days)"
    print(f"\n  Batch activation complete ({sub_type}): {success} activated, {failed} failed.")

    if mailto_links:
        print(f"\n  Email links to send to users:")
        for link in mailto_links:
            print(f"  {link}")
    print()


def list_users(api_url, admin_secret, edu_only=False):
    result = api_request(api_url, admin_secret, "/api/admin/users", "GET")

    if result.get("success"):
        users = result.get("users", [])
        if edu_only:
            users = [u for u in users if u.get("email", "").endswith("@edu.uiz.ac.ma")]
        if not users:
            print("\n  No users found.\n")
            return

        print(f"\n{'=' * 130}")
        print(f"{'Email':<36} {'Name':<18} {'Sub':<10} {'Year(s)':<26} {'Active':<8} {'Days':<6} {'Ans':<5}")
        print(f"{'=' * 130}")

        for user in users:
            sub_raw = user.get("subscription_status", "?")
            sub = {"inactive": "  Inactive", "free": "  Free", "paid": "  Paid"}.get(sub_raw, sub_raw)
            years_list = user.get("years", ["3eme annee"])
            years_str = ", ".join(years_list) if isinstance(years_list, list) else str(years_list)
            active = "Yes" if user.get("is_active", True) else "No"
            daily = str(user.get("daily_answer_count", 0))
            days = str(user.get("activation_days", 150))

            print(f"{user['email']:<36} {user['name']:<18} {sub:<10} {years_str:<26} {active:<8} {days:<6} {daily:<5}")

        print(f"{'=' * 130}")
        if edu_only:
            print(f"Edu accounts: {len(users)}")
        else:
            print(f"Total: {len(users)} users")
        print(f"API: {api_url}\n")
    else:
        print(f"\n  Error: {result.get('error', 'Unknown error')}\n")


def get_user_details(api_url, admin_secret, email):
    result = api_request(api_url, admin_secret, f"/api/admin/users?email={email}", "GET")

    if result.get("success"):
        user = result.get("user", {})
        sub = user.get("subscription_status", "unknown")
        years_list = user.get("years", ["3eme annee"])
        years_str = ", ".join(years_list) if isinstance(years_list, list) else str(years_list)
        daily = user.get("daily_answer_count", 0)
        daily_reset = user.get("daily_answer_reset", "N/A")

        sub_emoji = {"inactive": "  Inactive", "free": "  Free (10 q/day)", "paid": "  Paid (unlimited)"}.get(sub, "  Unknown")
        activation_days = user.get("activation_days", 150)
        activated_at = user.get("activated_at")

        expiry_str = "N/A"
        if activated_at:
            try:
                activated_dt = datetime.fromisoformat(activated_at.replace("Z", "+00:00"))
                expiry_dt = activated_dt + timedelta(days=activation_days)
                now = datetime.now(activated_dt.tzinfo) if activated_dt.tzinfo else datetime.now()
                remaining = (expiry_dt - now).days
                if remaining > 0:
                    expiry_str = f"{expiry_dt.strftime('%Y-%m-%d')} ({remaining} days left)"
                else:
                    expiry_str = f"{expiry_dt.strftime('%Y-%m-%d')} (EXPIRED)"
            except Exception:
                expiry_str = activated_at

        print(f"\n{'=' * 50}")
        print(f"User Details")
        print(f"{'=' * 50}")
        print(f"  ID:                   {user.get('id', 'N/A')}")
        print(f"  Name:                 {user.get('name', 'N/A')}")
        print(f"  Email:                {user.get('email', 'N/A')}")
        print(f"  Subscription:         {sub_emoji}")
        print(f"  Active:               {'Yes' if user.get('is_active', True) else 'No'}")
        print(f"  Year(s):              {years_str}")
        print(f"  Has Paid:             {'Yes' if user.get('has_paid', False) else 'No'}")
        print(f"  Subscription Duration:{activation_days} days")
        print(f"  Activated On:         {activated_at or 'N/A'}")
        print(f"  Expires On:           {expiry_str}")
        print(f"  Daily Answers:        {daily} (resets daily)")
        print(f"  Daily Reset Date:     {daily_reset}")
        print(f"  Password Change:      {'Required' if user.get('must_change_password', False) else 'Not required'}")
        print(f"  Created:              {user.get('created_at', 'N/A')}")
        print(f"  Last Login:           {user.get('last_login', 'Never')}")
        print(f"{'=' * 50}\n")
    else:
        print(f"\n  Error: {result.get('error', 'Unknown error')}\n")


def set_subscription(api_url, admin_secret, email, status):
    if status not in VALID_STATUSES:
        print(f"\n  Invalid status '{status}'. Valid: {', '.join(VALID_STATUSES)}\n")
        return

    payload = {"action": "update_user", "email": email, "subscription_status": status}
    result = api_request(api_url, admin_secret, "/api/admin/users", "POST", payload)

    if result.get("success"):
        status_desc = {"inactive": "Inactive (cannot log in)", "free": "Free (10 questions/day)", "paid": "Paid (unlimited access)"}.get(status, status)
        print(f"\n  User '{email}' subscription set to: {status_desc}\n")
    else:
        print(f"\n  Error: {result.get('error', 'Unknown error')}\n")


def set_user_years(api_url, admin_secret, email, years):
    invalid = [y for y in years if y not in VALID_YEARS]
    if invalid:
        print(f"\n  Invalid year(s): {', '.join(invalid)}. Valid: {', '.join(VALID_YEARS)}\n")
        return

    result = api_request(api_url, admin_secret, "/api/admin/users", "POST", {
        "action": "update_user", "email": email, "years": years,
    })

    if result.get("success"):
        print(f"\n  User '{email}' year(s) set to '{', '.join(years)}'.\n")
    else:
        print(f"\n  Error: {result.get('error', 'Unknown error')}\n")


def set_activation_days(api_url, admin_secret, email, days):
    if days <= 0:
        print(f"\n  Error: Days must be a positive number.\n")
        return

    result = api_request(api_url, admin_secret, "/api/admin/users", "POST", {
        "action": "update_user", "email": email, "activation_days": days,
    })

    if result.get("success"):
        user_result = api_request(api_url, admin_secret, f"/api/admin/users?email={email}", "GET")
        if user_result.get("success"):
            user = user_result.get("user", {})
            activated_at = user.get("activated_at")
            activation_days = user.get("activation_days", days)
            if activated_at:
                try:
                    from datetime import datetime as dt
                    activated_dt = dt.fromisoformat(activated_at.replace("Z", "+00:00"))
                    expiry = activated_dt + timedelta(days=activation_days)
                    print(f"\n  Subscription duration set to {days} days for '{email}'.")
                    print(f"  Expires on: {expiry.strftime('%Y-%m-%d %H:%M')}\n")
                except Exception:
                    print(f"\n  Subscription duration set to {days} days for '{email}'.\n")
            else:
                print(f"\n  Subscription duration set to {days} days for '{email}'.")
                print(f"  (Expiration date will be calculated once account is activated)\n")
        else:
            print(f"\n  Subscription duration set to {days} days for '{email}'.\n")
    else:
        print(f"\n  Error: {result.get('error', 'Unknown error')}\n")


def reset_password(api_url, admin_secret, email, new_password=None):
    if not new_password:
        new_password = generate_temp_password()

    result = api_request(api_url, admin_secret, "/api/admin/users", "POST", {
        "action": "reset_password", "email": email, "new_password": new_password,
    })

    if result.get("success"):
        subject = "LearnFMPA - Reinitialisation de votre mot de passe"
        body = f"""Bonjour,

Votre mot de passe LearnFMPA a ete reinitialise.

Email : {email}
Nouveau mot de passe temporaire : {new_password}

IMPORTANT : Vous devrez changer ce mot de passe lors de votre prochaine connexion.

Pour vous connecter : {api_url}/login

Cordialement,
L'equipe LearnFMPA"""

        encoded_subject = urllib.parse.quote(subject)
        encoded_body = urllib.parse.quote(body)
        mailto_link = f"mailto:{email}?subject={encoded_subject}&body={encoded_body}"

        print(f"\n  Password reset successfully!")
        print(f"  Email:                {email}")
        print(f"  New Temporary Password: {new_password}")
        print(f"\n  Send email to user:")
        print(f"  {mailto_link}\n")
    else:
        print(f"\n  Error: {result.get('error', 'Unknown error')}\n")


def set_user_status(api_url, admin_secret, email, is_active):
    result = api_request(api_url, admin_secret, "/api/admin/users", "POST", {
        "action": "set_active", "email": email, "is_active": is_active,
    })

    if result.get("success"):
        print(f"\n  User '{email}' has been {'activated' if is_active else 'deactivated'}.\n")
    else:
        print(f"\n  Error: {result.get('error', 'Unknown error')}\n")


def delete_user(api_url, admin_secret, email):
    confirm = input(f"  Are you sure you want to delete '{email}'? Type 'yes' to confirm: ")
    if confirm.lower() != "yes":
        print("  Cancelled.\n")
        return

    result = api_request(api_url, admin_secret, f"/api/admin/users?email={email}", "DELETE")

    if result.get("success"):
        print(f"\n  User '{email}' has been deleted.\n")
    else:
        print(f"\n  Error: {result.get('error', 'Unknown error')}\n")


def show_progress(api_url, admin_secret, email):
    result = api_request(api_url, admin_secret, f"/api/admin/users/progress?email={email}", "GET")

    if result.get("success"):
        progress = result.get("progress", {})
        print(f"\n{'=' * 60}")
        print(f"Progress for: {email}")
        print(f"{'=' * 60}")

        total_answered = 0
        for key, value in progress.items():
            if key.startswith("module_"):
                answered = len([k for k, v in value.items() if v]) if isinstance(value, dict) else 0
                total_answered += answered
                print(f"  {key}: {answered} questions answered")

        print(f"\n  Total questions answered: {total_answered}")
        print(f"{'=' * 60}\n")
    else:
        print(f"\n  Error: {result.get('error', 'Unknown error')}\n")


def main():
    parser = argparse.ArgumentParser(
        description="LearnFMPA User Management - @edu.uiz.ac.ma Account Manager",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=f"""
Subscription Tiers:
  inactive  - Account not yet activated (cannot log in)
  paid      - Premium access: unlimited questions, explanations, progress tracking
  free      - Free tier: 10 questions/day, no explanations after 10, no progress tracking

Premium Trial:
  Every newly activated account gets a 7-day premium trial (configurable with --days).
  After the trial expires, the account automatically downgrades to the free tier.
  Free tier has unlimited time - accounts never expire.
  Use 'details' to see the exact trial expiration date.
  Use 'set-days' to extend or modify the trial duration.

Valid Years:
  {', '.join(VALID_YEARS)}

Examples:
  # List all accounts
  python manage_users.py list

  # List only edu accounts
  python manage_users.py list --edu

  # View detailed info for a user (shows trial expiration date)
  python manage_users.py details "a.benali@edu.uiz.ac.ma"

  # Create a paid user with 1-year access
  python manage_users.py add "Ahmed Benali" "a.benali@edu.uiz.ac.ma" --paid --days 365

  # Create a user with default 7-day premium trial
  python manage_users.py add "Ahmed Benali" "a.benali@edu.uiz.ac.ma"

  # Activate a single edu user (starts 7-day premium trial)
  python manage_users.py activate "a.benali@edu.uiz.ac.ma"

  # Activate with 30-day premium trial instead
  python manage_users.py activate "a.benali@edu.uiz.ac.ma" --days 30

  # Activate as permanently paid (e.g., extended or permanent access)
  python manage_users.py activate "a.benali@edu.uiz.ac.ma" --paid --days 3650

  # Batch activate ALL inactive edu accounts
  python manage_users.py activate-batch --edu

  # Batch activate with 30-day trial
  python manage_users.py activate-batch --edu --days 30

  # Batch activate as permanently paid
  python manage_users.py activate-batch --edu --paid --days 365

  # Batch activate specific emails
  python manage_users.py activate-batch a@edu.uiz.ac.ma b@edu.uiz.ac.ma

  # Change subscription tier permanently
  python manage_users.py set-subscription "a.benali@edu.uiz.ac.ma" paid
  python manage_users.py set-subscription "a.benali@edu.uiz.ac.ma" free

  # Extend premium trial duration
  python manage_users.py set-days "a.benali@edu.uiz.ac.ma" 30

  # Reset password
  python manage_users.py reset "a.benali@edu.uiz.ac.ma"

  # Deactivate / delete
  python manage_users.py deactivate "a.benali@edu.uiz.ac.ma"
  python manage_users.py delete "a.benali@edu.uiz.ac.ma"

  # View user progress
  python manage_users.py progress "a.benali@edu.uiz.ac.ma"
""",
    )

    parser.add_argument("--url", default=DEFAULT_API_URL, help="Override API URL")
    parser.add_argument("--secret", default=DEFAULT_ADMIN_SECRET, help="Override admin secret")

    subparsers = parser.add_subparsers(dest="command", help="Available commands")

    add_parser = subparsers.add_parser("add", help="Create a new user (auto-activated)")
    add_parser.add_argument("name", help="User's full name")
    add_parser.add_argument("email", help="User's @edu.uiz.ac.ma email")
    add_parser.add_argument("-p", "--password", help="Temporary password (auto-generated)")
    add_parser.add_argument("-y", "--year", choices=VALID_YEARS, default=None, action="append", help="Study year(s)")
    add_parser.add_argument("-d", "--days", type=int, default=None, help="Activation days (default: 150)")
    add_parser.add_argument("--paid", action="store_true", help="Set subscription to 'paid'")
    add_parser.add_argument("--sub", choices=VALID_STATUSES, default=None, help="Subscription status (default: free, or paid if --paid)")

    list_parser = subparsers.add_parser("list", help="List users")
    list_parser.add_argument("--edu", action="store_true", help="Show only @edu.uiz.ac.ma accounts")

    activate_parser = subparsers.add_parser("activate", help="Activate a registered but inactive user")
    activate_parser.add_argument("email", help="User's @edu.uiz.ac.ma email")
    activate_parser.add_argument("--paid", action="store_true", help="Set subscription to 'paid' instead of 'free'")
    activate_parser.add_argument("--days", type=int, default=None, help="Premium trial duration in days (default: 7)")

    batch_parser = subparsers.add_parser("activate-batch", help="Activate multiple users, or all inactive @edu accounts with --edu")
    batch_parser.add_argument("emails", nargs="*", help="Email addresses to activate (not needed with --edu)")
    batch_parser.add_argument("--edu", action="store_true", help="Auto-select all inactive @edu.uiz.ac.ma accounts")
    batch_parser.add_argument("--paid", action="store_true", help="Set all to 'paid' subscription")
    batch_parser.add_argument("--days", type=int, default=None, help="Premium trial duration in days (default: 7)")

    reset_parser = subparsers.add_parser("reset", help="Reset user's password")
    reset_parser.add_argument("email", help="User's email")
    reset_parser.add_argument("-p", "--password", help="New temporary password")

    details_parser = subparsers.add_parser("details", help="Get detailed user info")
    details_parser.add_argument("email", help="User's email")

    sub_parser = subparsers.add_parser("set-subscription", help="Set subscription status (inactive/free/paid)")
    sub_parser.add_argument("email", help="User's email")
    sub_parser.add_argument("status", choices=VALID_STATUSES, help="Subscription status")

    year_parser = subparsers.add_parser("set-year", help="Set user's study year(s)")
    year_parser.add_argument("email", help="User's email")
    year_parser.add_argument("year", choices=VALID_YEARS, nargs="+", help="Study year(s)")

    days_parser = subparsers.add_parser("set-days", help="Set subscription duration in days (from activated_at)")
    days_parser.add_argument("email", help="User's email")
    days_parser.add_argument("days", type=int, help="Number of days for subscription duration")

    deactivate_parser = subparsers.add_parser("deactivate", help="Deactivate a user (cannot log in)")
    deactivate_parser.add_argument("email", help="User's email")

    delete_parser = subparsers.add_parser("delete", help="Permanently delete a user")
    delete_parser.add_argument("email", help="User's email")

    progress_parser = subparsers.add_parser("progress", help="Show user progress")
    progress_parser.add_argument("email", help="User's email")

    args = parser.parse_args()

    if not args.command:
        parser.print_help()
        return

    api_url = args.url
    admin_secret = args.secret

    print(f"\n  Connecting to: {api_url}")

    if args.command == "add":
        sub = args.sub or ("paid" if args.paid else "free")
        add_user(api_url, admin_secret, args.name, args.email, args.password, args.year, args.days, args.paid, sub)
    elif args.command == "list":
        list_users(api_url, admin_secret, args.edu)
    elif args.command == "activate":
        activate_user(api_url, admin_secret, args.email, args.paid, args.days)
    elif args.command == "activate-batch":
        if not args.emails and not args.edu:
            print("\n  Error: provide emails or use --edu to auto-select inactive edu accounts.\n")
            return
        activate_batch(api_url, admin_secret, args.emails, args.paid, args.edu, args.days)
    elif args.command == "reset":
        reset_password(api_url, admin_secret, args.email, args.password)
    elif args.command == "details":
        get_user_details(api_url, admin_secret, args.email)
    elif args.command == "set-subscription":
        set_subscription(api_url, admin_secret, args.email, args.status)
    elif args.command == "set-year":
        set_user_years(api_url, admin_secret, args.email, args.year)
    elif args.command == "set-days":
        set_activation_days(api_url, admin_secret, args.email, args.days)
    elif args.command == "deactivate":
        set_user_status(api_url, admin_secret, args.email, False)
    elif args.command == "delete":
        delete_user(api_url, admin_secret, args.email)
    elif args.command == "progress":
        show_progress(api_url, admin_secret, args.email)


if __name__ == "__main__":
    main()