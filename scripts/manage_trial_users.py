#!/usr/bin/env python3
"""
LearnFMPA Trial Users Management Script

Manages trial users separately from regular users.
Trial users get 7 days of free access upon sign-up.

Usage:
  python manage_trial_users.py list
  python manage_trial_users.py list --active
  python manage_trial_users.py list --expired
  python manage_trial_users.py details "email@example.com"
  python manage_trial_users.py convert "email@example.com"
  python manage_trial_users.py convert "email@example.com" -d 150
  python manage_trial_users.py extend "email@example.com" -d 7
  python manage_trial_users.py deactivate "email@example.com"
  python manage_trial_users.py activate "email@example.com"
  python manage_trial_users.py delete "email@example.com"
  python manage_trial_users.py stats

Set environment variables:
  API_URL      - Your Vercel deployment URL (default: https://www.learnfmpa.com)
  ADMIN_SECRET - Admin secret key (default: learnfmpa2024)
"""

import json
import os
import argparse
import urllib.request
import urllib.error
import urllib.parse
from datetime import datetime, timedelta, timezone

DEFAULT_API_URL = os.environ.get("API_URL", "https://www.learnfmpa.com")
DEFAULT_ADMIN_SECRET = os.environ.get("ADMIN_SECRET", "learnfmpa2024")
TRIAL_DAYS = 7


def api_request(
    api_url: str,
    admin_secret: str,
    endpoint: str,
    method: str = "GET",
    data: dict = None,
) -> dict:
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


def is_trial_expired(user: dict) -> bool:
    if not user.get("is_trial"):
        return False
    activated_at = user.get("activated_at") or user.get("trial_started_at")
    if not activated_at:
        return False
    try:
        activated_date = datetime.fromisoformat(activated_at.replace("Z", "+00:00"))
        activation_days = user.get("activation_days", TRIAL_DAYS)
        expiration = activated_date + timedelta(days=activation_days)
        return datetime.now(timezone.utc) > expiration
    except Exception:
        return False


def get_trial_remaining_days(user: dict) -> str:
    activated_at = user.get("activated_at") or user.get("trial_started_at")
    if not activated_at:
        return "N/A"
    try:
        activated_date = datetime.fromisoformat(activated_at.replace("Z", "+00:00"))
        activation_days = user.get("activation_days", TRIAL_DAYS)
        expiration = activated_date + timedelta(days=activation_days)
        remaining = expiration - datetime.now(timezone.utc)
        if remaining.total_seconds() <= 0:
            return "Expired"
        return f"{remaining.days}d {remaining.seconds // 3600}h"
    except Exception:
        return "N/A"


def compute_trial_status(user: dict) -> str:
    if not user.get("is_active", True):
        return "Inactive"
    if is_trial_expired(user):
        return "Trial Expired"
    if user.get("must_change_password", False):
        return "Pending"
    return "Active Trial"


def list_trial_users(api_url: str, admin_secret: str, show_active: bool = False, show_expired: bool = False):
    result = api_request(api_url, admin_secret, "/api/admin/users", "GET")

    if not result.get("success"):
        print(f"\n✗ Error: {result.get('error', 'Unknown error')}\n")
        return

    users = result.get("users", [])
    trial_users = [u for u in users if u.get("is_trial", False)]

    if not trial_users:
        print("\nNo trial users found.\n")
        return

    if show_active:
        trial_users = [u for u in trial_users if not is_trial_expired(u) and u.get("is_active", True)]
    elif show_expired:
        trial_users = [u for u in trial_users if is_trial_expired(u) or not u.get("is_active", True)]

    if not trial_users:
        print("\nNo trial users matching the filter.\n")
        return

    print(f"\n{'=' * 160}")
    print(
        f"{'ID':<22} {'Name':<18} {'Email':<28} {'Year(s)':<20} {'Days Left':<12} {'Status':<15} {'Paid':<6} {'Trial Start':<22}"
    )
    print(f"{'=' * 160}")

    for user in trial_users:
        years_list = user.get("years", ["3ème année"])
        years_str = (
            ", ".join(years_list)
            if isinstance(years_list, list)
            else str(years_list)
        )
        status = compute_trial_status(user)
        remaining = get_trial_remaining_days(user)
        paid = "Yes" if user.get("has_paid", False) else "No"
        trial_start = user.get("trial_started_at") or user.get("activated_at") or "N/A"
        if trial_start and trial_start != "N/A":
            try:
                dt = datetime.fromisoformat(trial_start.replace("Z", "+00:00"))
                trial_start = dt.strftime("%Y-%m-%d %H:%M")
            except Exception:
                pass

        print(
            f"{user['id']:<22} {user['name']:<18} {user['email']:<28} {years_str:<20} {remaining:<12} {status:<15} {paid:<6} {trial_start:<22}"
        )

    print(f"{'=' * 160}")
    print(f"Total trial users: {len(trial_users)}")
    print(f"API: {api_url}\n")


