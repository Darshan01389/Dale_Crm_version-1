# Dale CRM — Official User Documentation

**Application URL:** [https://dale-crm-version-1.vercel.app](https://dale-crm-version-1.vercel.app)

> This document is the official guide for all users of the Dale CRM platform. It is structured for three user roles: **Salesperson (Sales Representative)**, **Manager (Team Lead)**, and **Admin (Company Owner/Admin)**. Read your chapter carefully to understand your assigned features and how to operate them effectively.

---

## Table of Contents

- [Chapter 1 — Features of the Application](#chapter-1--features-of-the-application)
- [Chapter 2 — Salesperson Instructions](#chapter-2--salesperson-instructions)
- [Chapter 3 — Manager Instructions](#chapter-3--manager-instructions)
- [Chapter 4 — Admin (Company) Instructions](#chapter-4--admin-company-instructions)

---

---

# Chapter 1 — Features of the Application

## Overview

Dale CRM (DaleIQ) is an AI-powered Customer Relationship Management platform designed for modern B2B sales teams. It unifies lead management, multi-channel communication, AI-driven coaching, real-time analytics, and pipeline management into a single, intelligent workspace.

**Access the application at:** [https://dale-crm-version-1.vercel.app](https://dale-crm-version-1.vercel.app)

---

## 1.1 Authentication & Onboarding

### Login
The Login screen at `dale-crm-version-1.vercel.app/login` allows all users to sign into their accounts using their registered email and password. On login, each user is redirected to their role-specific home screen.

### Register
New users register at `dale-crm-version-1.vercel.app/register`. During registration, users can optionally enter an **Organisation Invite Code** or a **Squad/Team Code** provided by their Admin or Manager to be automatically placed into the correct workspace and team.

### Forgot Password & Reset Password
Users who forget their password can request a reset link through the Forgot Password flow. The Reset Password screen allows them to set a new password using the link sent to their email.

### Email Verification
After registration, users receive a verification email. The Verify Email screen confirms their email address to complete account activation.

### Welcome Wizard
First-time users are guided through a Welcome Wizard that helps set up their profile, connect channels, and familiarise them with the interface.

---

## 1.2 My Pulse (Personal Performance Dashboard)

**My Pulse** is the home screen for Salespersons. It provides a personal analytics dashboard showing:

- **Outreach Count** — Total calls and messages in the selected time period
- **Deals Open** — Number of active deals currently in the pipeline
- **Revenue Won** — Total revenue from closed deals
- **Win Rate** — Percentage of leads converted to wins
- **Pipeline Funnel** — A visual bar chart of all leads across pipeline stages (New → Discovery → Proposal → Negotiation → Won → Lost)
- **AI Insights Panel** — Automated AI observations including Sentiment Trend, Conversion Signals, and Activity Peak hours
- **AI Forecast Intelligence** — Predictive model accuracy percentage and estimated win rate based on current pipeline velocity
- **Join Organisation / Squad Widget** — A widget with a text field and QR scanner allowing reps to join their company workspace or a specific squad by entering a 6-digit invite code or scanning a QR code

**Time Filters:** Users can toggle between 7 Days, 30 Days, 3 Months, and 12 Months to adjust the displayed metrics.

---

## 1.3 Lead Pipeline (Leads List)

**Lead Pipeline** is the central table of all leads (prospects) assigned to a user. It provides:

- **Tabular lead list** — Each row shows: Prospect Name, Company, Status/Stage, AI Signal (High Intent / At Risk / Standard / Analyzing...), Deal Value, and Last Activity
- **Search Bar** — Real-time search filtering by prospect name or company name
- **Stage Filters** — Filter leads by pipeline stage: All, New, Contacted, Proposal, Negotiation, Closed-Won
- **AI Intent Filters** — Filter by AI signal: All Intent, 🔥 High, ⚠️ Risk
- **Add Lead Button** — Opens a modal form to manually create a new lead with name, phone, email, company, and deal value
- **Manager Escalation Button (Sales Reps only)** — A "Manager" button on each row allows a Salesperson to flag a lead for manager attention. The manager receives a task notification
- **Open Profile Button** — Opens the full Lead Profile View for a selected lead
- **AI Distribute Button (Managers/Admins)** — Triggers an AI-powered lead distribution algorithm that auto-assigns leads to team members based on their performance and capacity

---

## 1.4 Profile View (Lead Details)

**Profile View** is the full detail screen for a single lead. Accessed by clicking "Open Profile" from Lead Pipeline. It contains:

- **Lead Header** — Name, role/occupation, company, and Intent Badge (Hot, Warm, Cold)
- **Duplicate Detection Banner** — Auto-detected if a lead with the same phone number already exists; shows a "Review" button to merge contacts
- **AI Summary Card** — A natural-language AI-generated summary of the lead's status, sentiment, and key topics. Has a "Regenerate" button to refresh the summary
- **Channel Quick-Action Row** — Four one-click action buttons:
  - **WA (WhatsApp)** — Opens WhatsApp compose panel for this lead
  - **SMS** — Opens SMS compose panel
  - **Email** — Opens Email compose panel
  - **📞 Call & Record** — Opens the Self-Hosted Dialer (WebRTC voice call with audio recording)
- **Activity Thread** — A chronological timeline of all interactions with the lead including WhatsApp messages, SMS, emails, and voice call recordings with playback
- **AI Copilot Insights (Right Panel)** — Powered by Llama 3.1 70b, shows contextual analysis of the lead with a "Suggested Action" recommendation and a one-click action button
- **Deal Scorecard (Right Panel)** — Shows Projected Deal Value in Indian Rupees and Win Probability percentage
- **Compose Bar (Bottom)** — A persistent message bar with an "AI Suggest" button that generates an AI-drafted message for the active channel
- **Overflow Menu (···)** — Three options: Reassign to another rep, Archive contact, Delete contact permanently

---

## 1.5 Global Inbox

**Global Inbox** is the unified multi-channel communication centre. It aggregates all lead conversations into a single messaging interface. It features:

- **Contact List (Left Panel)** — Sorted list of all leads with their initials avatar, name, last message preview, relative timestamp, and an Intent Badge (High Intent / At Risk / Standard)
- **Sort Tabs** — Sort contacts by: Intent, Risk, Recent, or Channel
- **Search Bar** — Search conversations by lead name
- **Compose Button (+)** — Opens a compose modal to start a new outbound message
- **Thread Panel (Main)** — Displays the full conversation history with the selected lead in WhatsApp-style chat bubbles. Inbound messages appear on the left, outbound on the right
- **Channel Switcher** — Toggle the active channel for the current conversation: WhatsApp, SMS, Email
- **Call Prospect Button** — Dials the lead's phone number and logs the call
- **AI Copilot Button** — Triggers a Llama 70b analysis of the lead's conversation history, showing an "Analysis" insight and a "Suggested Action" with an Execute button
- **AI Draft** — Auto-generates a message draft appropriate for the selected channel based on the lead's recent activity
- **Voice Recordings** — Voice call recordings appear in the thread with a playback player

---

## 1.6 Today (AI Task List)

**Today** is a daily prioritisation screen that shows AI-generated action items for the current day. It displays:

- **AI-Driven Action Items** — Tasks automatically created by the AI engine based on lead activity, call outcomes, and pipeline signals. Each task shows: Title, Description, Priority badge (High/Medium), Lead name, and a "Click to open profile" link. Completed tasks are marked "✓ AI VERIFIED"
- **Immediate Follow-up Required** — High-priority leads (AI score ≥ 70) flagged for immediate contact, shown with a High Intent badge
- **Don't Let These Cool** — At-risk leads (AI score between 1–70) that show signs of stagnation
- **Re-Sync AI Button** — Manually triggers the AI engine to re-evaluate tasks
- **Lead Check Button (Managers/Admins)** — Triggers AI reassignment detection for stagnant leads that should be re-distributed

---

## 1.7 Team Pulse (Manager Analytics Dashboard)

**Team Pulse** is the Manager's home dashboard showing real-time organisational performance. It includes:

- **Live Analytics Banner** — A live pulsing dot confirming data is refreshed in real-time
- **Revenue Won KPI Card** — Total revenue closed in the current period with a pipeline progress bar
- **AI Lead Quality KPI Card** — Average AI Score across all leads
- **Win Rate KPI Card** — Percentage of leads converted with total closed deal count
- **Pipeline Value KPI Card** — Weighted total value of all open deals
- **Pipeline Funnel Chart** — Bar chart showing the number of open deals in each stage (New → Discovery → Proposal → Negotiation → Won → Lost)
- **Customer Sentiment Chart** — Breakdown of AI-analysed call/message sentiments: Positive, Neutral, Negative (with count and percentage bars)
- **AI Model Performance Row** — Four metric cards: Model Accuracy %, Prediction Confidence (High/Medium/Low), Average Lead Score, and Estimated Resource Cost
- **Setup Checklist** — A guided onboarding checklist for new Managers to complete workspace setup steps

---

## 1.8 Pipeline Management (Kanban Board)

**Pipeline Management** is an interactive Kanban board for managing deals at the organisational level. Features include:

- **Kanban Columns** — Six stage columns: New, Discovery, Proposal, Negotiation, Closed Won, Closed Lost. Each column header shows the total deal value and count for that stage
- **Deal Cards** — Each card shows: Intent badge (HOT / RISK / STANDARD), Deal title, Lead name, Deal value (in ₹L), and assigned rep avatar
- **Drag-and-Drop** — Cards can be dragged from one stage column to another to update the deal stage. The change is saved to the database instantly (with rollback on failure)
- **Filter Bar**:
  - **Rep Filter** — Toggle between "All Reps" and "My Deals"
  - **Intent Filter** — Filter by: ALL / HOT / AT RISK
- **+ New Deal Button** — Opens a modal to create a new deal with title, value, stage, and linked lead
- **Export Button** — Exports the current pipeline view
- **Mobile Accordion** — On mobile, each stage column is collapsible with a toggle arrow

---

## 1.9 Call Coach

**Call Coach** is an AI-powered call review and coaching tool for Managers and Admins. It provides:

- **Call List (Left Panel)** — List of recorded calls showing: Prospect name, Rep name, Date, Call duration, Detected signal (e.g. "Pricing Objection"), and AI Score badge (colour-coded: green ≥ 80, amber 60–79, red < 60)
- **Transcript Panel (Right)** — Full call transcript with speaker labels, timestamps, and colour-coded highlights:
  - Amber highlight = warning signal detected (e.g. competitor mention, pricing objection)
  - Green highlight = strong rep response detected
- **AI Detected Signals Bar** — Pill badges showing all signals detected in the call: BUDGET APPROVED, COMPETITOR MENTIONED, PRICING OBJECTION, DECISION MAKER FOUND, etc.
- **AI Coaching Notes Panel (Right Column)**:
  - **Strengths** ✅ — What the rep did well in the call
  - **Areas to Improve** 🎯 — Specific coaching feedback for the rep
- **Share Feedback Button** — Allows the manager to share the coaching notes with the rep

---

## 1.10 Forecast

**Forecast** is a revenue forecasting view available to Admins/Owners showing predicted revenue based on pipeline velocity and AI scoring. *(Available to Owner/Admin and Sales Admin roles.)*

---

## 1.11 Team Intelligence (Team Reports)

**Team Intelligence** gives Managers and Admins an aggregated performance view across the entire organisation. It contains:

- **Date Range Selector** — Filter metrics by: 7 Days, 30 Days, 3 Months, 12 Months
- **KPI Cards Row** — Revenue Won, Average Win Rate, Lead Quality (AI Score), Total Activities (calls + messages)
- **Pipeline Distribution Bar Chart** — Visual bar chart of deal counts per stage using Recharts
- **Customer Sentiment Pie Chart** — Donut chart showing Positive / Neutral / Negative sentiment breakdown across all leads
- **Teams Performance Table** — Row-by-row breakdown per squad showing: Team Name, Member Count, Active Leads, Open Deals, Deals Won, Revenue Won (₹L), Win Rate (with progress bar), Team AI Index Score
- **Team Members Progress Table** — Individual rep-level table showing: Rep Name, Email, Team Squad, Role, Leads Owned, Open Deals, Deals Won, Revenue Won, Win Rate, AI Index Score
- **AI Insights Cards** — Three AI-generated observations: Conversion Uptrend, Velocity Alert, and Optimisation Hint

---

## 1.12 Team Management

**Team Management** allows Admins and Managers to organise the sales force into squads. Features:

- **Team Card Grid** — Each team (squad) is shown as a card with: Team name, Member count, Member list with roles, Remove buttons
- **Create New Team** — Admins can create a new squad by typing a team name
- **Assign New Member** — A dropdown inside each team card shows all available unassigned users; selecting one adds them to the squad
- **Remove from Team** — Removes a user from the squad (they remain in the organisation)
- **Remove from Organisation** — Permanently removes a user from the company workspace (Admin only)
- **Delete Team** — Deletes the entire squad and unassigns all members (Admin only)

---

## 1.13 Org Settings (Organisation Settings)

**Org Settings** is the Admin control panel for workspace configuration. It contains:

- **Organisation Tab**:
  - **Workspace Display Name** — Edit the company name displayed across the CRM
  - **Workspace Join Code** — A 6-digit code that employees enter during registration to join the company. Includes a "Copy Link" button that copies the full registration URL
  - **Company Onboarding QR Code** — A scannable QR code that opens the registration page with the join code pre-filled
  - **Teams & Squad Ingest** — List of all teams with their invite codes and expandable QR codes for each squad. Includes "+ Add Team" and "Invite Members" options
  - **Roles Overview** — Displays the three roles: Admin (full access), Manager (team pipeline), Sales (own leads)
  - **Pipeline Template** — Dropdown to set the industry-specific pipeline template: E-commerce/D2C, Real Estate, B2B SaaS/Tech, Home/Local Services, Generic
- **Channels Tab** → Redirects to Channel Settings
- **Billing & Plan Tab** → Redirects to Billing

---

## 1.14 Billing & Subscription

**Billing** manages the company's subscription plan. It provides:

- **Current Plan Card** — Shows the active plan name, monthly price, and next billing date. Includes an "Upgrade / Manage Plan" button
- **AI Processing Credits Quota Bar** — A progress bar showing how many AI requests have been used vs. the plan limit, with the reset date
- **Recent Invoices Table** — Shows all past invoices: Date, Amount, Status (PAID / UNPAID), and a "Download PDF" button for each
- **Upgrade Plan Modal** — Shows available subscription plans side-by-side with pricing and feature differences. Supports a custom Enterprise plan with a slider for AI requests/minute and toggles for Voice Transcription and Advanced Lead Sources
- **Checkout Flow** — Two payment methods:
  - **Stripe Checkout** — Redirects to Stripe's secure payment page (credit/debit cards, international)
  - **Razorpay (UPI/India)** — Opens a QR code for UPI payment via GPay, PhonePe, Paytm; or launches the Razorpay SDK
- **Simulate Month End** — Generates a test invoice for billing testing

---

## 1.15 Lead Sources (Automation & Webhook Engine)

**Lead Sources** is the automation hub for inbound lead capture. Accessible to Admin/Sales Admin roles only. It contains four sub-sections:

- **Connected Sources** — Shows all active lead ingestion channels (e.g. website forms, Facebook Ads, Zapier webhooks) with their status
- **Add Source Wizard** — Step-by-step wizard to connect a new lead source (webhook URL generation, authentication, field mapping)
- **Campaign Analytics** — Performance metrics per lead source: volume, conversion rate, quality score
- **Automation Rules** — Visual If/Then rule builder: Define conditions (e.g. IF source = Facebook AND intent = High) and actions (THEN assign to Rep A)
- **Webhook Logs** — Real-time log of all incoming webhook payloads. Shows successful ingestions and failed/malformed payloads for debugging

---

## 1.16 Calendar

**Calendar** provides Managers and Admins with a scheduling view for follow-ups, meetings, and task deadlines. It integrates with the AI task engine to surface upcoming commitments.

---

## 1.17 Global Search

**Global Search** is accessible via the search icon in the top Header bar. It allows any user to search across the entire CRM — leads, deals, messages, and contacts — in real time.

---

## 1.18 Account Settings

**Account Settings** has six configurable tabs (availability depends on role):

- **Profile** — Edit Full Name, Email, Phone, WhatsApp company number, Company outreach email, and Role
- **Appearance** — Choose theme (Light ☀️ / Dark 🌙 / System 💻), display density (Comfortable / Compact), and language (English / Hindi)
- **Notifications** — Toggle on/off: High-intent contact assigned, At-risk deal flagged, Daily summary email, Weekly digest
- **Channels** — View connected communication channels (WhatsApp, SMS, Email, Voice Capture Android, Voice Capture iOS) with their status (ACTIVE / PARTIAL / INACTIVE) and a Configure button
- **Org Setup** — Company Name, Fiscal Year Start, Default Currency, and Logo Upload
- **Security** — Change Password form, Two-Factor Authentication (2FA) toggle, and Sign Out of All Devices button

---

## 1.19 Help & Support

**Help & Support** is a resource centre accessible to all roles. It provides documentation links, FAQs, and contact information for technical assistance.

---

## 1.20 Community

**Community** and **Community Forums** give all users access to a peer forum for sharing tips, strategies, and product discussions with other DaleIQ users. Super Admins have a moderation view.

---

---

# Chapter 2 — Salesperson Instructions

## Role Overview

As a **Salesperson (Sales Representative)**, your primary responsibility is to manage your assigned leads, conduct outreach across multiple channels, log activity, and progress deals through the pipeline. Your assigned features are:

| Feature | Purpose |
|---|---|
| My Pulse | Personal KPI dashboard |
| Lead Pipeline | View and manage your leads |
| Profile View | Full lead detail and communication |
| Global Inbox | Unified multi-channel inbox |
| Today | Daily AI-generated task list |
| Account Settings | Profile and preferences |

**Your homepage:** When you log in, you land directly on **My Pulse**.

---

## 2.1 Step-by-Step: Getting Started

### Step 1 — Log In
1. Open [https://dale-crm-version-1.vercel.app](https://dale-crm-version-1.vercel.app) in your browser.
2. Enter your registered **Email** and **Password**.
3. Click **Sign In**.
4. You will be redirected to the **My Pulse** dashboard.

### Step 2 — Join Your Organisation or Squad
> **Do this first if you just registered without a code!**

1. On your **My Pulse** home screen, locate the **🔗 Join Organisation or Squad** widget near the top.
2. Enter the **6-digit code** given to you by your Manager or Admin.
3. Alternatively, click **📷 Scan QR** to scan the QR code from your Manager's screen using your device camera.
4. Click **Join Workspace**.
5. A green success message confirms you have joined. Your profile is now linked to your organisation and team.

---

## 2.2 Step-by-Step: Using My Pulse

**My Pulse** is your personal performance centre. Check it every morning to understand how your performance is trending.

### Step 1 — Review Your KPIs
1. Open **My Pulse** from the left sidebar.
2. At the top, you will see four KPI cards:
   - **Outreach** — Total calls and messages sent in the selected period
   - **Deals Open** — How many active deals you currently own
   - **Revenue Won** — Total revenue you have closed
   - **Win Rate** — Your conversion rate percentage
3. Use these numbers to track your daily progress.

### Step 2 — Change the Time Period
1. Look for the period selector in the top-right of My Pulse.
2. Click between: **7 Days**, **30 Days**, **3 Months**, or **12 Months**.
3. All KPI cards and charts will update to reflect the selected period.

### Step 3 — Understand the Pipeline Funnel
1. Scroll down to the **Pipeline Funnel** bar chart.
2. Each bar represents a stage in your sales pipeline.
3. Taller bars with more deals indicate stages that need attention.
4. Use this to identify where your deals are stuck.

### Step 4 — Read Your AI Insights
1. Next to the Pipeline Funnel, find the **AI Insights** panel (dark card).
2. Read the three AI observations:
   - **Sentiment Trend** — Whether your leads are responding positively
   - **Conversion Signal** — AI prediction on which leads are likely to convert
   - **Activity Peak** — The best time of day for your outreach based on engagement data
3. Use these insights to plan your day strategically.

### Step 5 — Check AI Forecast Intelligence
1. Scroll to the **AI Forecast Intelligence** card at the bottom.
2. It shows your current lead quality average and predicted win rate.
3. Aim to keep your AI score above 70 to maximise conversions.

---

## 2.3 Step-by-Step: Using Lead Pipeline

**Lead Pipeline** is your master list of all leads assigned to you. Use this daily to review and act on your prospects.

### Step 1 — Access Lead Pipeline
1. Click **Leads** or **Lead Pipeline** in the left sidebar.
2. The screen loads a table of all your assigned leads.

### Step 2 — Search for a Lead
1. Type the prospect name or company name into the **Search bar** at the top left of the toolbar.
2. The list filters in real-time as you type.

### Step 3 — Filter by Stage
1. In the Stage Filter buttons (All, New, Contacted, Proposal, Negotiation), click the stage you want to view.
2. Only leads in that stage will be shown.

### Step 4 — Filter by AI Signal
1. Use the Intent Filter buttons:
   - **All Intent** — Show all leads
   - **🔥 High** — Show only high-priority leads with AI score ≥ 70
   - **⚠️ Risk** — Show leads that are at risk of going cold
2. Start each day by filtering to **🔥 High** to prioritise your hottest opportunities.

### Step 5 — Add a New Lead Manually
1. Click the **+ Add Lead** button in the top-right of the toolbar.
2. In the modal that opens, fill in:
   - **Full Name** — The prospect's name
   - **Phone Number** — Primary contact number
   - **Email** — Email address (optional)
   - **Company** — The prospect's company name
   - **Deal Value** — Estimated deal value in ₹
3. Click **Save** to create the lead. It will appear in your Lead Pipeline with a "New" status.

### Step 6 — Open a Lead's Profile
1. Locate the lead in the table.
2. Click the **Open Profile** button on the right side of the row.
3. You will be taken to the **Profile View** for that lead.

### Step 7 — Request Manager Intervention
1. If you are struggling with a lead and need manager support:
2. Click the amber **Manager** button on the right side of the lead's row.
3. Confirm the prompt that appears.
4. Your manager will receive a task notification on their **Today** screen and will be assigned to help you with that lead.

---

## 2.4 Step-by-Step: Using Profile View (Lead Details)

**Profile View** is where you conduct all activity on a specific lead — messages, calls, and tracking conversation history.

### Step 1 — Open a Lead Profile
1. From **Lead Pipeline**, click **Open Profile** on any lead row, OR
2. Click directly on a lead's name in the Global Inbox.
3. The Profile View screen opens.

### Step 2 — Read the AI Summary
1. At the top of the profile, look for the blue **AI Summary** card.
2. Read the AI-generated summary which explains the lead's status, sentiment, and key topics from past interactions.
3. If no summary exists, it will say "No AI summary available." Click **Regenerate** to request one.

### Step 3 — Send a WhatsApp Message
1. Click the **WA** button in the Channel Quick-Action row.
2. The **Compose Sheet** slides up from the bottom.
3. Type your message in the text area.
4. To get an AI-generated message suggestion, click **✨ AI Suggest** at the bottom bar.
5. The AI generates a context-aware draft — review it, edit if needed, then click **Send**.

### Step 4 — Send an SMS
1. Click the **SMS** button in the Channel Quick-Action row.
2. Compose your message in the sheet that appears.
3. Click **Send**.

### Step 5 — Send an Email
1. Click the **Email** button in the Channel Quick-Action row.
2. Fill in the Subject and Body.
3. Click **Send**.

### Step 6 — Make a Voice Call (Call & Record)
1. Click the **📞 Call & Record** button in the Channel Quick-Action row.
2. The **Self-Hosted Dialer** panel opens.
3. Allow your browser's microphone permission when prompted.
4. The dialer establishes a WebRTC connection. Click **Call** to start.
5. Conduct your sales conversation.
6. Click **End Call** when finished.
7. The system automatically processes the audio through AI transcription. The call recording and AI-generated transcript will appear in the Activity Thread below within a few minutes.

### Step 7 — Review the Activity Thread
1. Scroll down below the Quick-Action buttons to the **Activity Thread**.
2. All interactions are shown in chronological order: WhatsApp messages, SMS, emails, and voice call recordings.
3. Voice recordings show a player with a transcript summary. Click play to listen.
4. Use this thread to recall exactly what was discussed in previous conversations before your next outreach.

### Step 8 — Check AI Copilot Insights (Desktop)
1. On desktop, look at the **right panel** titled "AI COPILOT INSIGHTS."
2. Click the **✨ Generate (70b)** button to trigger a Llama 3.1 70b AI analysis.
3. After a few seconds, the insight card shows a detailed analysis of the lead.
4. Below it, a **Suggested Action** card recommends your next step (e.g. "Schedule a follow-up call").
5. Click the action button (e.g. "Start Outreach" or "Compose Follow-up") to act immediately.

### Step 9 — Reassign, Archive, or Delete a Lead
1. Click the **···** (three dots) menu in the top-right of the Profile View.
2. Choose from:
   - **Reassign to…** — Sends the lead to another sales representative
   - **Archive contact** — Moves the lead to the archive. History is preserved
   - **Delete contact** — Permanently deletes the lead, all messages, recordings, and deal data. **This cannot be undone.**
3. Confirm the action in the confirmation modal.

---

## 2.5 Step-by-Step: Using Global Inbox

**Global Inbox** is your unified communication centre. Use it to monitor and respond to all leads from one place.

### Step 1 — Open Global Inbox
1. Click **Inbox** or **Global Inbox** in the left sidebar.
2. The two-panel inbox loads: contact list on the left, conversation thread on the right.

### Step 2 — Select a Conversation
1. Browse the **Contact List** on the left.
2. Look for the Intent Badge:
   - 🔥 **HIGH INTENT** — Act immediately
   - ⚠️ **AT RISK** — Do not let this lead go cold
   - **STANDARD** — Routine follow-up
3. Click a contact to open their conversation thread on the right.

### Step 3 — Sort Your Contacts
1. Use the sort tabs below the search bar:
   - **Intent** — Highest intent leads at the top
   - **Risk** — Most at-risk leads at the top
   - **Recent** — Most recently active at the top
   - **Channel** — Sorted alphabetically by communication channel
2. Select **Intent** as your default to always work your best leads first.

### Step 4 — Read the Conversation Thread
1. After selecting a contact, the right panel shows the full conversation history.
2. Your sent messages appear in **purple bubbles** on the right.
3. Inbound messages from the lead appear in **white bubbles** on the left.
4. Voice calls appear as audio player cards in the thread.

### Step 5 — Switch Channels
1. Above the message input, find the **Channel Switcher**.
2. Toggle between **WhatsApp**, **SMS**, or **Email**.
3. The conversation thread filters to show messages from that channel.

### Step 6 — Send a Message
1. Type your message in the **input bar** at the bottom of the thread panel.
2. Press **Enter** or click the **Send** button.
3. Your message is logged as an outbound activity and appears in the thread immediately.

### Step 7 — Use AI Copilot in Inbox
1. Click the **✨ AI Copilot** button in the thread header.
2. The Copilot panel expands below the header.
3. A Llama 70b analysis appears with a contextual insight and a **Suggested Action**.
4. Click **Execute** to perform the suggested action (e.g. initiate a call).

### Step 8 — Start a New Conversation
1. Click the **+** button (top-right of contact list panel).
2. The Compose Modal opens.
3. Select the lead, choose a channel, and type your message.
4. Click **Send**.

---

## 2.6 Step-by-Step: Using Today

**Today** is your AI-generated daily task list. Check this every morning before starting your outreach.

### Step 1 — Open Today
1. Click **Today** in the left sidebar.
2. The screen loads for the current date, showing today's date in a readable format.

### Step 2 — Act on AI-Driven Action Items
1. Scroll to the **AI-Driven Action Items** section.
2. Each task card shows: Task title, Description, Priority badge (High / Medium / Low), and the Lead name.
3. Click any task card to open the lead's Profile View directly.
4. Complete the recommended action (send a message, make a call, etc.).
5. Completed tasks will be marked **✓ AI VERIFIED** automatically.

### Step 3 — Follow Up on High-Priority Leads
1. Scroll to the **Immediate Follow-up Required** section.
2. These are leads with an AI score ≥ 70 that need urgent contact.
3. Click any lead card to open their Profile View.
4. Contact them via WhatsApp, call, or email from the Profile View.

### Step 4 — Handle At-Risk Leads
1. Scroll to the **Don't Let These Cool** section.
2. These are leads showing signs of disengagement.
3. Click any lead card and send a re-engagement message.
4. Use the AI Suggest feature to draft an appropriate message.

### Step 5 — Re-Sync AI Tasks
1. Click the **↻ Re-Sync AI** button at the top.
2. The AI re-evaluates all your leads and refreshes the task list.
3. Use this if your task list appears outdated or empty.

---

## 2.7 Step-by-Step: Using Account Settings

### Step 1 — Access Settings
1. Click **Settings** in the left sidebar or bottom navigation.
2. The settings screen opens with tabs.

### Step 2 — Update Your Profile
1. Click the **Profile** tab.
2. Edit: Full Name, Email, Phone, WhatsApp Number, Company Email.
3. Click **Save Changes** to apply.

### Step 3 — Change Appearance
1. Click the **Appearance** tab.
2. Select a theme: ☀️ Light, 🌙 Dark, or 💻 System.
3. Optionally change display density or language.

### Step 4 — Configure Notifications
1. Click the **Notifications** tab.
2. Toggle the notification types you want:
   - High-intent contact assigned to me
   - At-risk deal flagged
   - Daily summary email
   - Weekly digest

### Step 5 — Change Your Password
1. Click the **Security** tab.
2. Click **Change Password**.
3. Enter your Current Password, then type and confirm your New Password.
4. Click **Update**. A success message confirms the change.

### Step 6 — Sign Out
1. From the **Profile** tab, scroll to the bottom.
2. Click the red **Sign Out of DaleIQ** button.
3. Or from the **Security** tab, click **🚪 Sign Out of All Devices** to invalidate all active sessions.

---

---

# Chapter 3 — Manager Instructions

## Role Overview

As a **Manager (Team Lead)**, your responsibility is to oversee your squad's performance, review call quality, distribute and monitor leads, and coach your team toward better conversions. Your assigned features are:

| Feature | Purpose |
|---|---|
| Team Pulse | Organisational performance dashboard |
| Lead Pipeline | View all team leads and manage distribution |
| Global Inbox | Monitor and assist team communications |
| Call Coach | Review call transcripts and coach reps |
| Team Intelligence | Aggregated team analytics and reports |
| Team Management | Manage your squad members |
| Calendar | Schedule and track team activities |
| Today | AI-flagged leads needing manager intervention |
| Account Settings | Profile and preferences |

**Your homepage:** When you log in, you land on **Team Pulse** (the Dashboard).

---

## 3.1 Step-by-Step: Using Team Pulse (Dashboard)

**Team Pulse** gives you a live bird's-eye view of your organisation's sales health.

### Step 1 — Access Team Pulse
1. Log in at [https://dale-crm-version-1.vercel.app](https://dale-crm-version-1.vercel.app).
2. You land on **Team Pulse** automatically. The "LIVE ANALYTICS" badge confirms data is real-time.

### Step 2 — Monitor Key KPIs
1. Review the four KPI cards at the top:
   - **Revenue Won** — Total revenue closed this period with a pipeline progress bar showing % of target reached
   - **AI Lead Quality** — Average AI Score across all your team's leads (aim for 65+)
   - **Win Rate** — Your team's deal conversion rate with a count of deals closed
   - **Pipeline Value** — Total weighted value of all open deals in the system
2. If Win Rate is dropping, open **Call Coach** to review recent call quality.

### Step 3 — Analyse the Pipeline Funnel
1. Look at the **Pipeline Funnel** chart in the middle section.
2. Each bar represents a stage. A very tall "New" bar with a tiny "Proposal" bar means leads are not being progressed — assign tasks to reps.
3. A large "Negotiation" bar with no "Won" bar means deals are stalling — open **Call Coach** to review those calls.

### Step 4 — Check Customer Sentiment
1. Look at the **Customer Sentiment** chart on the right.
2. If Negative sentiment is > 30%, your team may be delivering poor pitches — schedule a coaching session.
3. Share the sentiment data with your team in your next meeting to align messaging.

### Step 5 — Review AI Model Performance
1. Scroll down to the **AI Model Performance** row.
2. Check **Model Accuracy** — if it drops below 75%, the AI scoring may be less reliable.
3. **Average Lead Score** tells you the overall quality of inbound leads. A score below 50 means marketing is sending poor-quality leads.

### Step 6 — Complete the Setup Checklist (New Managers)
1. If you are setting up for the first time, find the **Setup Checklist** at the top.
2. Complete each step in order: Create Teams, Invite Members, Connect Channels, Add First Lead Source.
3. Tick off completed items to track your progress.

---

## 3.2 Step-by-Step: Using Lead Pipeline as Manager

As a Manager, you can see **all leads** across your team (not just your own).

### Step 1 — Open Lead Pipeline
1. Click **Leads** / **Lead Pipeline** in the sidebar.
2. You will see all leads assigned to your team members, not just yourself.

### Step 2 — Distribute Leads Using AI
1. When new leads arrive and need assignment:
2. In the toolbar, click the **🪄 AI Distribute** button.
3. The AI analyses each rep's current load, win rate, and lead compatibility.
4. It automatically assigns each lead to the most appropriate rep.
5. A success toast confirms "Leads distributed via AI matching!"

### Step 3 — Monitor Lead Status
1. Use the **Stage Filter** to check how many leads your team has in each stage.
2. Focus on leads stuck in "Contacted" or "Proposal" — these may need manager coaching or intervention.

### Step 4 — Review Individual Leads
1. Click **Open Profile** on any lead to see the full conversation history, AI summary, and activity timeline.
2. As a manager, you can also reassign, archive, or delete leads from the ··· menu.

---

## 3.3 Step-by-Step: Using Global Inbox as Manager

### Step 1 — Open Global Inbox
1. Click **Inbox** in the sidebar.

### Step 2 — Monitor Communications
1. Sort by **Risk** to identify leads that are going cold across your team.
2. Click on at-risk contacts to review the conversation thread and determine if intervention is needed.

### Step 3 — Intervene on Behalf of a Rep
1. Open any lead's conversation thread.
2. Click **✨ AI Copilot** to analyse the situation.
3. Type a message in the input bar and send it to re-engage the lead on behalf of the rep.

---

## 3.4 Step-by-Step: Using Call Coach

**Call Coach** is one of the most powerful tools for a Manager. Use it to review call quality and coach underperforming reps.

### Step 1 — Open Call Coach
1. Click **Call Coach** in the left sidebar.

### Step 2 — Select a Call to Review
1. In the **Call List** on the left, you will see recorded calls with:
   - Prospect name and rep name
   - Call date and duration
   - Detected signal (e.g. "Pricing Objection", "Decision Maker Found")
   - AI Score badge (green = strong call, amber = average, red = poor)
2. Prioritise reviewing calls with **red scores (< 60)** first — these reps need immediate coaching.

### Step 3 — Read the Transcript
1. Click a call to select it.
2. The full transcript appears on the right, with speaker labels (Rep name vs. Prospect name) and timestamps.
3. Look for:
   - **Amber highlighted lines** — A negative signal was detected (competitor mention, pricing objection, timeline pushback)
   - **Green highlighted lines** — A strong rep response was detected

### Step 4 — Review AI Signals
1. At the top of the transcript panel, look for the **SIGNALS DETECTED** pills:
   - BUDGET APPROVED, COMPETITOR MENTIONED, PRICING OBJECTION, LOW BUDGET, DECISION MAKER FOUND, etc.
2. These tell you what happened in the call at a glance.

### Step 5 — Read AI Coaching Notes
1. On the right column, read the **AI COACHING NOTES**:
   - **✅ Strengths** — What the rep did well (positive reinforcement to acknowledge in your next 1:1)
   - **🎯 Areas to Improve** — Specific feedback the rep needs (talk-track gaps, missed follow-ups, etc.)
2. Use these notes as talking points for your coaching sessions.

### Step 6 — Share Feedback with the Rep
1. Click the **Share Feedback** button at the top of the call detail panel.
2. This allows you to share the coaching notes directly with the representative.

---

## 3.5 Step-by-Step: Using Team Intelligence (Team Reports)

**Team Intelligence** gives you the full analytical picture of your squad.

### Step 1 — Open Team Intelligence
1. Click **Team Intelligence** or **Team Reports** in the sidebar.

### Step 2 — Set the Date Range
1. Use the dropdown in the top-right to select the reporting period: 7 Days, 30 Days, 3 Months, 12 Months.
2. All tables and charts will update.

### Step 3 — Review KPI Cards
1. Check the four KPI cards: Revenue Won, Average Win Rate, Lead Quality, Total Activities.
2. Compare these against your targets for the period.

### Step 4 — Analyse Pipeline Distribution
1. The **Pipeline Distribution Bar Chart** shows deal counts per stage.
2. A healthy funnel should taper from left (New) to right (Won). A flat or inverted funnel means low conversion.

### Step 5 — Review Teams Performance Table
1. Scroll to the **👥 Teams Performance & Analytics** table.
2. Compare squads against each other:
   - Which team has the highest **Win Rate**?
   - Which team has the highest **Team AI Index** (lead quality)?
   - Which team is generating the most **Revenue Won**?
3. Use underperforming team metrics to justify coaching interventions or resource reallocation.

### Step 6 — Review Individual Member Performance
1. Scroll to the **🏆 Team Members Progress & Velocity** table.
2. Each row shows an individual rep's metrics.
3. Identify:
   - Reps with high **Leads Owned** but low **Deals Won** (conversion problem — coaching needed)
   - Reps with low **Leads Owned** (need more leads assigned)
   - Reps with high **Win Rate** and **AI Index** (top performers — recognise them)

### Step 7 — Read AI Insights
1. At the bottom, find the three **AI Insights** cards:
   - **Conversion Uptrend** — Overall scoring accuracy improvement
   - **Velocity Alert** — Speed difference between high-intent vs standard leads
   - **Optimisation Hint** — Channel effectiveness recommendation (e.g. calls vs email)
2. Use these insights in your next team briefing.

---

## 3.6 Step-by-Step: Using Team Management

**Team Management** lets you organise your sales force into high-performance squads.

> **Note:** As a Manager, you can only see and manage your own squad. Admins can manage all squads.

### Step 1 — Open Team Management
1. Click **Team Management** in the sidebar.

### Step 2 — Review Your Squad
1. Your squad card shows the team name and all current members.
2. Each member row shows their name and role (Manager / Sales).

### Step 3 — Add a New Member to Your Squad
1. Scroll to the bottom of your team card.
2. Find the **ASSIGN NEW MEMBER** section.
3. Use the dropdown to select an unassigned user from the organisation.
4. Click their name — they are immediately added to your squad.
5. A success toast confirms "Member added to team!"

### Step 4 — Remove a Member from Your Squad
1. Find the member in your team card.
2. Click the amber **✕ Team** button next to their name.
3. Confirm the removal in the prompt.
4. The member is removed from your squad but remains in the organisation.

---

## 3.7 Step-by-Step: Using Today as Manager

### Step 1 — Open Today
1. Click **Today** in the sidebar.

### Step 2 — Review Manager Intervention Tasks
1. The **AI-Driven Action Items** section shows tasks generated by the AI including any **Manager Requested** escalations from your reps.
2. Click any task to open the lead's Profile View.
3. Review the conversation history, then take action (call, message, or reassign).

### Step 3 — Trigger AI Lead Check
1. Click the **⚙️ Lead Check** button at the top.
2. Confirm the prompt.
3. The AI scans all leads in your team's pipeline for stagnant deals and generates reassignment recommendations.
4. A message appears summarising how many leads were flagged.

---

---

# Chapter 4 — Admin (Company) Instructions

## Role Overview

As an **Admin (Company Owner / Owner Admin)**, you have full authority over the entire DaleIQ workspace. You manage the organisation's infrastructure, subscriptions, onboarding, reporting, automation, and all user accounts. Your assigned features are:

| Feature | Purpose |
|---|---|
| Global Index (Pipeline Management) | Primary home — organisation-wide Kanban |
| Lead Pipeline | Full visibility of all leads across org |
| Lead Sources | Webhook automation and lead ingestion |
| Org Settings | Workspace configuration, invite codes, teams |
| Billing & Subscription | Manage plans, payments, and invoices |
| Team Management | Full org-wide team and user management |
| Call Coach | Review all reps' call quality |
| Team Intelligence | Full analytics across the entire organisation |
| Forecast | Revenue forecasting |
| Calendar | Org-wide scheduling |
| Team Pulse | Live analytics dashboard |
| Account Settings | Full settings including Org Setup and Channels |
| Global Inbox | Full communication oversight |
| Today | Full AI task management with Lead Check |
| Help & Support | Support access |
| Community | Community access |

**Your homepage:** When you log in, you land on **Pipeline Management (Kanban)** — your global operational view.

---

## 4.1 Step-by-Step: First-Time Admin Setup

Follow this sequence when setting up your company workspace for the first time.

### Step 1 — Log In
1. Open [https://dale-crm-version-1.vercel.app](https://dale-crm-version-1.vercel.app).
2. Enter your Admin email and password.
3. You land on the **Pipeline Management (Kanban)** view.

### Step 2 — Set Up Your Organisation Name
1. Click **Org Settings** in the left sidebar.
2. In the **Organisation** tab, find the **WORKSPACE DISPLAY NAME** field.
3. Type your company name.
4. Click **Save**.

### Step 3 — Set Your Pipeline Template
1. Still in **Org Settings**, scroll to the **Pipeline Template** section.
2. Click the dropdown and choose the template that matches your business type:
   - **E-commerce / D2C** — For product-based consumer sales
   - **Real Estate** — For property sales
   - **B2B SaaS / Tech** — For software product sales *(recommended for most)*
   - **Home / Local Services** — For service businesses
   - **Generic** — Universal default
3. Select and the pipeline stage names update automatically.
4. ⚠️ Warning: Changing this after you have existing leads may affect stage names. Plan this before adding leads.

### Step 4 — Create Your Teams (Squads)
1. In **Org Settings**, scroll to the **Teams & Squad Ingest** section.
2. Click **+ Add team**.
3. Type the team name (e.g. "Alpha Squad", "North Region Team", "Enterprise Reps").
4. Click **Save**.
5. Repeat for each team you need.

### Step 5 — Generate Invite Codes and Share with Team
1. In **Org Settings**, find the **Workspace Join Code** box.
2. Note the 6-digit code shown. This is your company-wide join code.
3. Click **Copy Link** — this copies the full registration URL with the code embedded.
4. Share this link with all employees who need to join the CRM.
5. For specific squads: click **🔑 Invite Members** next to any team in the Teams section.
6. The team's invite QR code expands. Click **Copy Join Link** to copy that squad's specific code.
7. Share squad-specific codes with the correct team members so they auto-join the right squad on registration.

### Step 6 — Connect Your Communication Channels
1. Click **Account Settings** → **Channels** tab (or via **Org Settings** → **Channels**).
2. Review the connected channels status:
   - **WhatsApp** — Status: ACTIVE / INACTIVE. Click **Configure** to set up Meta Cloud API
   - **SMS** — Click **Configure** to set up Twilio SMS
   - **Email** — Click **Configure** to connect Gmail OAuth
   - **Voice Capture** — Shows enrolled Android and iOS devices
3. Configure each channel required by your business.

### Step 7 — Set Up Lead Sources (Automation)
1. Click **Lead Sources** in the sidebar.
2. Click **Add Source** → the **Add Source Wizard** opens.
3. Follow the wizard steps to connect your lead sources (website form, Facebook Ads, Zapier, etc.).
4. A unique webhook URL is generated for each source.
5. Copy the webhook URL and paste it into your marketing platform's form/webhook settings.

---

## 4.2 Step-by-Step: Using Pipeline Management (Kanban) — Global Index

**Pipeline Management** is your main operational view. As Admin, you see all deals across the entire organisation.

### Step 1 — Open Pipeline Management
1. Click **Pipeline** or the home icon in the sidebar.
2. You see the full Kanban board with six stage columns: New, Discovery, Proposal, Negotiation, Closed Won, Closed Lost.

### Step 2 — Read the Pipeline at a Glance
1. At the top, note the **Deal Count** (e.g. "47 DEALS") and **Total Value** (e.g. "₹12.4L TOTAL VALUE").
2. Scan each column header for the column's total value and deal count.
3. A healthy pipeline should have declining deal counts as you move right (more deals in early stages, fewer in late stages — this is normal).

### Step 3 — Filter the Pipeline
1. Use the **Rep Filter** (All Reps / My Deals) to zoom in on specific views.
2. Use the **Intent Filter** to focus on: ALL, HOT, or AT RISK deals.
3. Filter to **HOT** to identify the deals with the highest AI scores that need acceleration.
4. Filter to **AT RISK** to identify deals that may be lost if not acted on immediately.

### Step 4 — Move a Deal to a New Stage
1. Click and hold a deal card.
2. Drag it to the target column.
3. Release to drop. The deal stage is updated in the database automatically.
4. If a deal closes: drag it to **Closed Won** or **Closed Lost** as appropriate.

### Step 5 — Create a New Deal
1. Click the **+ New Deal** button in the top-right.
2. In the modal, fill in:
   - **Deal Title** — Description of the deal (e.g. "Enterprise CRM License — Acme Corp")
   - **Deal Value** — Expected value in ₹
   - **Stage** — Starting stage (usually New)
   - **Linked Lead** — Associate this deal with an existing lead
3. Click **Save Deal**. It appears on the Kanban board.

### Step 6 — Export the Pipeline
1. Click the **Export** button in the header.
2. The current pipeline data is exported for reporting.

### Step 7 — Open a Lead from the Pipeline
1. Click any deal card in the Kanban board.
2. You are taken to the **Profile View** for the linked lead.
3. Review the full activity history, AI summary, and Copilot Insights.

---

## 4.3 Step-by-Step: Using Lead Sources (Webhook Automation Engine)

**Lead Sources** is your automation engine for capturing inbound leads from external marketing channels.

### Step 1 — Open Lead Sources
1. Click **Lead Sources** in the left sidebar.
2. The layout has a tab bar at the top: Connected, Add, Analytics, Automation, Webhooks.

### Step 2 — Review Connected Sources
1. Click the **Connected** tab.
2. Review all active lead sources. Each source shows its name, status (active/inactive), and last received lead timestamp.

### Step 3 — Add a New Lead Source
1. Click **Lead Sources** → **Add** tab, or click the **Add Source** button.
2. The **Add Source Wizard** launches. Follow the steps:
   - **Step 1:** Name your source (e.g. "Facebook Lead Ads", "Website Contact Form")
   - **Step 2:** Select the source type (Webhook, Zapier, etc.)
   - **Step 3:** Copy the generated Webhook URL — this is where your marketing platform will POST lead data
   - **Step 4:** Configure field mapping (map the incoming JSON fields to CRM lead fields)
3. Click **Finish** to activate the source.

### Step 4 — Build Automation Rules
1. Click the **Automation** tab.
2. Click **+ Add Rule** to create a new routing rule.
3. Set the **Condition** (IF logic):
   - Field: `source`, Operator: `equals`, Value: `Facebook`
   - AND Field: `intent`, Operator: `equals`, Value: `High`
4. Set the **Action** (THEN logic):
   - Action: `Assign to User`, Target: Select a specific Sales Representative
5. Click **Save Rule**.
6. Rules are evaluated in order. Place your most specific rules above general "catch-all" rules.

### Step 5 — Monitor Webhook Logs
1. Click the **Webhooks** tab.
2. You see a real-time log of all incoming webhook events.
3. **Green entries** — Successfully ingested leads
4. **Red entries** — Failed payloads (malformed JSON, missing required fields, authentication failure)
5. Click any failed entry to inspect the raw payload and diagnose the issue.
6. Fix the issue on the sending platform (update form fields or authentication) and test again.

### Step 6 — Review Campaign Analytics
1. Click the **Analytics** tab.
2. Compare performance metrics per lead source:
   - Lead volume per source
   - Average AI score per source (which channel sends the highest quality leads)
   - Conversion rate per source
3. Use this to inform your marketing team about which channels are most effective.

---

## 4.4 Step-by-Step: Using Org Settings

### Step 1 — Open Org Settings
1. Click **Org Settings** in the sidebar.

### Step 2 — Manage Organisation Name
1. In the **WORKSPACE DISPLAY NAME** field, type the new company name.
2. Click **Save** when the button appears.

### Step 3 — Share Invite Codes
1. Find the **Workspace Join Code** box.
2. The 6-digit code and a **Copy Link** button are shown.
3. Click **Copy Link** to copy the full registration URL.
4. Share it via email, WhatsApp, or any onboarding communication with new hires.

### Step 4 — Manage Team Invite QR Codes
1. In the **Teams & Squad Ingest** section, find the team you want to share.
2. Click **🔑 Invite Members** — the team's QR code expands.
3. Click **Copy Join Link** to copy the squad-specific registration URL.
4. Share with the specific team members who should join that squad.
5. Click **Manage Members →** to go to Team Management for that squad.

### Step 5 — Change Pipeline Template
1. Scroll to the **Pipeline Template** section at the bottom.
2. Select the appropriate industry template from the dropdown.
3. A warning appears: "⚠ Changing this may affect your existing stage names." Only change this if you are certain.

---

## 4.5 Step-by-Step: Using Billing & Subscription

### Step 1 — Open Billing
1. Click **Billing** in the sidebar, or go to **Org Settings → Billing & Plan** tab.

### Step 2 — Review Your Current Subscription
1. The **Current Plan Card** at the top shows:
   - Plan name (e.g. "Starter", "Professional")
   - Monthly price
   - Next billing date
2. The **AI Processing Credits** quota bar shows how many AI requests have been used vs. your monthly limit.
3. If the bar is > 90% full, upgrade your plan before the reset date to avoid service interruption.

### Step 3 — View Invoice History
1. Scroll to the **Recent Invoices** table.
2. Each row shows: Date, Amount, Status (PAID / UNPAID), and a **Download PDF** button.
3. Click **Download PDF** to download any invoice for accounting records.

### Step 4 — Upgrade Your Plan
1. Click **Upgrade / Manage Plan**.
2. The **Select a Subscription** modal opens.
3. Review the available plans on the left:
   - Compare AI Requests/minute, Voice Transcription, and Integration capabilities.
4. Click the plan you want to select it (highlighted with a purple border).
5. For a custom Enterprise plan:
   - Select the **Enterprise Custom** option on the right.
   - Drag the slider to set your required **AI Requests / Minute** (10–200).
   - Toggle **Voice Transcription Analytics** (+$50/month) on or off.
   - Toggle **Advanced Lead Source Sync** (+$50/month) on or off.
   - The price auto-calculates in real-time.
6. Click **Proceed to Checkout**.

### Step 5 — Complete Payment via Stripe (International)
1. In the Checkout modal, click **Stripe Checkout**.
2. You are redirected to Stripe's secure payment page.
3. Enter your credit/debit card details.
4. Complete the payment.
5. You are redirected back to Dale CRM with your subscription active.

### Step 6 — Complete Payment via Razorpay (India / UPI)
1. In the Checkout modal, click **Razorpay (UPI / India)**.
2. A **UPI QR code** appears with the exact amount in ₹.
3. Open GPay, PhonePe, or Paytm on your phone.
4. Scan the QR code.
5. Confirm the payment amount in your UPI app.
6. Complete the payment.
7. Return to the browser and click **✓ I Have Paid — Verify & Activate**.
8. The system verifies the payment and activates your subscription.

---

## 4.6 Step-by-Step: Using Team Management (Admin Level)

As Admin, you have full control over all squads and all users in the organisation.

### Step 1 — Open Team Management
1. Click **Team Management** in the sidebar.

### Step 2 — Create a New Team
1. Click **+ Create New Team** at the top right.
2. Enter the team name (e.g. "Enterprise Squad", "Inbound Team").
3. Click **Save Team**.
4. The new team card appears in the grid.

### Step 3 — Assign Members to Teams
1. Find the team card you want to add a member to.
2. In the **ASSIGN NEW MEMBER** section at the bottom of the card, click the dropdown.
3. Select the user to add.
4. They are immediately added. Confirm the success toast.

### Step 4 — Remove a Member from a Team
1. In the team card, find the member row.
2. Click **✕ Team** (amber button) to remove them from the squad only.
3. Click **✕ Org** (red button) to remove them from the organisation completely (sign them out and block rejoin via code).
4. Confirm the prompt.

### Step 5 — Delete a Team
1. Find the team card to delete.
2. Click the **Delete** button (trash icon) in the card header.
3. Confirm the deletion. All members are unassigned from the squad but remain in the organisation.

---

## 4.7 Step-by-Step: Using Call Coach as Admin

As Admin, you can review calls from all reps across all teams.

### Step 1 — Open Call Coach
1. Click **Call Coach** in the sidebar.

### Step 2 — Review the Call List
1. Browse all recorded calls in the left panel.
2. Calls are sorted by date. Look for calls with:
   - Low AI Score (< 60) — These reps need coaching
   - Specific signals like "PRICING OBJECTION" or "LOW BUDGET" — These may indicate market resistance

### Step 3 — Identify Coaching Opportunities
1. Click any call to view the full transcript, signal summary, and AI coaching notes.
2. Use the **Areas to Improve** section to plan individual coaching sessions for reps.
3. Note the **Strengths** to acknowledge positive behaviours in team meetings.
4. Click **Share Feedback** to send the coaching report to the representative.

---

## 4.8 Step-by-Step: Using Team Intelligence as Admin

### Step 1 — Open Team Intelligence
1. Click **Team Intelligence** / **Team Reports** in the sidebar.

### Step 2 — Select Reporting Period
1. Use the top-right dropdown: 7 Days, 30 Days, 3 Months, or 12 Months.

### Step 3 — Conduct Monthly Business Review
1. Check **Revenue Won** — compare to your monthly target.
2. Check **Average Win Rate** — compare to the industry benchmark (22%).
3. Review the **Pipeline Distribution Chart** — identify which stages are bottlenecks.
4. Check the **Customer Sentiment Pie Chart** — a rising "Negative" slice signals issues in your pitch or product.

### Step 4 — Cross-Team Comparison
1. In the **Teams Performance Table**, compare all squads side by side.
2. Identify the highest-performing squad and replicate their practices across other teams.
3. Identify the lowest-performing squad and schedule a coaching intervention.

### Step 5 — Individual Performance Review
1. In the **Team Members Progress Table**, review each rep.
2. Sort mentally by **Win Rate** to identify your top 3 and bottom 3 performers.
3. Share individual reports with each rep during 1:1 meetings to set targets for the next period.

---

## 4.9 Step-by-Step: Using Account Settings as Admin

Admin Settings includes exclusive tabs not available to other roles.

### Step 1 — Access Settings
1. Click **Settings** in the sidebar.

### Step 2 — Channels Tab (Admin/Manager Only)
1. Click the **Channels** tab.
2. Review all connected channels: WhatsApp, SMS, Email, Voice Capture.
3. Click **Configure** next to any channel to open its integration settings.
4. Update API keys, phone numbers, or OAuth credentials as needed.

### Step 3 — Org Setup Tab (Admin Only)
1. Click the **Org Setup** tab (only visible to Admin role).
2. Update:
   - **Company Name** — displayed throughout the workspace
   - **Fiscal Year Start** — April (India) or January (international)
   - **Default Currency** — INR (₹) or USD ($)
3. Under **Branding**, click **Upload Logo** to add your company logo to the workspace.
4. Click the save button for each field.

### Step 4 — Security Tab
1. Click the **Security** tab.
2. Use **Change Password** to update your admin password regularly.
3. Enable **Two-Factor Authentication (2FA)** for additional security of the admin account.
4. Use **🚪 Sign Out of All Devices** to immediately invalidate all admin sessions if you suspect a security breach.

---

## 4.10 Step-by-Step: Using Today as Admin

### Step 1 — Open Today
1. Click **Today** in the sidebar.

### Step 2 — Act on Escalated Leads
1. Review the **AI-Driven Action Items** section — these include leads escalated by reps requesting manager help, flagged by the AI, or assigned from automation rules.
2. Click any task to open the lead and take action.

### Step 3 — Run AI Lead Check
1. Click the **⚙️ Lead Check** button.
2. Confirm.
3. The AI scans the entire organisation's pipeline for stagnant leads.
4. A message tells you how many leads were identified and auto-reassigned.
5. Use this weekly to ensure no lead goes cold due to rep inactivity.

---

## 4.11 Quick Reference: Role Permissions Summary

| Feature | Salesperson | Manager | Admin |
|---|:---:|:---:|:---:|
| My Pulse (Personal Dashboard) | ✅ | ✅ | ✅ |
| Lead Pipeline (Own Leads) | ✅ | ✅ | ✅ |
| Lead Pipeline (All Team Leads) | ❌ | ✅ | ✅ |
| AI Distribute Leads | ❌ | ✅ | ✅ |
| Profile View (Lead Details) | ✅ | ✅ | ✅ |
| Global Inbox | ✅ | ✅ | ✅ |
| Today (AI Task List) | ✅ | ✅ | ✅ |
| Lead Check (AI Reassignment) | ❌ | ✅ | ✅ |
| Team Pulse (Manager Dashboard) | ❌ | ✅ | ✅ |
| Pipeline Management (Kanban) | ❌ | ✅ | ✅ |
| Call Coach | ❌ | ✅ | ✅ |
| Team Intelligence (Reports) | ❌ | ✅ | ✅ |
| Team Management | ❌ | ✅ (own squad) | ✅ (all squads) |
| Calendar | ❌ | ✅ | ✅ |
| Lead Sources (Automation) | ❌ | ❌ | ✅ |
| Org Settings | ❌ | ❌ | ✅ |
| Billing & Subscription | ❌ | ❌ | ✅ |
| Forecast | ❌ | ❌ | ✅ |
| Channel Settings (Configure) | ❌ | ✅ | ✅ |
| Org Setup (Branding/Currency) | ❌ | ❌ | ✅ |
| Account Settings (Profile) | ✅ | ✅ | ✅ |
| Account Settings (Security) | ✅ | ✅ | ✅ |
| Help & Support | ✅ | ✅ | ✅ |
| Community & Forums | ✅ | ✅ | ✅ |

---

*End of Documentation — Dale CRM Version 1.0*

*Application URL: [https://dale-crm-version-1.vercel.app](https://dale-crm-version-1.vercel.app)*

*Document prepared for: Salesperson, Manager, and Admin roles.*
