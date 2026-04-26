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
import webbrowser
from datetime import datetime, timedelta, timezone


EMAILS_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "emails")
os.makedirs(EMAILS_DIR, exist_ok=True)

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


def _esc(text):
    return str(text).replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;").replace('"', "&quot;")


def generate_email_html(*, email_type, user_name, email, temp_password, sub_display, login_url, api_url, plan_details=None, years_str=None, extra_lines=None):
    accent = "#0d4f3c"
    accent_light = "#e8f5f0"
    accent_dark = "#093d2e"
    gold = "#92400e"
    gold_light = "#fef3c7"
    blue = "#1e40af"
    blue_light = "#dbeafe"

    if email_type == "welcome":
        title = "Bienvenue sur LearnFMPA !"
        subtitle = "Votre compte a &#233;t&#233; cr&#233;&#233; avec succ&#232;s"
        icon = "&#127891;"
        icon_bg = accent
    elif email_type == "activation":
        title = "Votre compte LearnFMPA est activ&#233; !"
        subtitle = "Vous pouvez d&#233;sormais vous connecter"
        icon = "&#9989;"
        icon_bg = accent
    elif email_type == "reset":
        title = "R&#233;initialisation de votre mot de passe"
        subtitle = "Un nouveau mot de passe temporaire a &#233;t&#233; g&#233;n&#233;r&#233;"
        icon = "&#128274;"
        icon_bg = gold
    else:
        title = "LearnFMPA"
        subtitle = ""
        icon = "&#127891;"
        icon_bg = accent

    is_paid = sub_display and "PAID" in sub_display.upper()
    is_trial = sub_display and "TRIAL" in sub_display.upper()

    if is_paid:
        badge_bg = gold
        badge_text = "ACC&#200;S COMPLET"
        plan_color = gold
        plan_bg = gold_light
    elif is_trial:
        badge_bg = blue
        badge_text = "ESSAI PREMIUM"
        plan_color = blue
        plan_bg = blue_light
    else:
        badge_bg = accent
        badge_text = "GRATUIT"
        plan_color = accent
        plan_bg = accent_light

    plan_section = ""
    if plan_details:
        plan_section = f"""
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 20px 0;">
        <tr>
          <td style="background:{plan_bg};border-left:4px solid {plan_color};padding:16px 20px;border-radius:0 8px 8px 0;">
            <table cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td><span style="display:inline-block;background:{badge_bg};color:#ffffff;font-size:11px;font-weight:700;letter-spacing:1px;padding:3px 10px;border-radius:4px;text-transform:uppercase;">{badge_text}</span></td>
              </tr>
              <tr>
                <td style="padding-top:10px;color:#374151;font-size:15px;line-height:1.5;">{_esc(plan_details)}</td>
              </tr>
            </table>
          </td>
        </tr>
      </table>"""

    years_section = ""
    if years_str:
        years_section = f"""
      <tr>
        <td style="padding:8px 16px;color:#6b7280;font-size:14px;width:35%;vertical-align:top;">Ann&#233;e(s)</td>
        <td style="padding:8px 16px;color:#1f2937;font-size:14px;font-weight:600;width:65%;">{_esc(years_str)}</td>
      </tr>"""

    extra_section = ""
    if extra_lines:
        rows = ""
        for line in extra_lines:
            rows += f"""
      <tr>
        <td colspan="2" style="padding:8px 16px;color:#374151;font-size:14px;line-height:1.6;">{line}</td>
      </tr>"""
        extra_section = f'<table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:12px 0 0 0;">{rows}</table>'

    html = f"""<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>{title}</title>
<!--[if mso]><noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript><![endif]-->
<style type="text/css">
  body{{margin:0;padding:0;background:#f3f4f6;-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%}}
  a{{text-decoration:none}}
  @media only screen and (max-width:600px){{
    .card{{padding:24px 20px !important}}
    .hero-title{{font-size:22px !important}}
  }}
</style>
</head>
<body style="margin:0;padding:0;background:#f3f4f6;">
<center style="width:100%;background:#f3f4f6;padding:0;margin:0;">

  <!-- Preheader (hidden preview text) -->
  <div style="display:none;font-size:1px;color:#f3f4f6;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;">
    {subtitle} &#847; &#847; &#847; &#847; &#847; &#847; &#847; &#847; &#847; &#847; &#847; &#847; &#847; &#847; &#847; &#847;
  </div>

  <!-- Top accent line -->
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:{accent};">
    <tr><td style="font-size:3px;line-height:3px;height:3px;">&nbsp;</td></tr>
  </table>

  <!-- Header -->
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:{accent};">
    <tr>
      <td align="center" style="padding:36px 20px 36px 20px;">
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;">
          <tr>
            <td align="center">
              <table cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="background:rgba(255,255,255,0.15);width:64px;height:64px;border-radius:16px;text-align:center;vertical-align:middle;">
                    <span style="font-size:32px;line-height:64px;">{icon}</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding-top:20px;">
              <h1 style="margin:0;font-family:'Helvetica Neue',Arial,sans-serif;color:#ffffff;font-size:26px;font-weight:700;letter-spacing:-0.5px;line-height:1.3;">
                LearnFMPA
              </h1>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding-top:6px;">
              <span style="font-family:'Helvetica Neue',Arial,sans-serif;color:rgba(255,255,255,0.8);font-size:14px;font-weight:400;letter-spacing:0.5px;">
                R&#233;visez efficacement les annales de m&#233;decine
              </span>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>

  <!-- Decorative wave -->
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:{accent};">
    <tr>
      <td align="center" style="padding:0;margin:0;">
        <div style="max-width:600px;margin:0 auto;">
          <svg viewBox="0 0 600 30" xmlns="http://www.w3.org/2000/svg" style="display:block;width:100%;height:auto;">
            <path d="M0,0 L0,10 Q150,30 300,20 Q450,10 600,25 L600,0 Z" fill="{accent}"/>
            <path d="M0,12 Q150,35 300,22 Q450,12 600,30 L600,30 L0,30 Z" fill="#f3f4f6"/>
          </svg>
        </div>
      </td>
    </tr>
  </table>

  <!-- Main Card -->
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f3f4f6;">
    <tr>
      <td align="center" style="padding:0 20px 40px 20px;">
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;background:#ffffff;border-radius:16px;box-shadow:0 4px 24px rgba(0,0,0,0.08);overflow:hidden;" class="card">
          <tr>
            <td style="padding:40px 40px 32px 40px;" class="card">

              <!-- Greeting -->
              <p style="margin:0 0 8px 0;font-family:'Helvetica Neue',Arial,sans-serif;font-size:24px;font-weight:700;color:#1f2937;line-height:1.3;">
                Bonjour {_esc(user_name)} &#x1F44B;
              </p>
              <p style="margin:0 0 28px 0;font-family:'Helvetica Neue',Arial,sans-serif;font-size:15px;color:#6b7280;line-height:1.6;">
                {subtitle}
              </p>

              <!-- Plan info -->
              {plan_section}

              <!-- Credentials box -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden;">
                <tr>
                  <td style="padding:20px 24px;">
                    <table width="100%" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td colspan="2" style="padding:4px 0 14px 0;font-family:'Helvetica Neue',Arial,sans-serif;font-size:12px;font-weight:700;color:{accent};letter-spacing:1.5px;text-transform:uppercase;">
                          Vos identifiants
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:10px 16px;color:#6b7280;font-size:14px;width:35%;vertical-align:top;border-top:1px solid #e5e7eb;">Email</td>
                        <td style="padding:10px 16px;color:#1f2937;font-size:14px;font-weight:600;width:65%;border-top:1px solid #e5e7eb;word-break:break-all;">{_esc(email)}</td>
                      </tr>
                      <tr>
                        <td style="padding:10px 16px;color:#6b7280;font-size:14px;width:35%;vertical-align:top;border-top:1px solid #e5e7eb;">Mot de passe</td>
                        <td style="padding:10px 16px;color:#1f2937;font-size:14px;font-weight:600;width:65%;border-top:1px solid #e5e7eb;font-family:'Courier New',Consolas,monospace;background:#fff;border-radius:4px;">{_esc(temp_password)}</td>
                      </tr>
                      {years_section}
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Extra content -->
              {extra_section}

              <!-- Warning box -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#fffbeb;border:1px solid #fcd34d;border-radius:8px;margin:24px 0 0 0;">
                <tr>
                  <td style="padding:14px 18px;">
                    <span style="font-size:14px;line-height:1.5;">&#9888;&#65039;</span>
                    <span style="font-family:'Helvetica Neue',Arial,sans-serif;font-size:13px;color:#92400e;line-height:1.6;padding-left:4px;">
                      <strong>Important :</strong> Vous devez changer ce mot de passe lors de votre premi&#232;re connexion.
                    </span>
                  </td>
                </tr>
              </table>

              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:32px 0 0 0;">
                <tr>
                  <td align="center">
                    <a href="{_esc(login_url)}" target="_blank" style="display:inline-block;background:{accent};color:#ffffff;font-family:'Helvetica Neue',Arial,sans-serif;font-size:16px;font-weight:700;padding:14px 40px;border-radius:10px;text-decoration:none;mso-padding-alt:0;text-align:center;">
                      <!--[if mso]><i style="mso-font-width:300%;mso-text-raise:21pt" hidden>&nbsp;</i><![endif]-->
                      <span style="mso-text-raise:10pt;">Se connecter &rarr;</span>
                      <!--[if mso]><i style="mso-font-width:300%;" hidden>&nbsp;</i><![endif]-->
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Fallback link -->
              <p style="margin:16px 0 0 0;text-align:center;font-family:'Helvetica Neue',Arial,sans-serif;font-size:13px;color:#9ca3af;line-height:1.5;">
                Si le bouton ne fonctionne pas, copiez ce lien :<br>
                <a href="{_esc(login_url)}" style="color:{accent};word-break:break-all;">{_esc(login_url)}</a>
              </p>

            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>

  <!-- Features section -->
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f3f4f6;">
    <tr>
      <td align="center" style="padding:0 20px 40px 20px;">
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;">
          <tr>
            <td width="33%" align="center" style="padding:0 8px;vertical-align:top;">
              <table cellpadding="0" cellspacing="0" border="0" style="background:#ffffff;border-radius:12px;width:100%;box-shadow:0 2px 8px rgba(0,0,0,0.04);">
                <tr>
                  <td align="center" style="padding:20px 12px;">
                    <div style="font-size:28px;line-height:1;margin-bottom:8px;">&#128218;</div>
                    <div style="font-family:'Helvetica Neue',Arial,sans-serif;font-size:12px;font-weight:700;color:{accent};letter-spacing:0.5px;text-transform:uppercase;margin-bottom:4px;">Annales</div>
                    <div style="font-family:'Helvetica Neue',Arial,sans-serif;font-size:11px;color:#6b7280;line-height:1.4;">Des milliers de questions corrig&#233;es</div>
                  </td>
                </tr>
              </table>
            </td>
            <td width="33%" align="center" style="padding:0 8px;vertical-align:top;">
              <table cellpadding="0" cellspacing="0" border="0" style="background:#ffffff;border-radius:12px;width:100%;box-shadow:0 2px 8px rgba(0,0,0,0.04);">
                <tr>
                  <td align="center" style="padding:20px 12px;">
                    <div style="font-size:28px;line-height:1;margin-bottom:8px;">&#128200;</div>
                    <div style="font-family:'Helvetica Neue',Arial,sans-serif;font-size:12px;font-weight:700;color:{accent};letter-spacing:0.5px;text-transform:uppercase;margin-bottom:4px;">Progression</div>
                    <div style="font-family:'Helvetica Neue',Arial,sans-serif;font-size:11px;color:#6b7280;line-height:1.4;">Suivez votre avancement</div>
                  </td>
                </tr>
              </table>
            </td>
            <td width="33%" align="center" style="padding:0 8px;vertical-align:top;">
              <table cellpadding="0" cellspacing="0" border="0" style="background:#ffffff;border-radius:12px;width:100%;box-shadow:0 2px 8px rgba(0,0,0,0.04);">
                <tr>
                  <td align="center" style="padding:20px 12px;">
                    <div style="font-size:28px;line-height:1;margin-bottom:8px;">&#127891;</div>
                    <div style="font-family:'Helvetica Neue',Arial,sans-serif;font-size:12px;font-weight:700;color:{accent};letter-spacing:0.5px;text-transform:uppercase;margin-bottom:4px;">Explications</div>
                    <div style="font-family:'Helvetica Neue',Arial,sans-serif;font-size:11px;color:#6b7280;line-height:1.4;">Corrig&#233;s d&#233;taill&#233;s par experts</div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>

  <!-- Footer -->
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#1f2937;">
    <tr>
      <td align="center" style="padding:32px 20px;">
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;">
          <tr>
            <td align="center">
              <p style="margin:0 0 4px 0;font-family:'Helvetica Neue',Arial,sans-serif;font-size:15px;font-weight:700;color:#ffffff;letter-spacing:0.5px;">
                LearnFMPA
              </p>
              <p style="margin:0 0 16px 0;font-family:'Helvetica Neue',Arial,sans-serif;font-size:12px;color:#9ca3af;">
                R&#233;visez efficacement les annales de m&#233;decine au Maroc
              </p>
              <table cellpadding="0" cellspacing="0" border="0" style="margin:0 auto;">
                <tr>
                  <td style="padding:0 12px;">
                    <a href="{_esc(login_url)}" style="font-family:'Helvetica Neue',Arial,sans-serif;font-size:13px;color:#34d399;text-decoration:none;font-weight:600;">Se connecter</a>
                  </td>
                  <td style="color:#4b5563;font-size:13px;">|</td>
                  <td style="padding:0 12px;">
                    <a href="{_esc(api_url)}/contact" style="font-family:'Helvetica Neue',Arial,sans-serif;font-size:13px;color:#34d399;text-decoration:none;font-weight:600;">Contact</a>
                  </td>
                  <td style="color:#4b5563;font-size:13px;">|</td>
                  <td style="padding:0 12px;">
                    <a href="{_esc(api_url)}/faq" style="font-family:'Helvetica Neue',Arial,sans-serif;font-size:13px;color:#34d399;text-decoration:none;font-weight:600;">FAQ</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding-top:20px;border-top:1px solid #374151;">
              <p style="margin:0;font-family:'Helvetica Neue',Arial,sans-serif;font-size:11px;color:#6b7280;line-height:1.6;">
                Ce message a &#233;t&#233; envoy&#233; &#224; {_esc(email)}.<br>
                Si vous n'&#234;tes pas &#224; l'origine de cette demande, ignorez cet email.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>

  <!-- Bottom accent line -->
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:{accent};">
    <tr><td style="font-size:3px;line-height:3px;height:3px;">&nbsp;</td></tr>
  </table>

</center>
</body>
</html>"""
    return html


