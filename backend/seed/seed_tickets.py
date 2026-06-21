"""
Seed script — populates the PostgreSQL database with demo profiles and realistic resolved tickets.
Run: python -m seed.seed_tickets (from backend/ directory)
The demo users are also created in Supabase Auth and can log in with the
credentials documented in the project README.
"""

import asyncio
import sys
import os
from datetime import datetime, timedelta, timezone
import random
import uuid

# Add parent dir to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy.future import select
from sqlalchemy import delete, text

from app.core.config import settings
from app.core.db import async_session_maker, engine
from app.models.profile import Profile
from app.models.ticket import Ticket
from app.models.ticket_event import TicketEvent
from app.models.notification import Notification


# Demo profiles
DEMO_USERS = [
    {"id": uuid.UUID("c3204099-fc6e-4854-aa4c-aae97f5b422d"), "name": "Priya Sharma", "role": "employee", "department": None, "email": "employee@nudge.org"},
    {"id": uuid.UUID("56d8d384-fbae-4235-a240-8b3406439f96"), "name": "Rahul Verma", "role": "agent", "department": "IT", "email": "agent@nudge.org"},
    {"id": uuid.UUID("94cc80b7-45db-4e6b-ad06-1a46aaa1c3cc"), "name": "Ananya Gupta", "role": "agent", "department": "HR", "email": "agent2@nudge.org"},
    {"id": uuid.UUID("a78a8b0f-a2b3-4e4f-be9b-8c261265918e"), "name": "Vikram Singh", "role": "manager", "department": None, "email": "manager@nudge.org"},
]

# Seed tickets — realistic mix of IT/HR/Finance/Admin
SEED_TICKETS = [
    # IT
    {"title": "VPN not working from home", "description": "My VPN disconnects every 10 minutes when working remotely. Using FortiClient on Windows laptop. Started after the recent security update.", "category": "IT", "urgency": "High", "status": "Resolved", "resolution_note": "VPN client was outdated. Updated FortiClient to v7.4.1 and configured split tunneling. Issue resolved after restart."},
    {"title": "Cannot access shared drive", "description": "Unable to access the Finance shared drive (\\\\server\\finance). Getting 'Access Denied' error. I had access last week.", "category": "IT", "urgency": "Medium", "status": "Resolved", "resolution_note": "User permissions were reset during AD migration. Re-added user to Finance_ReadWrite security group. Access restored."},
    {"title": "Laptop running very slow", "description": "My Dell Latitude laptop takes 5 minutes to boot and applications freeze frequently. It's been getting worse over the past month.", "category": "IT", "urgency": "Medium", "status": "Resolved", "resolution_note": "Disk was 95% full. Cleared temp files, moved old data to cloud, and added 8GB RAM upgrade. Boot time now under 1 minute."},
    {"title": "Email not syncing on phone", "description": "Outlook on my Android phone stopped syncing emails 3 days ago. I can access email on laptop but not phone.", "category": "IT", "urgency": "Low", "status": "Resolved", "resolution_note": "App cache was corrupted. Cleared Outlook app data, re-authenticated with OAuth2, and re-synced. All emails restored."},
    {"title": "Printer on 3rd floor not working", "description": "The HP LaserJet on the 3rd floor shows 'offline' status. Multiple people have reported the same issue.", "category": "IT", "urgency": "Medium", "status": "Resolved", "resolution_note": "Network cable was loose. Reconnected the Ethernet cable and reset the print spooler on the server. Printer back online."},
    {"title": "Need new software license — Figma", "description": "Requesting a Figma Professional license for the design work on the new program portal. Currently using free tier which limits collaboration.", "category": "IT", "urgency": "Low", "status": "Closed", "resolution_note": "Approved and provisioned Figma Professional license. Added to the organization's Figma workspace. Invoice processed via Finance."},

    # HR
    {"title": "Leave balance discrepancy", "description": "My leave portal shows 12 days remaining but according to my calculation I should have 18 days. I haven't taken any leave in Q2.", "category": "HR", "urgency": "Medium", "status": "Resolved", "resolution_note": "System error during Q2 rollover. HR manually corrected the leave balance to 18 days and verified against attendance records."},
    {"title": "Salary slip for March not available", "description": "Unable to download my salary slip for March 2026 from the HR portal. All other months are available.", "category": "HR", "urgency": "Low", "status": "Resolved", "resolution_note": "March payroll processing was delayed due to tax filing updates. Salary slips regenerated and uploaded. Now accessible on the portal."},
    {"title": "Request for flexible work arrangement", "description": "Requesting approval for work-from-home on Mondays and Fridays. I commute 2 hours each way and it's affecting my productivity.", "category": "HR", "urgency": "Low", "status": "Resolved", "resolution_note": "Approved 2-day WFH arrangement (Mon/Fri) as per the flexible work policy. Manager endorsement received. Updated in attendance system."},
    {"title": "Health insurance card not received", "description": "Joined 2 months ago but haven't received my health insurance card yet. Need it for a planned medical procedure.", "category": "HR", "urgency": "High", "status": "Resolved", "resolution_note": "Enrollment was pending verification. Fast-tracked the insurance activation with provider. E-card issued within 48 hours, physical card shipped."},

    # Finance
    {"title": "Travel reimbursement pending", "description": "Submitted travel reimbursement for the Bangalore field visit on May 15. Amount: ₹12,500. Still showing 'Pending' after 3 weeks.", "category": "Finance", "urgency": "Medium", "status": "Resolved", "resolution_note": "Reimbursement was held due to missing hotel receipt. Employee uploaded the receipt, and payment of ₹12,500 was processed in the next payroll cycle."},
    {"title": "Vendor invoice needs urgent approval", "description": "The IT vendor (TechServe Solutions) invoice #TS-2026-0847 for ₹3,50,000 is due in 2 days. Needs Finance Head approval.", "category": "Finance", "urgency": "High", "status": "Resolved", "resolution_note": "Invoice verified against PO and delivery receipt. Finance Head approved. Payment processed via NEFT within 24 hours."},
    {"title": "Budget allocation query for Q3", "description": "Need clarification on the Q3 program budget allocation. The approved amount seems different from what was discussed in the planning meeting.", "category": "Finance", "urgency": "Low", "status": "Resolved", "resolution_note": "Budget was revised after the planning meeting to accommodate the new rural outreach program. Updated budget sheet shared with the requester."},

    # Admin
    {"title": "Air conditioning not working in conference room", "description": "Conference room 2B on the 4th floor has no air conditioning. We have client meetings scheduled there this week.", "category": "Admin", "urgency": "High", "status": "Resolved", "resolution_note": "AC compressor had tripped. Facilities team reset the unit and scheduled maintenance. Temperature restored within 2 hours."},
    {"title": "Request for additional parking space", "description": "The office parking lot is full by 9:30 AM daily. Requesting allocation of additional parking spots for the team.", "category": "Admin", "urgency": "Low", "status": "Resolved", "resolution_note": "Negotiated 10 additional parking spots with the building management. Parking passes issued to team leads for distribution."},
    {"title": "Office supplies needed — whiteboard markers", "description": "All conference rooms are out of whiteboard markers and erasers. We use them daily for brainstorming sessions.", "category": "Admin", "urgency": "Low", "status": "Resolved", "resolution_note": "Ordered 50 whiteboard markers (assorted colors) and 10 erasers. Distributed across all 8 conference rooms. Set up monthly auto-reorder."},
    {"title": "ID card replacement needed", "description": "Lost my office ID card yesterday. Need a replacement as it's required for building access and attendance.", "category": "Admin", "urgency": "Medium", "status": "Resolved", "resolution_note": "Old card deactivated for security. New ID card printed and programmed with building access. Issued within same day."},

    # Some Open/In Progress tickets
    {"title": "New laptop request for field team", "description": "Three field coordinators in the rural development program need laptops for data collection. Currently using personal devices.", "category": "IT", "urgency": "Medium", "status": "Open", "resolution_note": None},
    {"title": "Training room booking system issues", "description": "The online booking system for the training room shows conflicting reservations. Multiple teams are double-booked for the same slots.", "category": "Admin", "urgency": "High", "status": "In Progress", "resolution_note": None},
]


