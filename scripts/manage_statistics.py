#!/usr/bin/env python3
"""
LearnFMPA Statistics Management Script

Manage question answer statistics via the Vercel deployment API.

Usage:
  python manage_statistics.py stats <module_id> [question_id]
  python manage_statistics.py top <module_id> [--sort worst|best|most-answered]
  python manage_statistics.py reset <module_id> [--question <question_id>]
  python manage_statistics.py summary

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

DEFAULT_API_URL = os.environ.get('API_URL', 'https://www.learnfmpa.com')
DEFAULT_ADMIN_SECRET = os.environ.get('ADMIN_SECRET', 'learnfmpa2024')


def api_request(api_url: str, admin_secret: str, endpoint: str, method: str = 'GET', data: dict = None) -> dict:
    url = f"{api_url}{endpoint}"
    headers = {'Content-Type': 'application/json'}

    if method == 'GET' and 'admin_secret' not in endpoint:
        url = f"{url}{'?' if '?' not in url else '&'}admin_secret={admin_secret}"

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


def show_stats(api_url: str, admin_secret: str, module_id: int, question_id: str = None):
    endpoint = f'/api/statistics?module_id={module_id}'
    if question_id:
        endpoint += f'&question_id={question_id}'

    result = api_request(api_url, admin_secret, endpoint, 'GET')

    if not result.get('success'):
        print(f"\n✗ Error: {result.get('error', 'Unknown error')}\n")
        return

    stats = result.get('statistics')

    if stats is None:
        print(f"\n  No statistics found.\n")
        return

    if question_id:
        _print_question_stats(question_id, stats)
    else:
        print(f"\n{'='*70}")
        print(f"  Statistics for Module {module_id}")
        print(f"{'='*70}")
        total_questions = len(stats)
        total_answers = sum(s.get('total_answers', 0) for s in stats.values())
        total_correct = sum(s.get('correct_answers', 0) for s in stats.values())
        overall_rate = round((total_correct / total_answers) * 100) if total_answers > 0 else 0
        print(f"  Total questions with data: {total_questions}")
        print(f"  Total answers recorded:    {total_answers}")
        print(f"  Overall success rate:      {overall_rate}%")
        print(f"{'='*70}\n")

        for qid, qstats in sorted(stats.items(), key=lambda x: int(x[0]) if x[0].isdigit() else 0):
            _print_question_stats(qid, qstats)


def _print_question_stats(question_id: str, stats: dict):
    total = stats.get('total_answers', 0)
    correct = stats.get('correct_answers', 0)
    option_counts = stats.get('option_counts', {})
    rate = round((correct / total) * 100) if total > 0 else 0

    print(f"\n  Question {question_id}:")
    print(f"    Answers: {total} | Correct: {correct} | Success rate: {rate}%")
    if option_counts:
        sorted_options = sorted(option_counts.items(), key=lambda x: int(x[0]) if x[0].isdigit() else 0)
        for opt, count in sorted_options:
            pct = round((count / total) * 100) if total > 0 else 0
            bar = '█' * int(pct / 5) + '░' * (20 - int(pct / 5))
            print(f"    Option {chr(65 + int(opt))}: {bar} {pct}% ({count})")


def show_top(api_url: str, admin_secret: str, module_id: int, sort_by: str = 'worst'):
    endpoint = f'/api/statistics?module_id={module_id}'
    result = api_request(api_url, admin_secret, endpoint, 'GET')

    if not result.get('success'):
        print(f"\n✗ Error: {result.get('error', 'Unknown error')}\n")
        return

    stats = result.get('statistics', {})
    if not stats:
        print(f"\n  No statistics found for module {module_id}.\n")
        return

    question_rates = []
    for qid, qstats in stats.items():
        total = qstats.get('total_answers', 0)
        correct = qstats.get('correct_answers', 0)
        rate = round((correct / total) * 100) if total > 0 else 0
        question_rates.append((qid, rate, total, correct))

    if sort_by == 'worst':
        question_rates.sort(key=lambda x: x[1])
        title = "Worst"
    elif sort_by == 'best':
        question_rates.sort(key=lambda x: x[1], reverse=True)
        title = "Best"
    elif sort_by == 'most-answered':
        question_rates.sort(key=lambda x: x[2], reverse=True)
        title = "Most Answered"
    else:
        question_rates.sort(key=lambda x: x[1])
        title = "Worst"

    print(f"\n{'='*70}")
    print(f"  {title} Questions - Module {module_id}")
    print(f"{'='*70}")
    print(f"  {'Question':<15} {'Rate':>8} {'Answers':>10} {'Correct':>10}")
    print(f"  {'-'*50}")

    for qid, rate, total, correct in question_rates[:20]:
        print(f"  {qid:<15} {rate:>6}% {total:>10} {correct:>10}")

    print(f"{'='*70}\n")


def reset_stats(api_url: str, admin_secret: str, module_id: int, question_id: str = None):
    if question_id:
        endpoint = f'/api/statistics?module_id={module_id}'
        result = api_request(api_url, admin_secret, endpoint, 'GET')
        if not result.get('success'):
            print(f"\n✗ Error: {result.get('error', 'Unknown error')}\n")
            return

        stats = result.get('statistics', {})
        if question_id in stats:
            del stats[question_id]
            data = {'module_id': module_id, 'stats': stats}
            update_result = api_request(api_url, admin_secret, '/api/statistics', 'PUT', data)
            if update_result.get('success'):
                print(f"\n✓ Statistics for question {question_id} reset.\n")
            else:
                print(f"\n✗ Error: {update_result.get('error', 'Unknown error')}\n")
        else:
            print(f"\n  Question {question_id} not found in statistics.\n")
    else:
        data = {'module_id': module_id}
        result = api_request(api_url, admin_secret, '/api/statistics', 'DELETE', data)
        if result.get('success'):
            print(f"\n✓ All statistics for module {module_id} reset.\n")
        else:
            print(f"\n✗ Error: {result.get('error', 'Unknown error')}\n")


def show_summary(api_url: str, admin_secret: str):
    modules = [1, 2]
    print(f"\n{'='*70}")
    print(f"  LearnFMPA Statistics Summary")
    print(f"{'='*70}")

    for module_id in modules:
        endpoint = f'/api/statistics?module_id={module_id}'
        result = api_request(api_url, admin_secret, endpoint, 'GET')
        if result.get('success'):
            stats = result.get('statistics', {})
            total_answers = sum(s.get('total_answers', 0) for s in stats.values()) if stats else 0
            total_correct = sum(s.get('correct_answers', 0) for s in stats.values()) if stats else 0
            rate = round((total_correct / total_answers) * 100) if total_answers > 0 else 0
            print(f"  Module {module_id}: {len(stats)} questions | {total_answers} answers | {rate}% success")
        else:
            print(f"  Module {module_id}: Error loading stats")

    print(f"{'='*70}\n")


def main():
    parser = argparse.ArgumentParser(
        description="LearnFMPA Statistics Management Script",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=f"""