def get_trial_details(api_url: str, admin_secret: str, email: str):
    result = api_request(
        api_url, admin_secret, f"/api/admin/users?email={email}", "GET"
    )

    if not result.get("success"):
        print(f"\n✗ Error: {result.get('error', 'Unknown error')}\n")
        return

    user = result.get("user", {})

    if not user.get("is_trial", False):
        print(f"\n✗ User '{email}' is not a trial user.\n")
        return

    activated_at = user.get("activated_at")
    trial_started_at = user.get("trial_started_at")
    activation_days = user.get("activation_days", TRIAL_DAYS)
    expiration_str = "N/A"

    start_date = trial_started_at or activated_at
    if start_date:
        try:
            start_dt = datetime.fromisoformat(start_date.replace("Z", "+00:00"))
            expiration = start_dt + timedelta(days=activation_days)
            expiration_str = expiration.strftime("%Y-%m-%d %H:%M UTC")
        except Exception:
            pass

    status = compute_trial_status(user)

    print(f"\n{'=' * 55}")
    print(f"Trial User Details")
    print(f"{'=' * 55}")
    print(f"  ID:                {user.get('id', 'N/A')}")
    print(f"  Name:              {user.get('name', 'N/A')}")
    print(f"  Email:             {user.get('email', 'N/A')}")
    print(f"  Status:            {status}")
    print(f"  Is Active:         {'Yes' if user.get('is_active', True) else 'No'}")
    print(f"  Is Trial:          Yes")
    print(f"  Trial Started:     {trial_started_at or 'N/A'}")
    print(f"  Activated At:      {activated_at or 'N/A'}")
    print(f"  Trial Duration:    {activation_days} days")
    print(f"  Expires On:        {expiration_str}")
    print(f"  Remaining:         {get_trial_remaining_days(user)}")
    print(f"  Has Paid:          {'Yes' if user.get('has_paid', False) else 'No'}")
    print(f"  Year(s):           {', '.join(user.get('years', ['3ème année']))}")
    print(f"  Created:           {user.get('created_at', 'N/A')}")
    print(f"  Last Login:        {user.get('last_login', 'Never')}")
    print(f"{'=' * 55}\n")


def convert_trial_user(api_url: str, admin_secret: str, email: str, activation_days: int = None):
    result = api_request(
        api_url, admin_secret, f"/api/admin/users?email={email}", "GET"
    )

    if not result.get("success"):
        print(f"\n✗ Error: {result.get('error', 'Unknown error')}\n")
        return

    user = result.get("user", {})

    if not user.get("is_trial", False):
        print(f"\n✗ User '{email}' is not a trial user.\n")
        return

    payload = {
        "action": "update_user",
        "email": email,
        "is_trial": False,
        "trial_started_at": None,
    }

    if activation_days is not None:
        payload["activation_days"] = activation_days
        payload["has_paid"] = True
        payload["activated_at"] = datetime.now(timezone.utc).isoformat()
    else:
        payload["has_paid"] = True
        payload["activated_at"] = datetime.now(timezone.utc).isoformat()

    update_result = api_request(api_url, admin_secret, "/api/admin/users", "POST", payload)

    if update_result.get("success"):
        days_info = f" with {activation_days} days of access" if activation_days else ""
        print(f"\n✓ Trial user '{email}' converted to regular user{days_info}.")
        print(f"  The user now has full access as a paid member.\n")
    else:
        print(f"\n✗ Error: {update_result.get('error', 'Unknown error')}\n")


