#!/usr/bin/env python3
"""
LearnFMPA Signup Toggle Script

Toggles the signup page between open (functional form) and closed 
(registrations closed message) states. This controls whether new users 
can self-register for a free trial.

Usage:
  python toggle_signup.py on
  python toggle_signup.py off
  python toggle_signup.py status

Set environment variables:
  API_URL      - Your Vercel deployment URL (default: https://www.learnfmpa.com)
  ADMIN_SECRET - Admin secret key (default: learnfmpa2024)
"""

import json
import os
import argparse
import urllib.request
import urllib.error

DEFAULT_API_URL = os.environ.get("API_URL", "https://www.learnfmpa.com")
DEFAULT_ADMIN_SECRET = os.environ.get("ADMIN_SECRET", "learnfmpa2024")


def toggle_signup(api_url: str, admin_secret: str, enabled: bool):
    data = {
        "admin_secret": admin_secret,
        "signup_open": enabled,
    }

    url = f"{api_url}/api/admin/signup-toggle"
    headers = {"Content-Type": "application/json"}
    req_data = json.dumps(data).encode("utf-8")

    try:
        req = urllib.request.Request(url, data=req_data, headers=headers, method="POST")
        with urllib.request.urlopen(req, timeout=30) as response:
            result = json.loads(response.read().decode("utf-8"))

        if result.get("success"):
            state = "OPEN" if enabled else "CLOSED"
            label = "open" if enabled else "closed"
            print(f"\n✓ Sign-up page is now {state}")
            print(f"  Users {'can' if enabled else 'cannot'} register for a free trial.")
            print(f"  The /signup page {'shows the registration form' if enabled else 'shows the registrations closed message'}.\n")
        else:
            print(f"\n✗ Error: {result.get('error', 'Unknown error')}\n")

    except urllib.error.HTTPError as e:
        error_body = e.read().decode("utf-8")
        try:
            result = json.loads(error_body)
            print(f"\n✗ Error: {result.get('error', 'HTTP error')}\n")
        except Exception:
            print(f"\n✗ HTTP Error {e.code}: {error_body}\n")
    except urllib.error.URLError as e:
        print(f"\n✗ Cannot connect to {api_url}: {e}\n")
    except Exception as e:
        print(f"\n✗ Error: {e}\n")


def check_status(api_url: str, admin_secret: str):
    url = f"{api_url}/api/admin/signup-toggle?admin_secret={admin_secret}"
    headers = {"Content-Type": "application/json"}

    try:
        req = urllib.request.Request(url, headers=headers, method="GET")
        with urllib.request.urlopen(req, timeout=30) as response:
            result = json.loads(response.read().decode("utf-8"))

        if result.get("success"):
            is_open = result.get("signup_open", False)
            state = "OPEN" if is_open else "CLOSED"
            print(f"\n  Sign-up status: {state}")
            if is_open:
                print("  Users can register for a 7-day free trial.")
                print("  The /signup page shows the registration form.\n")
            else:
                print("  Users cannot register.")
                print("  The /signup page shows the registrations closed message.\n")
        else:
            print(f"\n✗ Error: {result.get('error', 'Unknown error')}\n")

    except urllib.error.HTTPError as e:
        error_body = e.read().decode("utf-8")
        try:
            result = json.loads(error_body)
            print(f"\n✗ Error: {result.get('error', 'HTTP error')}\n")
        except Exception:
            print(f"\n✗ HTTP Error {e.code}: {error_body}\n")
    except urllib.error.URLError as e:
        print(f"\n✗ Cannot connect to {api_url}: {e}\n")
    except Exception as e:
        print(f"\n✗ Error: {e}\n")


def main():
    parser = argparse.ArgumentParser(
        description="LearnFMPA Signup Toggle - Enable or disable the signup page",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=f"""
Environment Variables:
  API_URL      - API endpoint (current: {DEFAULT_API_URL})
  ADMIN_SECRET - Admin key (required)

What it does:
  'on'    - Opens the signup page. Users can self-register for a 7-day free trial.
  'off'   - Closes the signup page. Shows "registrations closed" message instead.
  'status' - Shows whether signup is currently open or closed.

Examples:
  python toggle_signup.py on       # Enable signups
  python toggle_signup.py off      # Disable signups  
  python toggle_signup.py status   # Check current state
""",
    )

    parser.add_argument("--url", default=DEFAULT_API_URL, help="Override API URL")
    parser.add_argument(
        "--secret", default=DEFAULT_ADMIN_SECRET, help="Override admin secret"
    )

    parser.add_argument(
        "action",
        choices=["on", "off", "status"],
        help="Action: 'on' to open signup, 'off' to close, 'status' to check",
    )

    args = parser.parse_args()

    api_url = args.url
    admin_secret = args.secret

    if args.action == "on":
        print(f"\n📡 Enabling signup on: {api_url}")
        toggle_signup(api_url, admin_secret, True)
    elif args.action == "off":
        print(f"\n📡 Disabling signup on: {api_url}")
        toggle_signup(api_url, admin_secret, False)
    elif args.action == "status":
        print(f"\n📡 Checking signup status on: {api_url}")
        check_status(api_url, admin_secret)


if __name__ == "__main__":
    main()