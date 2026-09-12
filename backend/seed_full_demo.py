import os, sys, uuid, json, random
from datetime import datetime, timedelta
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from sqlalchemy.orm import Session
from app.core.database import SessionLocal
from app.core.security import hash_password
from app.models.company        import Company
from app.models.user           import User
from app.models.lead           import Lead
from app.models.deal           import Deal
from app.models.activity       import Activity
from app.models.pipeline_stage import PipelineStage
from app.models.task           import Task
from app.models.calendar_event import CalendarEvent
from app.models.forum_post     import ForumPost
from app.models.forum_reply    import ForumReply

def rnd_date(a, b):
    return datetime.utcnow() - timedelta(days=random.randint(a,b), hours=random.randint(0,23))

def add_act(db, lead_id, owner_id, atype, subj, body, direction, at):
    db.add(Activity(
        id=uuid.uuid4(), lead_id=lead_id, owner_id=owner_id,
        activity_type=atype, subject=subj, body=body,
        extra_metadata=json.dumps({"direction": direction}), occurred_at=at))

LEADS = [
    {"title":"Arjun Mehta","company":"Zepto Technologies","email":"arjun@zepto.in","phone":"+91 98201 11234","status":"negotiation","ai_score":94.5,"priority":1,"intent":"High","source":"LinkedIn","category":"Hot","deal_value":750000,"sentiment":"positive","risk":False,"notes":"CTO of Zepto. Evaluated 3 CRM tools. Budget confirmed.",
     "conv":[("whatsapp","Inquiry","Hi, came across DaleIQ on LinkedIn. Our sales team of 20 needs a smarter CRM with AI. Can we schedule a call?","inbound",-8),("whatsapp","Reply","Absolutely! DaleIQ is built for fast-moving teams. What time works tomorrow?","outbound",-7),("call","Discovery Call","30 min call. Team size 20 reps. Loved AI Score demo. Very enthusiastic.","outbound",-5),("email","Enterprise Proposal Sent","Hi Arjun, attached is the Enterprise proposal for 20 seats. Includes AI transcription and WhatsApp automation.","outbound",-3),("whatsapp","Feedback","Can we get a 12% discount on the annual plan? Finance needs it to clear budget.","inbound",-1),("whatsapp","Counter offer","For a 12-month upfront commitment I can offer 12% off bringing total to 6.6L/year.","outbound",0)]},
    {"title":"Priya Nambiar","company":"BYJU's EdTech","email":"priya@byjus.com","phone":"+91 97302 44512","status":"proposal","ai_score":88.0,"priority":1,"intent":"High","source":"Website","category":"Hot","deal_value":500000,"sentiment":"positive","risk":False,"notes":"Sales Director. 800 leads/month. Wants WhatsApp automation.",
     "conv":[("whatsapp","Initial contact","We handle 800+ student leads/month and desperately need automation. Is DaleIQ the right fit?","inbound",-14),("whatsapp","Response","Hi Priya! Our WhatsApp automation helps teams convert 3x faster. Let me share a case study.","outbound",-13),("email","Case Study","How a similar EdTech reduced follow-up time by 60% using DaleIQ.","outbound",-11),("call","Demo","45 min demo. Loved AI priority queue. 12 reps. Decision in 2 weeks.","outbound",-7),("email","Custom Proposal","Here is your custom 12-seat proposal with WhatsApp automation.","outbound",-3)]},
    {"title":"Sanjay Verma","company":"Razorpay Fintech","email":"sanjay.v@razorpay.com","phone":"+91 99001 88234","status":"won","ai_score":97.0,"priority":1,"intent":"High","source":"Referral","category":"Hot","deal_value":1200000,"sentiment":"positive","risk":False,"notes":"VP Sales. Closed! 30 seat enterprise deal.",
     "conv":[("whatsapp","Referral intro","Hi Karan from Paytm referred us. Looking to replace Salesforce for 30 reps. Is DaleIQ enterprise-ready?","inbound",-28),("whatsapp","Welcome","Yes, fully enterprise ready with SSO, custom pipelines, AI scoring. Happy to show a walkthrough.","outbound",-27),("call","Requirements Call","90 min deep dive. Custom pipeline 6 stages. WhatsApp Email and Call in one inbox.","outbound",-21),("email","Enterprise Proposal","Attached is the Enterprise proposal for 30 seats with dedicated account manager and SLA guarantee.","outbound",-14),("whatsapp","Legal review done","Our legal team reviewed the contract. All good! Send invoice and we process payment this week.","inbound",-7),("email","Invoice signed","Welcome to DaleIQ! Payment received. Your 30-seat account is provisioned. Onboarding tomorrow at 10 AM!","outbound",-5),("whatsapp","Onboarding confirmed","Perfect! Our team is excited. See you tomorrow.","inbound",-4)]},
    {"title":"Meera Krishnan","company":"Swiggy Operations","email":"meera.k@swiggy.in","phone":"+91 80501 22341","status":"discovery","ai_score":76.0,"priority":2,"intent":"Medium","source":"Cold Email","category":"Warm","deal_value":300000,"sentiment":"positive","risk":False,"notes":"Sales Ops Manager. Field sales team of 25.",
     "conv":[("email","Cold Outreach","Hi Meera, DaleIQ helps field sales teams close 40% faster. Would a 15-min call make sense?","outbound",-10),("email","Interested","Yes we are evaluating CRMs. Demo this Thursday at 3 PM?","inbound",-9),("call","Discovery Call","25 min. Field team of 25. Needs mobile app and WhatsApp follow-ups.","outbound",-6),("whatsapp","Follow-up","Great speaking today! Here is the mobile app demo video and pricing tiers.","outbound",-5)]},
    {"title":"Rohit Agarwal","company":"Urban Company","email":"rohit@urbancompany.com","phone":"+91 90001 55678","status":"negotiation","ai_score":82.5,"priority":2,"intent":"High","source":"LinkedIn","category":"Hot","deal_value":450000,"sentiment":"positive","risk":False,"notes":"Head of Inside Sales. Budget Rs.4L. Needs team reports.",
     "conv":[("whatsapp","LinkedIn Inbound","We have 18 reps and a quota tracking nightmare. Can DaleIQ help?","inbound",-18),("whatsapp","Yes","Hi Rohit! Our Team Reports give real-time quota tracking and rep leaderboards.","outbound",-17),("email","Screen recording","Attached is a 5-min screen recording of our Team Reports feature.","outbound",-15),("call","Product Demo","40 min demo. Loved quota tracking and Rep Pulse. Budget concern.","outbound",-10),("email","Revised Proposal","18 seats for Rs.4.25L/year with 15% annual discount.","outbound",-5),("whatsapp","Reviewing","Sent to finance. Decision by Friday.","inbound",-2)]},
    {"title":"Divya Sharma","company":"Nykaa Beauty","email":"divya.s@nykaa.com","phone":"+91 99201 66341","status":"proposal","ai_score":79.0,"priority":2,"intent":"Medium","source":"Website","category":"Warm","deal_value":350000,"sentiment":"positive","risk":False,"notes":"Digital Sales Manager. D2C sales. Wants AI email drafting.",
     "conv":[("whatsapp","Inquiry","We sell D2C beauty products and want AI for personalized email follow-ups. Is this possible?","inbound",-12),("whatsapp","Yes!","DaleIQ AI Copilot drafts personalized outreach emails based on lead behavior. Happy to demo!","outbound",-11),("call","Demo","30 min. Team of 8 reps. Wants email automation and AI draft suggestions.","outbound",-8),("email","Proposal","DaleIQ proposal for 8 seats with AI email drafting and lead scoring.","outbound",-3)]},
    {"title":"Kiran Bose","company":"OLA Electric","email":"kiran.b@olaelectric.com","phone":"+91 88001 23456","status":"new","ai_score":71.0,"priority":2,"intent":"Medium","source":"LinkedIn","category":"Warm","deal_value":250000,"sentiment":"positive","risk":False,"notes":"EV sales exec. Just expressed interest.",
     "conv":[("whatsapp","New inquiry","Hi, exploring CRM options for our EV sales team of 10. Can you share details?","inbound",-2),("whatsapp","Welcome","Hi Kiran! DaleIQ helps EV sales teams prioritize hot leads with AI scores.","outbound",-1)]},
    {"title":"Sneha Pillai","company":"PhonePe Payments","email":"sneha.p@phonepe.com","phone":"+91 97601 44521","status":"discovery","ai_score":80.5,"priority":1,"intent":"High","source":"Referral","category":"Hot","deal_value":600000,"sentiment":"positive","risk":False,"notes":"VP Partnerships. Referred by Zepto. API integration interest.",
     "conv":[("whatsapp","Referral intro","Hi! Arjun from Zepto suggested DaleIQ. We process 200+ B2B sales monthly and need CRM with payment integration.","inbound",-7),("whatsapp","Welcome","Our API can sync payment data to lead timelines. Let us set up a technical demo.","outbound",-6),("call","Technical Discovery","60 min with Sneha and their tech lead. Scoped API integration. High interest.","outbound",-4),("email","Technical Proposal","Attached is our API integration scope and the enterprise proposal.","outbound",-2)]},
    {"title":"Amish Patel","company":"JioMart Retail","email":"amish.p@jiomart.com","phone":"+91 79201 88230","status":"lost","ai_score":28.0,"priority":3,"intent":"Low","source":"Cold Email","category":"Cold","deal_value":200000,"sentiment":"negative","risk":True,"notes":"Went with Zoho CRM. May revisit in 6 months.",
     "conv":[("whatsapp","Inbound","Hi, shortlisted DaleIQ and Zoho. Can you beat Zoho pricing?","inbound",-25),("whatsapp","Response","DaleIQ offers more AI capabilities. Quick call to show ROI difference?","outbound",-24),("call","Comparison Call","30 min. Very price-sensitive. Zoho at Rs.1.2L vs our Rs.2.5L.","outbound",-20),("email","Best Offer","Rs.1.8L for 10 seats annual commitment. Lowest possible offer.","outbound",-14),("whatsapp","Decision","We went with Zoho. Budget was the constraint. Thanks!","inbound",-10),("whatsapp","Graceful close","Totally understand! Zoho is great for entry level. We will be here when you are ready to scale.","outbound",-9)]},
    {"title":"Pooja Malhotra","company":"Lenskart Vision","email":"pooja.m@lenskart.com","phone":"+91 80201 19023","status":"won","ai_score":91.0,"priority":1,"intent":"High","source":"Referral","category":"Hot","deal_value":550000,"sentiment":"positive","risk":False,"notes":"Closed! 14 seat deal. 1-year contract.",
     "conv":[("whatsapp","Referral","Hi! Priya from BYJU's said DaleIQ is great. We have 14 sales reps selling eyewear. Can we talk?","inbound",-20),("call","Discovery","35 min. D2C and B2B hybrid team. Need WhatsApp and Email automation.","outbound",-18),("email","Proposal","DaleIQ 14-seat proposal with D2C WhatsApp automation.","outbound",-14),("whatsapp","Loved it","This is exactly what we need. Can we start next Monday?","inbound",-10),("email","Contract","Your signed contract and invoice for Rs.5.5L. Welcome to DaleIQ!","outbound",-8),("whatsapp","Payment confirmed","Done! Payment processed. See you Monday for onboarding!","inbound",-7)]},
    {"title":"Farhan Sheikh","company":"Cars24 Auto","email":"farhan.s@cars24.com","phone":"+91 97401 22890","status":"negotiation","ai_score":73.5,"priority":2,"intent":"Medium","source":"LinkedIn","category":"Warm","deal_value":380000,"sentiment":"neutral","risk":True,"notes":"Risk flag: 3 weeks no response after proposal.",
     "conv":[("whatsapp","Inquiry","Hi, we sell used cars B2B and have 15 reps. AI lead scoring sounds like what we need. Demo?","inbound",-22),("call","Discovery","40 min. Loved AI scoring. Specific request: lead aging alerts.","outbound",-18),("email","Proposal","DaleIQ proposal for 15 seats for auto sales with lead aging alerts.","outbound",-12),("whatsapp","Reminder 1","Just checking in on the proposal. Any feedback from your team?","outbound",-8),("whatsapp","Reminder 2","Happy to hop on a 10-min call to address any concerns. Let me know!","outbound",-3)]},
    {"title":"Kabir Anand","company":"Mamaearth D2C","email":"kabir.a@mamaearth.in","phone":"+91 96301 45612","status":"proposal","ai_score":84.0,"priority":1,"intent":"High","source":"Website","category":"Hot","deal_value":420000,"sentiment":"positive","risk":False,"notes":"Brand partnerships. Influencer lead tracking via CRM.",
     "conv":[("whatsapp","Inquiry","We work with 500+ influencers/month and need to track them as leads. Is DaleIQ flexible?","inbound",-9),("whatsapp","Yes!","You can use custom lead tags and pipeline stages for influencer tiers. Even track via WhatsApp.","outbound",-8),("call","Demo","30 min. Showcased custom pipeline and WhatsApp bulk messaging. Very impressed.","outbound",-6),("email","Proposal","Custom proposal for 10 seats with influencer pipeline and bulk WhatsApp analytics.","outbound",-3),("whatsapp","Review","Reviewed with Head of Marketing. She loved it. Comparing with one other tool.","inbound",-1)]},
    {"title":"Arun Krishnamurthy","company":"CRED Fintech","email":"arun.k@cred.club","phone":"+91 80901 34521","status":"new","ai_score":88.5,"priority":1,"intent":"High","source":"LinkedIn","category":"Hot","deal_value":900000,"sentiment":"positive","risk":False,"notes":"Director of Sales. Just connected on LinkedIn. Huge deal potential.",
     "conv":[("whatsapp","LinkedIn DM","Hi! Saw your AI CRM demo. CRED B2B partnerships team 30 reps is looking to replace our current CRM. Should we talk?","inbound",-1),("whatsapp","Response","Hi Arun! DaleIQ is used by fintech teams for AI-prioritized lead queues. Let us schedule a full demo this week!","outbound",0)]},
    {"title":"Geetanjali Roy","company":"Vedantu Learning","email":"geetanjali.r@vedantu.com","phone":"+91 97201 88034","status":"discovery","ai_score":62.0,"priority":2,"intent":"Medium","source":"Cold Email","category":"Warm","deal_value":220000,"sentiment":"neutral","risk":False,"notes":"Sales Training Manager. Interested in Call Coach AI.",
     "conv":[("email","Cold Email","Hi Geetanjali, DaleIQ Call Coach AI analyzes sales calls and provides reps improvement tips. Interested?","outbound",-8),("email","Reply","This is interesting! We spend Rs.5L/year on external sales trainers. Can DaleIQ replace some of that?","inbound",-7),("call","Call Coach Demo","45 min demo. Showed call transcript analysis and tone scoring.","outbound",-4),("whatsapp","Post-demo follow-up","Here are the Call Coach AI docs and a 6-seat pilot proposal.","outbound",-2)]},
    {"title":"Varun Gopal","company":"BigBasket Grocery","email":"varun.g@bigbasket.com","phone":"+91 99401 55890","status":"proposal","ai_score":85.0,"priority":1,"intent":"High","source":"Referral","category":"Hot","deal_value":480000,"sentiment":"positive","risk":False,"notes":"B2B Key Accounts. 16 reps. Comparing with Freshsales.",
     "conv":[("whatsapp","Referral Intro","Hi, Rohit from Urban Company referred DaleIQ. We manage key accounts for BigBasket B2B. 16 reps. Let us talk.","inbound",-11),("call","Demo","40 min. Key accounts: deal value tracking and pipeline stages and rep leaderboards.","outbound",-8),("email","Comparison + Proposal","DaleIQ vs Freshsales feature comparison and your 16-seat proposal.","outbound",-4),("whatsapp","Review","DaleIQ wins on AI features. Freshsales wins on price. Decision this week.","inbound",-2)]},
]