Environment Variables:
  API_URL      - API endpoint (current: {DEFAULT_API_URL})
  ADMIN_SECRET - Admin key (required for operations)

Examples:
  python manage_statistics.py stats 1
  python manage_statistics.py stats 1 5
  python manage_statistics.py top 1 --sort worst
  python manage_statistics.py top 1 --sort best
  python manage_statistics.py top 1 --sort most-answered
  python manage_statistics.py reset 1
  python manage_statistics.py reset 1 --question 5
  python manage_statistics.py summary
"""
    )

    parser.add_argument('--url', default=DEFAULT_API_URL, help='Override API URL')
    parser.add_argument('--secret', default=DEFAULT_ADMIN_SECRET, help='Override admin secret')

    subparsers = parser.add_subparsers(dest="command", help="Available commands")

    stats_parser = subparsers.add_parser("stats", help="Show statistics for a module or specific question")
    stats_parser.add_argument("module_id", type=int, help="Module ID")
    stats_parser.add_argument("question_id", nargs='?', default=None, help="Specific question ID")

    top_parser = subparsers.add_parser("top", help="Show top/worst questions by success rate")
    top_parser.add_argument("module_id", type=int, help="Module ID")
    top_parser.add_argument("--sort", choices=['worst', 'best', 'most-answered'], default='worst', help="Sort order")

    reset_parser = subparsers.add_parser("reset", help="Reset statistics for a module or specific question")
    reset_parser.add_argument("module_id", type=int, help="Module ID")
    reset_parser.add_argument("--question", default=None, help="Specific question ID to reset")

    subparsers.add_parser("summary", help="Show summary of statistics across all modules")

    args = parser.parse_args()

    api_url = args.url
    admin_secret = args.secret

    if not args.command:
        parser.print_help()
        return

    print(f"\n📡 Connecting to: {api_url}")

    if args.command == "stats":
        show_stats(api_url, admin_secret, args.module_id, args.question_id)
    elif args.command == "top":
        show_top(api_url, admin_secret, args.module_id, args.sort)
    elif args.command == "reset":
        reset_stats(api_url, admin_secret, args.module_id, args.question)
    elif args.command == "summary":
        show_summary(api_url, admin_secret)


if __name__ == "__main__":
    main()