def extend_trial(api_url: str, admin_secret: str, email: str, extra_days: int):
    result = api_request(
        api_url, admin_secret, f"/api/admin/users?email={email}", "GET"
    )

    if not result.get("success"):
        print(f"\n✗ Error: {result.get('error', 'Unknown error')}\n")
        return

    user = result.get("user", {})

    if not user.get("is_trial", False):
        print(f"\n✗ User '{email}' is not a trial user.\n")
        return

    current_days = user.get("activation_days", TRIAL_DAYS)
    new_days = current_days + extra_days

    payload = {
        "action": "update_user",
        "email": email,
        "activation_days": new_days,
    }

    update_result = api_request(api_url, admin_secret, "/api/admin/users", "POST", payload)

    if update_result.get("success"):
        print(f"\n✓ Trial for '{email}' extended by {extra_days} days.")
        print(f"  Previous duration: {current_days} days")
        print(f"  New duration: {new_days} days\n")
    else:
        print(f"\n✗ Error: {update_result.get('error', 'Unknown error')}\n")


def deactivate_trial_user(api_url: str, admin_secret: str, email: str):
    result = api_request(
        api_url, admin_secret, f"/api/admin/users?email={email}", "GET"
    )

    if not result.get("success"):
        print(f"\n✗ Error: {result.get('error', 'Unknown error')}\n")
        return

    user = result.get("user", {})
    if not user.get("is_trial", False):
        print(f"\n✗ User '{email}' is not a trial user.\n")
        return

    payload = {
        "action": "set_active",
        "email": email,
        "is_active": False,
    }

    update_result = api_request(api_url, admin_secret, "/api/admin/users", "POST", payload)

    if update_result.get("success"):
        print(f"\n✓ Trial user '{email}' has been deactivated.\n")
    else:
        print(f"\n✗ Error: {update_result.get('error', 'Unknown error')}\n")


def activate_trial_user(api_url: str, admin_secret: str, email: str):
    result = api_request(
        api_url, admin_secret, f"/api/admin/users?email={email}", "GET"
    )

    if not result.get("success"):
        print(f"\n✗ Error: {result.get('error', 'Unknown error')}\n")
        return

    user = result.get("user", {})
    if not user.get("is_trial", False):
        print(f"\n✗ User '{email}' is not a trial user.\n")
        return

    payload = {
        "action": "set_active",
        "email": email,
        "is_active": True,
    }

    update_result = api_request(api_url, admin_secret, "/api/admin/users", "POST", payload)

    if update_result.get("success"):
        print(f"\n✓ Trial user '{email}' has been activated.\n")
    else:
        print(f"\n✗ Error: {update_result.get('error', 'Unknown error')}\n")


def delete_trial_user(api_url: str, admin_secret: str, email: str):
    result = api_request(
        api_url, admin_secret, f"/api/admin/users?email={email}", "GET"
    )

    if not result.get("success"):
        print(f"\n✗ Error: {result.get('error', 'Unknown error')}\n")
        return

    user = result.get("user", {})
    if not user.get("is_trial", False):
        print(f"\n✗ User '{email}' is not a trial user. Use manage_users.py to delete regular users.\n")
        return

    confirm = input(f"Are you sure you want to delete trial user '{email}'? (yes/no): ")
    if confirm.lower() != "yes":
        print("Cancelled.\n")
        return

    delete_result = api_request(
        api_url, admin_secret, f"/api/admin/users?email={email}", "DELETE"
    )

    if delete_result.get("success"):
        print(f"\n✓ Trial user '{email}' has been deleted.\n")
    else:
        print(f"\n✗ Error: {delete_result.get('error', 'Unknown error')}\n")


def show_trial_stats(api_url: str, admin_secret: str):
    result = api_request(api_url, admin_secret, "/api/admin/users", "GET")

    if not result.get("success"):
        print(f"\n✗ Error: {result.get('error', 'Unknown error')}\n")
        return

    users = result.get("users", [])
    trial_users = [u for u in users if u.get("is_trial", False)]

    active_trials = [u for u in trial_users if not is_trial_expired(u) and u.get("is_active", True)]
    expired_trials = [u for u in trial_users if is_trial_expired(u)]
    inactive_trials = [u for u in trial_users if not u.get("is_active", True)]
    converted_users = [u for u in users if not u.get("is_trial", False)]
    paid_users = [u for u in converted_users if u.get("has_paid", False)]

    print(f"\n{'=' * 55}")
    print(f"  Trial Users Statistics")
    print(f"{'=' * 55}")
    print(f"  Total users:           {len(users)}")
    print(f"  Regular users:         {len(converted_users)} (of which {len(paid_users)} paid)")
    print(f"  Trial users:           {len(trial_users)}")
    print(f"    - Active trials:     {len(active_trials)}")
    print(f"    - Expired trials:    {len(expired_trials)}")
    print(f"    - Deactivated:      {len(inactive_trials)}")
    print(f"{'=' * 55}\n")


