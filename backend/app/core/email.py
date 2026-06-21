"""
Email notification sender using Gmail SMTP.
"""

import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Optional

from app.core.config import settings


def send_status_email(
    to_email: str,
    ticket_title: str,
    ticket_id: str,
    old_status: str,
    new_status: str,
    note: Optional[str] = None,
):
    """Send an email notification when a ticket status changes."""
    if not settings.SMTP_USER or not settings.SMTP_PASS:
        print("[EMAIL] SMTP not configured — skipping email notification.")
        return

    subject = f"[NudgeAssist] Ticket Update: {ticket_title}"

    html_body = f"""
    <html>
    <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #0f0f1a; color: #e0e0e0; padding: 20px;">
        <div style="max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); border-radius: 16px; padding: 32px; border: 1px solid rgba(99, 102, 241, 0.3);">
            <h1 style="color: #818cf8; font-size: 24px; margin-bottom: 8px;">NudgeAssist</h1>
            <p style="color: #94a3b8; font-size: 14px; margin-bottom: 24px;">Ticket Status Update</p>

            <div style="background: rgba(99, 102, 241, 0.1); border-radius: 12px; padding: 20px; margin-bottom: 20px;">
                <h2 style="color: #e2e8f0; font-size: 18px; margin-bottom: 12px;">{ticket_title}</h2>
                <p style="color: #94a3b8; font-size: 13px;">Ticket ID: {ticket_id}</p>
            </div>

            <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 20px;">
                <span style="background: #ef4444; color: white; padding: 6px 14px; border-radius: 20px; font-size: 13px;">{old_status}</span>
                <span style="color: #94a3b8;">→</span>
                <span style="background: #22c55e; color: white; padding: 6px 14px; border-radius: 20px; font-size: 13px;">{new_status}</span>
            </div>

            {"<p style='color: #cbd5e1; font-size: 14px; line-height: 1.6;'><strong>Note:</strong> " + note + "</p>" if note else ""}

            <hr style="border: none; border-top: 1px solid rgba(99, 102, 241, 0.2); margin: 24px 0;">
            <p style="color: #64748b; font-size: 12px;">This is an automated notification from NudgeAssist.</p>
        </div>
    </body>
    </html>
    """

    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = settings.SMTP_USER
    msg["To"] = to_email
    msg.attach(MIMEText(html_body, "html"))

    try:
        with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT) as server:
            server.starttls()
            server.login(settings.SMTP_USER, settings.SMTP_PASS)
            server.sendmail(settings.SMTP_USER, to_email, msg.as_string())
        print(f"[EMAIL] Sent status update email to {to_email}")
    except Exception as e:
        print(f"[EMAIL] Failed to send email: {e}")