async def seed():
    """Main seed function."""
    print("🌱 Connecting to PostgreSQL via SQLAlchemy...")
    
    async with async_session_maker() as session:
        # Ensure tickets table columns match the model (Self-healing schema)
        print("🛠️  Ensuring tickets table schema is up to date...")
        await session.execute(text("ALTER TABLE tickets ADD COLUMN IF NOT EXISTS department text"))
        await session.execute(text("ALTER TABLE tickets ADD COLUMN IF NOT EXISTS ai_suggested_category text"))
        await session.execute(text("ALTER TABLE tickets ADD COLUMN IF NOT EXISTS ai_suggested_urgency text"))
        await session.execute(text("ALTER TABLE tickets ADD COLUMN IF NOT EXISTS resolution_note text"))
        await session.commit()

        # Clear existing data (for re-seeding)
        print("🗑️  Clearing existing data...")
        await session.execute(delete(Notification))
        await session.execute(delete(TicketEvent))
        await session.execute(delete(Ticket))
        await session.execute(delete(Profile))
        await session.commit()

        # Clear existing auth users
        emails = [u["email"] for u in DEMO_USERS]
        ids = [u["id"] for u in DEMO_USERS]
        print("🗑️  Clearing existing mock auth users and identities...")
        await session.execute(text(
            "DELETE FROM auth.identities WHERE user_id = ANY(:ids)"
        ), {"ids": ids})
        await session.execute(text(
            "DELETE FROM auth.users WHERE email = ANY(:emails)"
        ), {"emails": emails})
        await session.commit()

        # Insert mock auth users
        print("🔑 Seeding auth.users & auth.identities (password: 'demo123')...")
        await session.execute(text("CREATE EXTENSION IF NOT EXISTS pgcrypto"))
        
        for u in DEMO_USERS:
            await session.execute(text("""
                INSERT INTO auth.users (
                    id, instance_id, aud, role, email, encrypted_password, 
                    email_confirmed_at, raw_app_meta_data, raw_user_meta_data, 
                    created_at, updated_at, confirmation_token, recovery_token,
                    email_change_token_new, email_change, phone_change,
                    phone_change_token, email_change_token_current,
                    reauthentication_token
                ) VALUES (
                    :id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 
                    :email, crypt('demo123', gen_salt('bf')), now(), 
                    '{"provider":"email","providers":["email"]}', '{}', now(), now(), ''
                    , '', '', '', '', '', '', '', ''
                )
            """), {
                "id": u["id"],
                "email": u["email"]
            })

            # Create corresponding auth identity so Supabase Auth can find the email/pwd credentials
            identity_data_str = f'{{"sub": "{u["id"]}", "email": "{u["email"]}"}}'
            await session.execute(text("""
                INSERT INTO auth.identities (
                    id, user_id, identity_data, provider, provider_id,
                    created_at, last_sign_in_at, updated_at
                ) VALUES (
                    :id, :user_id, CAST(:identity_data AS jsonb), 'email', :provider_id,
                    now(), now(), now()
                )
            """), {
                "id": str(u["id"]),
                "user_id": u["id"],
                "identity_data": identity_data_str,
                "provider_id": str(u["id"])
            })
        await session.commit()

        # Create profiles
        print("👤 Creating demo profiles (dashboard data only)...")
        user_map = {}
        for u in DEMO_USERS:
            profile = Profile(
                id=u["id"],
                name=u["name"],
                role=u["role"],
                department=u["department"]
            )
            session.add(profile)
            user_map[u["role"] + (u.get("department") or "")] = profile
            print(f"   ✅ {u['name']} ({u['role']})")
        await session.commit()

        employee = user_map["employee"]
        agent_map = {
            "IT": user_map.get("agentIT"),
            "HR": user_map.get("agentHR"),
        }

        # Create tickets
        print("\n🎫 Creating seed tickets...")
        tickets_created = []
        for i, t in enumerate(SEED_TICKETS):
            base_date = datetime.now(timezone.utc) - timedelta(days=random.randint(1, 14))
            resolved_date = base_date + timedelta(hours=random.randint(2, 48))

            agent = agent_map.get(t["category"])

            ticket = Ticket(
                title=t["title"],
                description=t["description"],
                category=t["category"],
                urgency=t["urgency"],
                status=t["status"],
                department=t["category"],
                created_by=employee.id,
                assigned_to=agent.id if agent and t["status"] != "Open" else None,
                ai_confidence=round(random.uniform(0.75, 0.98), 2) if t["status"] != "Open" else None,
                ai_suggested_category=t["category"],
                ai_suggested_urgency=t["urgency"],
                resolution_note=t.get("resolution_note"),
                created_at=base_date,
                updated_at=resolved_date if t["status"] in ["Resolved", "Closed"] else base_date,
            )
            session.add(ticket)
            tickets_created.append(ticket)

        await session.commit()

        for ticket in tickets_created:
            # Create event history
            event = TicketEvent(
                ticket_id=ticket.id,
                old_status=None,
                new_status="Open",
                actor_id=employee.id,
                timestamp=ticket.created_at,
            )
            session.add(event)

            if ticket.status in ["In Progress", "Resolved", "Closed"] and ticket.assigned_to:
                event2 = TicketEvent(
                    ticket_id=ticket.id,
                    old_status="Open",
                    new_status="In Progress",
                    actor_id=ticket.assigned_to,
                    timestamp=ticket.created_at + timedelta(hours=1),
                )
                session.add(event2)

            if ticket.status in ["Resolved", "Closed"] and ticket.assigned_to:
                event3 = TicketEvent(
                    ticket_id=ticket.id,
                    old_status="In Progress",
                    new_status="Resolved",
                    actor_id=ticket.assigned_to,
                    timestamp=ticket.updated_at,
                )
                session.add(event3)

            print(f"   {'✅' if ticket.status in ['Resolved', 'Closed'] else '🔄' if ticket.status == 'In Progress' else '🆕'} [{ticket.category}] {ticket.title} — {ticket.status}")
            
        await session.commit()

        # Try to compute embeddings
        print("\n🧠 Computing embeddings (this may take a moment)...")
        try:
            from app.ai.embeddings import get_embedding
            res = await session.execute(select(Ticket))
            all_tickets = res.scalars().all()
            for ticket in all_tickets:
                try:
                    embedding = await get_embedding(ticket.description)
                    if embedding:
                        ticket.embedding = embedding
                        print(f"   📐 Embedded: {ticket.title[:40]}...")
                except Exception as e:
                    print(f"   ⚠️  Embedding failed for '{ticket.title[:30]}...': {e}")
            await session.commit()
        except Exception as e:
            print(f"   ⚠️  Embeddings unavailable: {e}")

        print(f"\n🎉 Seed complete! {len(SEED_TICKETS)} tickets, {len(DEMO_USERS)} dummy profiles created.")
        print("Demo login credentials are listed in the project README.")

    await engine.dispose()


if __name__ == "__main__":
    asyncio.run(seed())