FORUM_DATA = [
    {"title":"How are you using AI Score to prioritize daily calls?","content":"Our team started using AI Score and it has been a game changer. We sort by score every morning and only call top 20 leads. Connect rate went from 18% to 34% in 3 weeks! How is your team using it?","category":"Best Practices","upvotes":47,"views":312,
     "replies":[("We filter AI Score above 70 and our team does not waste time on cold leads. Basically an AI-powered call list!",12),("We combine AI Score with Last contacted filter. Score above 80 AND not contacted in 3 days means auto WhatsApp goes out.",8),("Our manager uses Rep Pulse to see which reps are actually calling high-score leads. Accountability magic!",15)]},
    {"title":"WhatsApp automation templates that actually work","content":"Looking to improve our WhatsApp follow-up rate. Currently using a generic checking in template. What templates are getting the best response rates?","category":"WhatsApp & Messaging","upvotes":38,"views":256,
     "replies":[("We use: Hi Name! Quick question on a scale of 1-10 how ready are you to move forward? 60% response rate!",22),("Value-add templates work best. We share a relevant blog post instead of just following up. Less pushy and more replies.",11),("Avoid Just checking in at all costs! Use: Hi Name, I thought of you when I saw this article. Way better.",9)]},
    {"title":"Closed Rs.12L deal using DaleIQ — here is what we did","content":"Just closed our biggest deal ever — Rs.12L enterprise contract — and DaleIQ played a huge role.\n\nKey things:\n1. AI Score flagged them as High Intent day 1 (score 94)\n2. AI Copilot drafted the proposal email — saved 2 hours\n3. Global Inbox kept WhatsApp and Email threads in one place\n4. Calendar kept follow-up reminders automatic\n\nTotal sales cycle: 28 days!","category":"Success Stories","upvotes":112,"views":893,
     "replies":[("Incredible! Which AI Copilot prompts did you use for the proposal draft?",24),("28 days for Rs.12L is lightning fast. How many follow-ups did it take?",19),("This is gold. Sharing with my entire team right now. Congrats!",37)]},
    {"title":"Feature Request: Direct Google Sheets import for leads","content":"Would love to import leads from Google Sheets without downloading CSV first. Our ops team manually exports cleans and imports every week. A Sheets integration would save us 2+ hours/week!","category":"Feature Requests","upvotes":64,"views":421,
     "replies":[("Seconded! A Zapier integration to auto-push Facebook Lead Ads to DaleIQ would also be incredible.",31),("Is this on the roadmap? Our marketing team lives in Google Sheets and the CSV workaround is painful.",14)]},
    {"title":"Team Reports — structuring weekly 1-on-1 reviews","content":"Our manager wants to use Team Reports for weekly 1:1s with reps. Any suggestions on how to structure the review using DaleIQ data? Which metrics matter most for coaching conversations?","category":"Team & Management","upvotes":29,"views":187,
     "replies":[("We review: calls made, AI-scored leads contacted, pipeline movement per stage, deals closed. 4 metrics 15-min 1:1.",18),("We use Rep Pulse screen shares during 1:1s. Great for spotting who follows up consistently.",7)]},
]