def main():
    parser = argparse.ArgumentParser(
        description="LearnFMPA Trial Users Management Script - Separate from regular users",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=f"""
Environment Variables:
  API_URL      - API endpoint (current: {DEFAULT_API_URL})
  ADMIN_SECRET - Admin key (required for operations)

Trial Duration: {TRIAL_DAYS} days by default

Examples:
  python manage_trial_users.py list
  python manage_trial_users.py list --active
  python manage_trial_users.py list --expired
  python manage_trial_users.py details "john@example.com"
  python manage_trial_users.py convert "john@example.com"
  python manage_trial_users.py convert "john@example.com" -d 150
  python manage_trial_users.py extend "john@example.com" -d 3
  python manage_trial_users.py activate "john@example.com"
  python manage_trial_users.py deactivate "john@example.com"
  python manage_trial_users.py delete "john@example.com"
  python manage_trial_users.py stats
""",
    )

    parser.add_argument("--url", default=DEFAULT_API_URL, help="Override API URL")
    parser.add_argument(
        "--secret", default=DEFAULT_ADMIN_SECRET, help="Override admin secret"
    )

    subparsers = parser.add_subparsers(dest="command", help="Available commands")

    list_parser = subparsers.add_parser("list", help="List trial users")
    list_group = list_parser.add_mutually_exclusive_group()
    list_group.add_argument("--active", action="store_true", help="Show only active trials")
    list_group.add_argument("--expired", action="store_true", help="Show only expired trials")

    details_parser = subparsers.add_parser("details", help="Get trial user details")
    details_parser.add_argument("email", help="Trial user's email address")

    convert_parser = subparsers.add_parser("convert", help="Convert trial user to regular paid user")
    convert_parser.add_argument("email", help="Trial user's email address")
    convert_parser.add_argument(
        "-d", "--days", type=int, default=None,
        help="Activation days for the converted user (default: keep current)"
    )

    extend_parser = subparsers.add_parser("extend", help="Extend a trial by extra days")
    extend_parser.add_argument("email", help="Trial user's email address")
    extend_parser.add_argument(
        "-d", "--days", type=int, required=True,
        help="Number of extra days to add to the trial"
    )

    subparsers.add_parser("stats", help="Show trial users statistics")

    activate_parser = subparsers.add_parser("activate", help="Activate a trial user")
    activate_parser.add_argument("email", help="Trial user's email address")

    deactivate_parser = subparsers.add_parser("deactivate", help="Deactivate a trial user")
    deactivate_parser.add_argument("email", help="Trial user's email address")

    delete_parser = subparsers.add_parser("delete", help="Delete a trial user")
    delete_parser.add_argument("email", help="Trial user's email address")

    args = parser.parse_args()

    api_url = args.url
    admin_secret = args.secret

    if not args.command:
        parser.print_help()
        return

    print(f"\n📡 Connecting to: {api_url}")

    if args.command == "list":
        list_trial_users(api_url, admin_secret, show_active=args.active, show_expired=args.expired)
    elif args.command == "details":
        get_trial_details(api_url, admin_secret, args.email)
    elif args.command == "convert":
        convert_trial_user(api_url, admin_secret, args.email, args.days)
    elif args.command == "extend":
        extend_trial(api_url, admin_secret, args.email, args.days)
    elif args.command == "activate":
        activate_trial_user(api_url, admin_secret, args.email)
    elif args.command == "deactivate":
        deactivate_trial_user(api_url, admin_secret, args.email)
    elif args.command == "delete":
        delete_trial_user(api_url, admin_secret, args.email)
    elif args.command == "stats":
        show_trial_stats(api_url, admin_secret)


if __name__ == "__main__":
    main()