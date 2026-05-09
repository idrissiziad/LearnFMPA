#!/usr/bin/env python3
"""
LearnFMPA Reports Management Script

Manage question reports submitted by users via the report feature.

Usage:
  python manage_reports.py list [--module MODULE_ID] [--status pending|resolved|dismissed]
  python manage_reports.py details <module_id> <question_id> [--report REPORT_ID]
  python manage_reports.py resolve <module_id> <question_id> <report_id> [--note NOTE]
  python manage_reports.py dismiss <module_id> <question_id> <report_id> [--note NOTE]
  python manage_reports.py delete <module_id> [--question QUESTION_ID] [--report REPORT_ID]
  python manage_reports.py summary

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
from datetime import datetime

DEFAULT_API_URL = os.environ.get('API_URL', 'https://www.learnfmpa.com')
DEFAULT_ADMIN_SECRET = os.environ.get('ADMIN_SECRET', 'learnfmpa2024')

MODULE_NAMES = {
    1: 'Pharmacologie',
    2: 'Cardiologie',
    3: 'Anatomo-pathologie 1',
    4: 'Sémiologie 2',
    5: 'Radiologie',
    6: 'Biochimie clinique',
    7: 'Histologie Embryologie',
    8: 'Anatomie 2',
    9: 'Physiologie 1',
    10: 'Hématologie',
}


def api_request(api_url, admin_secret, endpoint, method='GET', data=None):
    url = f"{api_url}{endpoint}"
    headers = {'Content-Type': 'application/json'}

    if method == 'GET' and 'admin_secret' not in endpoint:
        separator = '&' if '?' in url else '?'
        url = f"{url}{separator}admin_secret={admin_secret}"

    req_data = None
    if data:
        data['admin_secret'] = admin_secret
        req_data = json.dumps(data).encode('utf-8')

    try:
        req = urllib.request.Request(url, data=req_data, headers=headers, method=method)
        with urllib.request.urlopen(req, timeout=30) as response:
            return json.loads(response.read().decode('utf-8'))
    except urllib.error.HTTPError as e:
        error_body = e.read().decode('utf-8')
        try:
            return json.loads(error_body)
        except Exception:
            return {'error': error_body}
    except urllib.error.URLError as e:
        return {'error': f'Cannot connect to {api_url}: {e}'}
    except Exception as e:
        return {'error': str(e)}


def format_datetime(iso_str):
    if not iso_str:
        return 'N/A'
    try:
        dt = datetime.fromisoformat(iso_str.replace('Z', '+00:00'))
        return dt.strftime('%Y-%m-%d %H:%M')
    except Exception:
        return iso_str


def status_icon(status):
    if status == 'pending':
        return '🟡'
    elif status == 'resolved':
        return '✅'
    elif status == 'dismissed':
        return '❌'
    return '❓'


def list_reports(args):
    api_url = args.url
    admin_secret = args.secret

    if args.module:
        result = api_request(api_url, admin_secret, f'/api/report?module_id={args.module}', 'GET')
        if not result.get('success'):
            print(f"\n✗ Error: {result.get('error', 'Unknown error')}\n")
            return

        reports_by_q = result.get('reports', {})
        module_name = MODULE_NAMES.get(args.module, f'Module {args.module}')
        total = sum(len(r_list) for r_list in reports_by_q.values())

        print(f"\n{'='*70}")
        print(f"  Reports for Module {args.module} — {module_name}")
        print(f"{'='*70}")

        if total == 0:
            print(f"\n  No reports found.\n")
            return

        filtered_total = 0
        for qid, report_list in sorted(reports_by_q.items(), key=lambda x: int(x[0]) if x[0].isdigit() else 0):
            for report in report_list:
                if args.status and report.get('status') != args.status:
                    continue
                filtered_total += 1
                icon = status_icon(report.get('status', 'pending'))
                print(f"\n  {icon} [{report.get('status', 'pending').upper()}] Question {qid}")
                print(f"    ID: {report.get('id')}")
                year = report.get('question_year', '')
                if year:
                    print(f"    Year: {year}")
                print(f"    From: {report.get('user_name', 'Unknown')} ({report.get('user_email', 'N/A')})")
                print(f"    Created: {format_datetime(report.get('created_at'))}")
                reason = report.get('reason', '')
                if len(reason) > 80:
                    reason = reason[:80] + '...'
                print(f"    Reason: {reason}")
                suggested_correct = report.get('suggested_correct', [])
                suggested_incorrect = report.get('suggested_incorrect', [])
                if suggested_correct:
                    labels = [chr(65 + idx) for idx in suggested_correct if isinstance(idx, int)]
                    print(f"    Suggested correct: {', '.join(labels)}")
                if suggested_incorrect:
                    labels = [chr(65 + idx) for idx in suggested_incorrect if isinstance(idx, int)]
                    print(f"    Suggested incorrect: {', '.join(labels)}")
                if report.get('status') != 'pending':
                    print(f"    Resolved: {format_datetime(report.get('resolved_at'))} by {report.get('resolved_by', 'N/A')}")
                    if report.get('resolution_note'):
                        print(f"    Note: {report.get('resolution_note')}")

        print(f"\n  Showing {filtered_total} report(s)")
        print(f"{'='*70}\n")

    else:
        result = api_request(api_url, admin_secret, '/api/report', 'GET')
        if not result.get('success'):
            print(f"\n✗ Error: {result.get('error', 'Unknown error')}\n")
            return

        all_reports = result.get('reports', [])
        if not all_reports:
            print(f"\n  No reports found across any module.\n")
            return

        print(f"\n{'='*70}")
        print(f"  LearnFMPA Reports Summary")
        print(f"{'='*70}")

        total_reports = 0
        total_pending = 0
        total_resolved = 0
        total_dismissed = 0

        for module_data in all_reports:
            mid = module_data['moduleId']
            module_name = MODULE_NAMES.get(mid, f'Module {mid}')
            reports_by_q = module_data['reports']
            count = sum(len(r_list) for r_list in reports_by_q.values())
            pending = sum(1 for r_list in reports_by_q.values() for r in r_list if r.get('status') == 'pending')
            resolved = sum(1 for r_list in reports_by_q.values() for r in r_list if r.get('status') == 'resolved')
            dismissed = sum(1 for r_list in reports_by_q.values() for r in r_list if r.get('status') == 'dismissed')

            total_reports += count
            total_pending += pending
            total_resolved += resolved
            total_dismissed += dismissed

            status_str = f"🟡 {pending} pending" if pending > 0 else "✅ All resolved"
            print(f"\n  Module {mid} — {module_name}: {count} report(s), {status_str}")
            if pending > 0:
                print(f"    Pending: {pending} | Resolved: {resolved} | Dismissed: {dismissed}")

            for qid, report_list in sorted(reports_by_q.items(), key=lambda x: int(x[0]) if x[0].isdigit() else 0):
                for report in report_list:
                    if args.status and report.get('status') != args.status:
                        continue
                    icon = status_icon(report.get('status', 'pending'))
                    reason = report.get('reason', '')
                    if len(reason) > 60:
                        reason = reason[:60] + '...'
                    print(f"    {icon} Q{qid}: {reason}")

        print(f"\n{'='*70}")
        print(f"  Total: {total_reports} reports (🟡 {total_pending} pending | ✅ {total_resolved} resolved | ❌ {total_dismissed} dismissed)")
        print(f"{'='*70}\n")


def show_details(args):
    api_url = args.url
    admin_secret = args.secret

    result = api_request(api_url, admin_secret, f'/api/report?module_id={args.module_id}', 'GET')
    if not result.get('success'):
        print(f"\n✗ Error: {result.get('error', 'Unknown error')}\n")
        return

    reports_by_q = result.get('reports', {})
    question_reports = reports_by_q.get(str(args.question_id), [])

    if not question_reports:
        print(f"\n  No reports found for question {args.question_id} in module {args.module_id}.\n")
        return

    module_name = MODULE_NAMES.get(args.module_id, f'Module {args.module_id}')
    print(f"\n{'='*70}")
    print(f"  Reports for Question {args.question_id} — Module {args.module_id} ({module_name})")
    print(f"{'='*70}")

    for report in question_reports:
        if args.report and report.get('id') != args.report:
            continue

        icon = status_icon(report.get('status', 'pending'))
        print(f"\n  {icon} Report: {report.get('id')}")
        print(f"  Status: {report.get('status', 'pending').upper()}")
        year = report.get('question_year', '')
        if year:
            print(f"  Year: {year}")
        print(f"  User: {report.get('user_name', 'Unknown')} ({report.get('user_email', 'N/A')})")
        print(f"  Created: {format_datetime(report.get('created_at'))}")

        if report.get('question_text'):
            qt = report.get('question_text', '')
            print(f"\n  Question text:")
            print(f"    {qt[:200]}{'...' if len(qt) > 200 else ''}")

        if report.get('original_options'):
            print(f"\n  Original options:")
            for i, opt in enumerate(report.get('original_options', [])):
                marker = '✓' if i in report.get('original_correct', []) else ' '
                print(f"    [{marker}] {chr(65+i)}. {opt}")

        suggested_correct = report.get('suggested_correct', [])
        suggested_incorrect = report.get('suggested_incorrect', [])
        if suggested_correct or suggested_incorrect:
            print(f"\n  Suggested corrections:")
            if suggested_correct:
                labels = [f"{chr(65 + idx)}" for idx in suggested_correct if isinstance(idx, int)]
                print(f"    Should be correct: {', '.join(labels)}")
            if suggested_incorrect:
                labels = [f"{chr(65 + idx)}" for idx in suggested_incorrect if isinstance(idx, int)]
                print(f"    Should be incorrect: {', '.join(labels)}")

        print(f"\n  Reason:")
        print(f"    {report.get('reason', 'No reason provided')}")

        if report.get('status') != 'pending':
            print(f"\n  Resolution:")
            print(f"    Resolved by: {report.get('resolved_by', 'N/A')}")
            print(f"    Resolved at: {format_datetime(report.get('resolved_at'))}")
            if report.get('resolution_note'):
                print(f"    Note: {report.get('resolution_note')}")

    print(f"\n{'='*70}\n")


def resolve_report(args):
    api_url = args.url
    admin_secret = args.secret

    data = {
        'module_id': args.module_id,
        'question_id': str(args.question_id),
        'report_id': args.report_id,
        'status': 'resolved',
    }
    if args.note:
        data['resolution_note'] = args.note

    result = api_request(api_url, admin_secret, '/api/report', 'PUT', data)
    if not result.get('success'):
        print(f"\n✗ Error: {result.get('error', 'Unknown error')}\n")
        return

    report = result.get('report', {})
    print(f"\n✓ Report {report.get('id')} marked as RESOLVED.")
    print(f"  Question {args.question_id} in Module {args.module_id}\n")


def dismiss_report(args):
    api_url = args.url
    admin_secret = args.secret

    data = {
        'module_id': args.module_id,
        'question_id': str(args.question_id),
        'report_id': args.report_id,
        'status': 'dismissed',
    }
    if args.note:
        data['resolution_note'] = args.note

    result = api_request(api_url, admin_secret, '/api/report', 'PUT', data)
    if not result.get('success'):
        print(f"\n✗ Error: {result.get('error', 'Unknown error')}\n")
        return

    report = result.get('report', {})
    print(f"\n✓ Report {report.get('id')} marked as DISMISSED.")
    print(f"  Question {args.question_id} in Module {args.module_id}\n")


def delete_reports(args):
    api_url = args.url
    admin_secret = args.secret

    if args.question_id and args.report_id:
        url = f'/api/report?module_id={args.module_id}&question_id={args.question_id}&report_id={args.report_id}'
        result = api_request(api_url, admin_secret, url, 'DELETE')
        if not result.get('success'):
            print(f"\n✗ Error: {result.get('error', 'Unknown error')}\n")
            return
        print(f"\n✓ Report {args.report_id} deleted from question {args.question_id} in module {args.module_id}.\n")
    elif args.question_id:
        url = f'/api/report?module_id={args.module_id}&question_id={args.question_id}'
        result = api_request(api_url, admin_secret, url, 'DELETE')
        if not result.get('success'):
            print(f"\n✗ Error: {result.get('error', 'Unknown error')}\n")
            return
        print(f"\n✓ All reports for question {args.question_id} in module {args.module_id} deleted.\n")
    else:
        confirm = input(f"⚠ Delete ALL reports for module {args.module_id}? Type 'yes' to confirm: ")
        if confirm.lower() != 'yes':
            print("  Cancelled.")
            return
        url = f'/api/report?module_id={args.module_id}'
        result = api_request(api_url, admin_secret, url, 'DELETE')
        if not result.get('success'):
            print(f"\n✗ Error: {result.get('error', 'Unknown error')}\n")
            return
        print(f"\n✓ All reports for module {args.module_id} deleted.\n")


def show_summary(args):
    api_url = args.url
    admin_secret = args.secret

    result = api_request(api_url, admin_secret, '/api/report', 'GET')
    if not result.get('success'):
        print(f"\n✗ Error: {result.get('error', 'Unknown error')}\n")
        return

    all_reports = result.get('reports', [])
    print(f"\n{'='*70}")
    print(f"  LearnFMPA Reports Dashboard")
    print(f"{'='*70}")

    if not all_reports:
        print(f"\n  No reports found.\n")
        print(f"{'='*70}\n")
        return

    total_pending = 0
    total_resolved = 0
    total_dismissed = 0

    for module_data in all_reports:
        mid = module_data['moduleId']
        module_name = MODULE_NAMES.get(mid, f'Module {mid}')
        reports_by_q = module_data['reports']

        pending = sum(1 for r_list in reports_by_q.values() for r in r_list if r.get('status') == 'pending')
        resolved = sum(1 for r_list in reports_by_q.values() for r in r_list if r.get('status') == 'resolved')
        dismissed = sum(1 for r_list in reports_by_q.values() for r in r_list if r.get('status') == 'dismissed')
        total = pending + resolved + dismissed

        total_pending += pending
        total_resolved += resolved
        total_dismissed += dismissed

        status_str = f"🟡 {pending} pending" if pending > 0 else "✅ All handled"
        print(f"\n  Module {mid} — {module_name}")
        print(f"    {total} total | {status_str}")
        print(f"    Pending: {pending} | Resolved: {resolved} | Dismissed: {dismissed}")

    grand_total = total_pending + total_resolved + total_dismissed
    print(f"\n{'='*70}")
    print(f"  Total: {grand_total} reports")
    print(f"  🟡 Pending: {total_pending} | ✅ Resolved: {total_resolved} | ❌ Dismissed: {total_dismissed}")
    print(f"{'='*70}\n")


def main():
    parser = argparse.ArgumentParser(
        description="LearnFMPA Reports Management Script",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=f"""