TASK_TEMPLATES = [
    ("Send enterprise proposal to {lead}", "Email",     "High",   0),
    ("Follow up call with {lead} — no response", "Call","High",   1),
    ("Schedule demo for {lead}",           "Meeting",   "Medium", 2),
    ("Send case study to {lead}",          "Email",     "Medium", 1),
    ("Check proposal status with {lead}",  "Follow-up", "High",   0),
    ("WhatsApp check-in with {lead}",      "Follow-up", "Low",    3),
    ("Log discovery call notes for {lead}","Admin",     "Medium", 0),
    ("Prepare ROI comparison for {lead}",  "Admin",     "High",   1),
    ("Send contract to {lead}",            "Email",     "High",   0),
    ("Confirm onboarding date for {lead}", "Follow-up", "Medium", 2),
]

CAL_TEMPLATES = [
    ("Demo Call — {lead}",                "call",     1),
    ("Enterprise Proposal Review — {lead}","meeting",  1),
    ("Follow-up: Proposal Decision — {lead}","followup",1),
    ("Onboarding Kickoff — {lead}",       "meeting",  2),
    ("Technical Integration Call — {lead}","call",    1),
    ("Negotiation Final Call — {lead}",   "call",     1),
    ("Quarterly Business Review — {lead}","meeting",  2),
    ("Trial Check-in Call — {lead}",      "call",     1),
]