def save_and_open_email(html_content, filename):
    filepath = os.path.join(EMAILS_DIR, filename)
    with open(filepath, "w", encoding="utf-8") as f:
        f.write(html_content)
    return filepath


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
        years_str = ", ".join(years) if years else "3\u00e8me ann\u00e9e"
        login_url = f"{api_url}/login"

        if sub == "paid":
            plan_details = "Acc\u00e8s complet et illimit\u00e9 \u2014 questions, explications et suivi de progression."
        else:
            plan_details = f"Essai Premium de {trial_days} jours, puis acc\u00e8s gratuit (10 questions/jour)."

        subject = "Bienvenue sur LearnFMPA \u2014 Vos identifiants de connexion"
        body = (
            f"Bonjour {name},\n\n"
            f"Votre compte LearnFMPA a \u00e9t\u00e9 cr\u00e9\u00e9 avec succ\u00e8s !\n\n"
            f"Voici vos identifiants de connexion :\n\n"
            f"  \u2022 Email : {email}\n"
            f"  \u2022 Mot de passe temporaire : {temp_password}\n"
            f"  \u2022 Ann\u00e9e(s) : {years_str}\n"
            f"  \u2022 Abonnement : {sub_display}\n\n"
            f"\u26a0\ufe0f IMPORTANT : Vous devrez changer ce mot de passe lors de votre premi\u00e8re connexion.\n\n"
            f"Connectez-vous sur : {login_url}\n\n"
            f"Bonnes r\u00e9visions !\n"
            f"L'\u00e9quipe LearnFMPA"
        )

        encoded_subject = urllib.parse.quote(subject)
        encoded_body = urllib.parse.quote(body)
        mailto_link = f"mailto:{email}?subject={encoded_subject}&body={encoded_body}"

        html = generate_email_html(
            email_type="welcome",
            user_name=name,
            email=email,
            temp_password=temp_password,
            sub_display=sub_display,
            login_url=login_url,
            api_url=api_url,
            plan_details=plan_details,
            years_str=years_str,
        )
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        safe_name = name.replace(" ", "_").lower()
        filepath = save_and_open_email(html, f"welcome_{safe_name}_{timestamp}.html")

        print(f"\n  \u2705 User created successfully!")
        print(f"  {'=' * 48}")
        print(f"  Name:               {name}")
        print(f"  Email:              {email}")
        print(f"  Temporary Password: {temp_password}")
        print(f"  Year(s):            {years_str}")
        print(f"  Subscription:       {sub_display}")
        print(f"  User ID:            {result.get('user', {}).get('id', 'N/A')}")
        print(f"  {'=' * 48}")
        print(f"\n  \ud83d\udce7 HTML email saved:")
        print(f"  {filepath}")
        print(f"\n  \u2709\ufe0f  Plain text mailto link:")
        print(f"  {mailto_link}")
        print(f"\n  Open the HTML file in your browser, copy the content,")
        print(f"  and paste it into your email client (which supports HTML).")
        print(f"  Or use the mailto link for plain text.\n")
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
        sub = "PAID"
        sub_display = "PAID (acc\u00e8s complet)"
        plan_details = "Acc\u00e8s complet et illimit\u00e9 \u2014 questions, explications et suivi de progression."
    else:
        sub = f"TRIAL ({duration} jours)"
        sub_display = f"Essai Premium ({duration} jours, puis acc\u00e8s gratuit)"
        plan_details = f"Essai Premium de {duration} jours, puis acc\u00e8s gratuit (10 questions/jour)."

    login_url = f"{api_url}/login"
    subject = f"Votre compte LearnFMPA est activ\u00e9 \u2014 Vos identifiants"
    body = (
        f"Bonjour {user_name},\n\n"
        f"Votre compte LearnFMPA est maintenant activ\u00e9 !\n\n"
        f"Voici vos identifiants de connexion :\n\n"
        f"  \u2022 Email : {email}\n"
        f"  \u2022 Mot de passe temporaire : {temp_password}\n"
        f"  \u2022 Abonnement : {sub_display}\n\n"
        f"\u26a0\ufe0f IMPORTANT : Vous devez changer ce mot de passe lors de votre premi\u00e8re connexion.\n\n"
        f"Connectez-vous sur : {login_url}\n\n"
        f"Bonnes r\u00e9visions !\n"
        f"L'\u00e9quipe LearnFMPA"
    )

    encoded_subject = urllib.parse.quote(subject)
    encoded_body = urllib.parse.quote(body)
    mailto_link = f"mailto:{email}?subject={encoded_subject}&body={encoded_body}"

    html = generate_email_html(
        email_type="activation",
        user_name=user_name,
        email=email,
        temp_password=temp_password,
        sub_display=sub_display,
        login_url=login_url,
        api_url=api_url,
        plan_details=plan_details,
    )
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    safe_name = user_name.replace(" ", "_").lower()
    filepath = save_and_open_email(html, f"activation_{safe_name}_{timestamp}.html")

    print(f"\n  \u2705 Account activated successfully!")
    print(f"  {'=' * 48}")
    print(f"  Name:          {user_name}")
    print(f"  Email:         {email}")
    print(f"  Subscription:  {sub_display}")
    print(f"  Duration:      {duration} jours")
    print(f"  Temp Password: {temp_password}")
    print(f"  {'=' * 48}")
    print(f"\n  \ud83d\udce7 HTML email saved:")
    print(f"  {filepath}")
    print(f"\n  \u2709\ufe0f  Plain text mailto link:")
    print(f"  {mailto_link}")
    print(f"\n  Open the HTML file in your browser, copy the content,")
    print(f"  and paste it into your email client (which supports HTML).")
    print(f"  Or use the mailto link for plain text.\n")


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
    html_files = []
    duration_num = days if days else 7
    duration = f"{duration_num} jours"
    login_url = f"{api_url}/login"

    if paid:
        sub_display = "PAID (acc\u00e8s complet)"
        plan_details = "Acc\u00e8s complet et illimit\u00e9 \u2014 questions, explications et suivi de progression."
    else:
        sub_display = f"Essai Premium ({duration}, puis acc\u00e8s gratuit)"
        plan_details = f"Essai Premium de {duration_num} jours, puis acc\u00e8s gratuit (10 questions/jour)."

    for email in emails:
        activate_result = api_request(api_url, admin_secret, "/api/admin/users", "POST", {
            "action": "activate",
            "email": email,
        })
        if not activate_result.get("success"):
            print(f"  \u2717 {email}: {activate_result.get('error', 'Failed')}")
            failed += 1
            continue

        temp_password = generate_temp_password()
        reset_result = api_request(api_url, admin_secret, "/api/admin/users", "POST", {
            "action": "reset_password",
            "email": email,
            "new_password": temp_password,
        })

        if not reset_result.get("success"):
            print(f"  \u2248 {email}: activated but failed to set temp password")
            failed += 1
            continue

        if paid:
            api_request(api_url, admin_secret, "/api/admin/users", "POST", {
                "action": "update_user",
                "email": email,
                "subscription_status": "paid",
            })
            print(f"  \u2705 {email}: activated (PAID) | temp: {temp_password}")
        else:
            print(f"  \u2705 {email}: activated (TRIAL {duration}) | temp: {temp_password}")

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

        subject = f"Votre compte LearnFMPA est activ\u00e9 \u2014 Vos identifiants"
        body = (
            f"Bonjour {user_name},\n\n"
            f"Votre compte LearnFMPA est maintenant activ\u00e9 !\n\n"
            f"Voici vos identifiants de connexion :\n\n"
            f"  \u2022 Email : {email}\n"
            f"  \u2022 Mot de passe temporaire : {temp_password}\n"
            f"  \u2022 Abonnement : {sub_display}\n\n"
            f"\u26a0\ufe0f IMPORTANT : Vous devez changer ce mot de passe lors de votre premi\u00e8re connexion.\n\n"
            f"Connectez-vous sur : {login_url}\n\n"
            f"Bonnes r\u00e9visions !\n"
            f"L'\u00e9quipe LearnFMPA"
        )

        encoded_subject = urllib.parse.quote(subject)
        encoded_body = urllib.parse.quote(body)
        mailto_links.append(f"mailto:{email}?subject={encoded_subject}&body={encoded_body}")

        html = generate_email_html(
            email_type="activation",
            user_name=user_name,
            email=email,
            temp_password=temp_password,
            sub_display=sub_display,
            login_url=login_url,
            api_url=api_url,
            plan_details=plan_details,
        )
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        safe_name = user_name.replace(" ", "_").lower()
        filepath = save_and_open_email(html, f"activation_{safe_name}_{timestamp}.html")
        html_files.append(filepath)

        success += 1

    sub_type = "PAID" if paid else f"TRIAL ({duration})"
    print(f"\n  \u2705 Batch activation complete ({sub_type}): {success} activated, {failed} failed.")

    if html_files:
        print(f"\n  \ud83d\udce7 HTML emails saved:")
        for fp in html_files:
            print(f"    {fp}")
    if mailto_links:
        print(f"\n  \u2709\ufe0f  Plain text mailto links:")
        for link in mailto_links:
            print(f"    {link}")
    if html_files or mailto_links:
        print(f"\n  Open the HTML files in your browser, copy the content,")
        print(f"  and paste it into your email client (which supports HTML).")
        print(f"  Or use the mailto links for plain text.\n")


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
        user_result = api_request(api_url, admin_secret, f"/api/admin/users?email={email}", "GET")
        user_name = email
        if user_result.get("success"):
            user_name = user_result.get("user", {}).get("name", email)

        login_url = f"{api_url}/login"
        subject = "LearnFMPA \u2014 R\u00e9initialisation de votre mot de passe"
        body = (
            f"Bonjour {user_name},\n\n"
            f"Votre mot de passe LearnFMPA a \u00e9t\u00e9 r\u00e9initialis\u00e9.\n\n"
            f"Voici vos identifiants de connexion :\n\n"
            f"  \u2022 Email : {email}\n"
            f"  \u2022 Nouveau mot de passe temporaire : {new_password}\n\n"
            f"\u26a0\ufe0f IMPORTANT : Vous devez changer ce mot de passe lors de votre prochaine connexion.\n\n"
            f"Connectez-vous sur : {login_url}\n\n"
            f"Cordialement,\n"
            f"L'\u00e9quipe LearnFMPA"
        )

        encoded_subject = urllib.parse.quote(subject)
        encoded_body = urllib.parse.quote(body)
        mailto_link = f"mailto:{email}?subject={encoded_subject}&body={encoded_body}"

        html = generate_email_html(
            email_type="reset",
            user_name=user_name,
            email=email,
            temp_password=new_password,
            sub_display="",
            login_url=login_url,
            api_url=api_url,
            plan_details="Si vous n'\u00eates pas \u00e0 l'origine de cette r\u00e9initialisation, veuillez nous contacter imm\u00e9diatement.",
        )
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        safe_name = user_name.replace(" ", "_").lower()
        filepath = save_and_open_email(html, f"reset_{safe_name}_{timestamp}.html")

        print(f"\n  \u2705 Password reset successfully!")
        print(f"  {'=' * 48}")
        print(f"  Email:                    {email}")
        print(f"  New Temporary Password:   {new_password}")
        print(f"  {'=' * 48}")
        print(f"\n  \ud83d\udce7 HTML email saved:")
        print(f"  {filepath}")
        print(f"\n  \u2709\ufe0f  Plain text mailto link:")
        print(f"  {mailto_link}")
        print(f"\n  Open the HTML file in your browser, copy the content,")
        print(f"  and paste it into your email client (which supports HTML).")
        print(f"  Or use the mailto link for plain text.\n")
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