Environment Variables:
  API_URL      - API endpoint (current: {DEFAULT_API_URL})
  ADMIN_SECRET - Admin key (required for operations)

Examples:
  python manage_reports.py list
  python manage_reports.py list --module 1 --status pending
  python manage_reports.py details 1 5
  python manage_reports.py details 1 5 --report report_1234567890_abc123
  python manage_reports.py resolve 1 5 report_1234567890_abc123
  python manage_reports.py resolve 1 5 report_1234567890_abc123 --note "Fixed answer key"
  python manage_reports.py dismiss 1 5 report_1234567890_abc123 --note "Duplicate report"
  python manage_reports.py delete 1 --question 5 --report report_1234567890_abc123
  python manage_reports.py delete 1 --question 5
  python manage_reports.py delete 1
  python manage_reports.py summary
"""
    )

    parser.add_argument('--url', default=DEFAULT_API_URL, help='Override API URL')
    parser.add_argument('--secret', default=DEFAULT_ADMIN_SECRET, help='Override admin secret')

    subparsers = parser.add_subparsers(dest="command", help="Available commands")

    list_parser = subparsers.add_parser("list", help="List reports")
    list_parser.add_argument("--module", type=int, default=None, help="Filter by module ID")
    list_parser.add_argument("--status", choices=['pending', 'resolved', 'dismissed'], default=None, help="Filter by status")

    details_parser = subparsers.add_parser("details", help="Show report details for a specific question")
    details_parser.add_argument("module_id", type=int, help="Module ID")
    details_parser.add_argument("question_id", help="Question ID")
    details_parser.add_argument("--report", default=None, help="Specific report ID")

    resolve_parser = subparsers.add_parser("resolve", help="Mark a report as resolved")
    resolve_parser.add_argument("module_id", type=int, help="Module ID")
    resolve_parser.add_argument("question_id", help="Question ID")
    resolve_parser.add_argument("report_id", help="Report ID")
    resolve_parser.add_argument("--note", default=None, help="Resolution note")

    dismiss_parser = subparsers.add_parser("dismiss", help="Mark a report as dismissed")
    dismiss_parser.add_argument("module_id", type=int, help="Module ID")
    dismiss_parser.add_argument("question_id", help="Question ID")
    dismiss_parser.add_argument("report_id", help="Report ID")
    dismiss_parser.add_argument("--note", default=None, help="Dismissal note")

    delete_parser = subparsers.add_parser("delete", help="Delete reports")
    delete_parser.add_argument("module_id", type=int, help="Module ID")
    delete_parser.add_argument("--question", default=None, help="Question ID (deletes all reports for question if no --report specified)")
    delete_parser.add_argument("--report", default=None, help="Specific report ID to delete")

    subparsers.add_parser("summary", help="Show reports dashboard summary")

    args = parser.parse_args()

    if not args.command:
        parser.print_help()
        return

    if args.command == "list":
        list_reports(args)
    elif args.command == "details":
        show_details(args)
    elif args.command == "resolve":
        resolve_report(args)
    elif args.command == "dismiss":
        dismiss_report(args)
    elif args.command == "delete":
        delete_reports(args)
    elif args.command == "summary":
        show_summary(args)


if __name__ == "__main__":
    main()