def seed():
    db = SessionLocal()
    print("\n" + "="*60)
    print("  DaleIQ Full Demo Seeder")
    print("="*60)
    try:
        company = db.query(Company).filter(Company.name == "DaleIQ Demo Corp").first()
        if not company:
            company = Company(name="DaleIQ Demo Corp", industry="Technology")
            db.add(company); db.commit(); db.refresh(company)
        print(f"Company : {company.name}")

        USERS_DEF = [
            ("Alex Owner",    "owner@daleiq.demo",   "Owner / Admin"),
            ("Sam Manager",   "manager@daleiq.demo", "Manager"),
            ("Jay Sales Rep", "sales1@daleiq.demo",  "Sales Rep"),
            ("Nina Sales",    "sales2@daleiq.demo",  "Sales Rep"),
        ]
        users = {}
        for (name, email, role) in USERS_DEF:
            u = db.query(User).filter(User.email == email).first()
            if not u:
                u = User(id=uuid.uuid4(), name=name, email=email,
                         password_hash=hash_password("Demo@1234"),
                         role=role, company_id=company.id,
                         is_active=True, is_email_verified=True)
                db.add(u); db.commit(); db.refresh(u)
                print(f"  Created : {email} ({role})")
            else:
                u.company_id = company.id; db.commit()
                print(f"  Exists  : {email}")
            users[email] = u

        owner = users["owner@daleiq.demo"]
        manager = users["manager@daleiq.demo"]
        s1 = users["sales1@daleiq.demo"]
        s2 = users["sales2@daleiq.demo"]

        stages = db.query(PipelineStage).all()
        smap   = {s.stage_key: s.id for s in stages}
        fallback = stages[0].id if stages else None
        print(f"Stages  : {list(smap.keys()) or 'NONE'}")

        old = db.query(Lead).filter(Lead.company_id == company.id).all()
        for ol in old:
            db.query(Activity).filter(Activity.lead_id == ol.id).delete()
            db.query(Deal).filter(Deal.lead_id == ol.id).delete()
            db.query(Task).filter(Task.lead_id == ol.id).delete()
            db.query(CalendarEvent).filter(CalendarEvent.lead_id == ol.id).delete()
        db.query(Lead).filter(Lead.company_id == company.id).delete()
        db.commit()
        print(f"Cleared : {len(old)} old leads")

        reps = [s1, s2]
        created = []
        emoji_map = {"won":"[WON]","lost":"[LOST]","new":"[NEW]","discovery":"[DISC]","proposal":"[PROP]","negotiation":"[NEG]"}
        for i, ld in enumerate(LEADS):
            rep = reps[i % 2]
            offset = abs(ld["conv"][0][4]) + 2 if ld["conv"] else 5
            created_at = datetime.utcnow() - timedelta(days=offset)
            last_contact = datetime.utcnow() + timedelta(days=ld["conv"][-1][4]) if ld["conv"] else None
            lead = Lead(
                id=uuid.uuid4(), owner_id=rep.id, company_id=company.id,
                title=ld["title"], lead_company_name=ld["company"],
                email=ld["email"], phone=ld["phone"], status=ld["status"],
                ai_score=ld["ai_score"], priority_rank=ld["priority"],
                intent_level=ld["intent"], source=ld.get("source","Website"),
                category=ld.get("category","Warm"),
                deal_value=float(ld.get("deal_value",0)),
                sentiment_label=ld.get("sentiment","neutral"),
                risk_flag=ld.get("risk",False), notes=ld.get("notes",""),
                created_at=created_at, last_contacted_at=last_contact,
            )
            db.add(lead); db.flush()
            for (atype, subj, body, direction, doff) in ld["conv"]:
                add_act(db, lead.id, rep.id, atype, subj, body, direction,
                        datetime.utcnow() + timedelta(days=doff))
            stage_id = smap.get(ld["status"]) or fallback
            if stage_id:
                outcome = {"won":"won","lost":"lost"}.get(ld["status"],"open")
                deal = Deal(id=uuid.uuid4(), lead_id=lead.id, owner_id=rep.id,
                            title=f"DaleIQ License — {ld['company']}",
                            amount=float(ld.get("deal_value",0)),
                            stage_id=stage_id, outcome=outcome,
                            created_at=created_at + timedelta(days=1))
                if outcome in ("won","lost"):
                    deal.closed_at = deal.created_at + timedelta(days=random.randint(3,10))
                db.add(deal)
            created.append((lead, rep))
            e = emoji_map.get(ld["status"],"•")
            print(f"  {e} {ld['title']:<22} {ld['company']:<22} [{ld['status'].upper()}]")
        db.commit()
        print(f"\nSeeded {len(created)} leads")

        for (lead, rep), tmpl in zip(created[:10], TASK_TEMPLATES):
            title, ttype, priority, days = tmpl
            db.add(Task(id=uuid.uuid4(), user_id=rep.id, lead_id=lead.id,
                        title=title.replace("{lead}", lead.title),
                        task_type=ttype, priority=priority, is_completed=False,
                        due_date=datetime.utcnow() + timedelta(days=days)))
        db.commit()
        print("Seeded 10 tasks")

        for (lead, rep), tmpl in zip(created[:8], CAL_TEMPLATES):
            title, etype, dur = tmpl
            start = datetime.utcnow() + timedelta(days=random.randint(1,7), hours=random.choice([9,10,11,14,15,16]))
            db.add(CalendarEvent(id=uuid.uuid4(), owner_id=rep.id, lead_id=lead.id,
                                 title=title.replace("{lead}", lead.title),
                                 description=f"Meeting with {lead.title} from {lead.lead_company_name}.",
                                 start_time=start, end_time=start + timedelta(hours=dur),
                                 event_type=etype, attendees=json.dumps([lead.email, rep.email])))
        db.commit()
        print("Seeded 8 calendar events")

        db.query(ForumReply).delete()
        db.query(ForumPost).delete()
        db.commit()
        authors = [s1, s2, manager, owner]
        for fp in FORUM_DATA:
            post = ForumPost(id=uuid.uuid4(), title=fp["title"], content=fp["content"],
                             category=fp["category"], author_id=random.choice(authors).id,
                             upvotes=fp["upvotes"], views=fp["views"],
                             reply_count=len(fp["replies"]), created_at=rnd_date(1,14))
            db.add(post); db.flush()
            for (txt, ups) in fp["replies"]:
                db.add(ForumReply(id=uuid.uuid4(), post_id=post.id,
                                  author_id=random.choice(authors).id,
                                  content=txt, upvotes=ups, created_at=rnd_date(0,5)))
        db.commit()
        print(f"Seeded {len(FORUM_DATA)} forum posts")

        total_msgs = sum(len(l["conv"]) for l in LEADS)
        total_replies = sum(len(p["replies"]) for p in FORUM_DATA)
        print(f"""
{"="*60}
  Done! Open http://localhost:3000 to explore demo data.
{"="*60}

  Login credentials (password: Demo@1234):
    owner@daleiq.demo    — Owner / Admin
    manager@daleiq.demo  — Manager
    sales1@daleiq.demo   — Sales Rep
    sales2@daleiq.demo   — Sales Rep

  Seeded:
    {len(LEADS)} leads   ({total_msgs} conversation messages)
    {len(LEADS)} deals   (with INR amounts)
    10 tasks  (with due dates)
    8  calendar events
    {len(FORUM_DATA)} forum posts ({total_replies} replies)
""")
    except Exception as e:
        import traceback; traceback.print_exc()
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed()
