"""
backend/app/routes/chatbot.py
Merged DaleIQ AI Chatbot — now served by the main FastAPI backend.
No need to run chatbot/main.py separately anymore.
"""
import json
import os
import urllib.request
from fastapi import APIRouter, Depends, Request
from fastapi.responses import HTMLResponse
from pydantic import BaseModel
from typing import List, Dict
from sqlalchemy.orm import Session
from app.core.limiter import limiter

from app.core.config import settings
from app.core.database import get_db
from app.core.dependencies import get_current_user, check_ai_quota
from app.models.user import User
from app.services.billing_service import increment_ai_usage

router = APIRouter(prefix="/chatbot", tags=["Chatbot"])

SYSTEM_PROMPT = (
    "You are the DaleIQ Executive Assistant—a world-class sales strategist and product expert.\n"
    "Your mission is to empower salespersons with both platform knowledge and high-level business intelligence.\n\n"
    "--- AREA 1: DALEIQ PLATFORM EXPERTISE ---\n"
    "- Explain features like Global Inbox, Call Coach (AI signals), Revenue Forecast (confidence bands), and Rep Pulse.\n"
    "- Help users navigate the 34 screens of the CRM (e.g., Lead Details, Today's Tasks, Org Setup).\n\n"
    "--- AREA 2: SALES STRATEGY & ADVICE ---\n"
    "- Provide tactics for cold calling, social selling, and email outreach.\n"
    "- Offer frameworks for objection handling (e.g., LAER, BANT, SPIN selling).\n"
    "- Suggest ways to accelerate pipeline velocity and improve win rates.\n\n"
    "--- AREA 3: BUSINESS & MARKET TRENDS ---\n"
    "- Discuss modern B2B/B2C sales trends (AI in sales, consultative selling, remote closing).\n"
    "- Help with industrial terminology, KPI definitions (ACV, LTV, CAC, Churn), and market analysis.\n"
    "- Act as a mentor for career growth and professional sales development.\n\n"
    "GUIDELINES:\n"
    "1. Be professional, data-driven, and highly encouraging.\n"
    "2. If a query is about the app, be specific about the feature.\n"
    "3. If a query is about business/sales, provide actionable strategies.\n"
    "4. Keep responses structured (use bullet points where appropriate)."
)


class ChatRequest(BaseModel):
    message: str
    history: List[Dict[str, str]] = []


from app.services.openai_message_service import _llm_request

@router.post("/chat")
@limiter.limit("20/minute")
async def chat(
    request: Request,
    body: ChatRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    _quota: None = Depends(check_ai_quota),
):
    """Main chat endpoint — receives a message, returns AI response."""
    messages = [{"role": "system", "content": SYSTEM_PROMPT}]
    for msg in body.history:
        messages.append(msg)
    messages.append({"role": "user", "content": body.message})

    body = {
        "model": settings.CHAT_MODEL,
        "messages": messages,
        "temperature": 0.7,
        "max_tokens": 600,
    }

    try:
        response = _llm_request(body, model_override=settings.CHAT_MODEL)
        increment_ai_usage(db, current_user.company_id)
    except Exception as e:
        response = f"I'm having trouble connecting right now. ({str(e)})"

    return {"response": response}


@router.get("/ui", response_class=HTMLResponse)
async def chatbot_ui():
    """Embedded chatbot HTML page — rendered inside the CRM via <iframe>."""
    return """
    <html>
        <head>
            <title>DaleIQ Copilot Assistant</title>
            <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
            <script>
                // Instantly parse parent-injected theme and active primary colors
                const params = new URLSearchParams(window.location.search);
                let theme = params.get('theme') || 'system';
                const primaryColor = params.get('primary') || '#4F46E5';

                // Function to apply theme styles dynamically
                function applyTheme(themeVal, primaryVal) {
                    let resolvedTheme = themeVal;
                    if (themeVal === 'system') {
                        resolvedTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
                    }

                    document.documentElement.className = resolvedTheme;
                    document.documentElement.style.setProperty('--primary', primaryVal);

                    // Parse RGB for custom transparent styling
                    const hex = primaryVal.replace('#', '');
                    const r = parseInt(hex.substring(0, 2), 16);
                    const g = parseInt(hex.substring(2, 4), 16);
                    const b = parseInt(hex.substring(4, 6), 16);
                    document.documentElement.style.setProperty('--primary-rgb', `${r}, ${g}, ${b}`);
                    document.documentElement.style.setProperty('--primary-glow', `rgba(${r}, ${g}, ${b}, ${resolvedTheme === 'dark' ? 0.25 : 0.15})`);
                }

                // Initial load
                applyTheme(theme, primaryColor);

                // Listen for system theme updates
                window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
                    if (theme === 'system') {
                        applyTheme('system', primaryColor);
                    }
                });

                // Listen for dynamic updates from parent CRM
                window.addEventListener('message', (event) => {
                    if (event.data && event.data.type === 'theme-change') {
                        theme = event.data.theme || 'system';
                        const primary = event.data.primary || '#4F46E5';
                        applyTheme(theme, primary);
                    }
                });
            </script>
            <style>
                :root {
                    /* Light Mode default style tokens */
                    --bg-main: #FFFFFF;
                    --bg-subtle: #F8FAFC;
                    --bg-sidebar: #F1F5F9;
                    --bg-input: #FFFFFF;
                    --text-main: #0F172A;
                    --text-muted: #475569;
                    --border: #E2E8F0;
                    --border-subtle: #F1F5F9;
                    --card-hover: rgba(var(--primary-rgb), 0.05);
                    --shadow: 0 4px 12px rgba(0, 0, 0, 0.04);
                    --font-sans: 'Inter', sans-serif;
                }
                
                .dark {
                    /* Dark Mode override style tokens */
                    --bg-main: #1E2128;
                    --bg-subtle: #121417;
                    --bg-sidebar: #1A1D22;
                    --bg-input: #121417;
                    --text-main: #EEEEEE;
                    --text-muted: #9AA0AA;
                    --border: #2D3340;
                    --border-subtle: #252830;
                    --card-hover: rgba(255, 255, 255, 0.04);
                    --shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
                }
                
                * { box-sizing: border-box; margin: 0; padding: 0; }
                body {
                    font-family: var(--font-sans);
                    background-color: var(--bg-subtle);
                    color: var(--text-main);
                    height: 100vh;
                    width: 100vw;
                    display: flex;
                    overflow: hidden;
                    transition: background-color 0.2s ease, color 0.2s ease;
                }
                
                /* Sidebar Container */
                #sidebar {
                    width: 260px;
                    background-color: var(--bg-sidebar);
                    border-right: 1px solid var(--border);
                    display: flex;
                    flex-direction: column;
                    padding: 16px 12px;
                    flex-shrink: 0;
                    transition: all 0.2s ease;
                }
                .new-chat-btn {
                    width: 100%;
                    background: var(--bg-main);
                    border: 1px solid var(--border);
                    color: var(--text-main);
                    border-radius: 10px;
                    padding: 12px 16px;
                    font-size: 14px;
                    font-weight: 600;
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    cursor: pointer;
                    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
                    margin-bottom: 20px;
                    box-shadow: var(--shadow);
                }
                .new-chat-btn:hover {
                    background-color: var(--card-hover);
                    border-color: var(--primary);
                    transform: translateY(-1px);
                    box-shadow: 0 4px 12px var(--primary-glow);
                }
                .sidebar-section-title {
                    font-size: 11px;
                    font-weight: 800;
                    color: var(--text-muted);
                    text-transform: uppercase;
                    letter-spacing: 0.08em;
                    margin-bottom: 10px;
                    padding-left: 8px;
                }
                .preset-list {
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                    gap: 6px;
                    overflow-y: auto;
                }
                .preset-item {
                    width: 100%;
                    background: transparent;
                    border: none;
                    color: var(--text-muted);
                    font-size: 13px;
                    font-weight: 500;
                    padding: 10px 12px;
                    border-radius: 8px;
                    text-align: left;
                    cursor: pointer;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    transition: all 0.2s;
                    display: flex;
                    align-items: center;
                    gap: 10px;
                }
                .preset-item:hover {
                    background-color: var(--card-hover);
                    color: var(--text-main);
                    padding-left: 16px;
                }
                
                /* Sidebar Footer */
                .sidebar-footer {
                    border-top: 1px solid var(--border);
                    padding-top: 14px;
                    margin-top: 12px;
                    display: flex;
                    flex-direction: column;
                    gap: 10px;
                }
                .close-btn-sidebar {
                    width: 100%;
                    background: var(--bg-main);
                    border: 1px solid var(--border);
                    color: var(--text-main);
                    padding: 10px;
                    border-radius: 8px;
                    font-size: 13px;
                    font-weight: 700;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 8px;
                    transition: all 0.2s;
                    box-shadow: var(--shadow);
                }
                .close-btn-sidebar:hover {
                    background: var(--primary);
                    color: white;
                    border-color: var(--primary);
                    box-shadow: 0 4px 12px var(--primary-glow);
                }
                
                /* Main Chat Panel */
                #main-panel {
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                    height: 100%;
                    overflow: hidden;
                    position: relative;
                    background-color: var(--bg-subtle);
                }
                
                /* Header */
                #header {
                    height: 60px;
                    border-bottom: 1px solid var(--border);
                    padding: 0 24px;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    background-color: var(--bg-main);
                    backdrop-filter: blur(8px);
                    z-index: 10;
                    box-shadow: var(--shadow);
                }
                .header-title {
                    font-weight: 800;
                    font-size: 15px;
                    letter-spacing: -0.01em;
                    color: var(--text-main);
                }
                .controls {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                }
                .speed-label {
                    font-size: 10px;
                    font-weight: 900;
                    color: var(--text-muted);
                    letter-spacing: 0.05em;
                }
                #speedControl {
                    -webkit-appearance: none;
                    appearance: none;
                    width: 80px;
                    height: 5px;
                    border-radius: 3px;
                    background: var(--border);
                    outline: none;
                    accent-color: var(--primary);
                    cursor: pointer;
                }
                #speedControl::-webkit-slider-thumb {
                    -webkit-appearance: none;
                    appearance: none;
                    width: 12px;
                    height: 12px;
                    border-radius: 50%;
                    background: var(--primary);
                    cursor: pointer;
                    transition: transform 0.1s ease;
                }
                #speedControl::-webkit-slider-thumb:hover {
                    transform: scale(1.2);
                }
                
                /* Message Area */
                #messages-container {
                    flex: 1;
                    overflow-y: auto;
                    padding-bottom: 140px; /* Space for bottom input */
                }
                #messages {
                    max-width: 768px;
                    margin: 0 auto;
                    width: 100%;
                    padding: 30px 20px 0;
                    display: flex;
                    flex-direction: column;
                    gap: 20px;
                }
                
                /* Rounded Glassmorphic Message Bubbles */
                .msg-row {
                    display: flex;
                    gap: 12px;
                    width: 100%;
                    animation: fadeInUp 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
                }
                .msg-row.user-row {
                    justify-content: flex-end;
                }
                @keyframes fadeInUp {
                    from { opacity: 0; transform: translateY(12px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .avatar {
                    width: 32px;
                    height: 32px;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-weight: 850;
                    font-size: 11px;
                    color: white;
                    flex-shrink: 0;
                    box-shadow: var(--shadow);
                }
                .avatar.user-avatar {
                    background: linear-gradient(135deg, var(--primary) 0%, rgba(var(--primary-rgb), 0.8) 100%);
                }
                .avatar.bot-avatar {
                    background: linear-gradient(135deg, #10B981 0%, #059669 100%);
                    box-shadow: 0 0 10px rgba(16, 185, 129, 0.2);
                }
                .msg-content-wrapper {
                    display: flex;
                    flex-direction: column;
                    gap: 4px;
                }
                .user-wrapper {
                    align-items: flex-end;
                    max-width: 75%;
                }
                .bot-wrapper {
                    align-items: flex-start;
                    max-width: 75%;
                }
                .sender-name {
                    font-size: 10.5px;
                    font-weight: 800;
                    color: var(--text-muted);
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                    margin-left: 2px;
                }
                .msg-bubble {
                    font-size: 14px;
                    line-height: 1.6;
                    padding: 12px 16px;
                    border-radius: 16px;
                    box-shadow: var(--shadow);
                    word-break: break-word;
                }
                .user-bubble {
                    background: var(--primary);
                    color: #FFFFFF;
                    border-bottom-right-radius: 4px;
                    font-weight: 500;
                }
                .bot-bubble {
                    background: var(--bg-main);
                    color: var(--text-main);
                    border-bottom-left-radius: 4px;
                    border: 1px solid var(--border);
                }
                
                /* Markdown inner element styling */
                .msg-bubble p {
                    margin-bottom: 8px;
                }
                .msg-bubble p:last-child {
                    margin-bottom: 0;
                }
                .msg-bubble ul, .msg-bubble ol {
                    margin-left: 20px;
                    margin-bottom: 8px;
                }
                .msg-bubble li {
                    margin-bottom: 4px;
                }
                .msg-bubble strong {
                    font-weight: 700;
                    color: inherit;
                }
                
                .action-row {
                    display: flex;
                    gap: 8px;
                    margin-top: 4px;
                    margin-left: 2px;
                }
                .action-btn {
                    background: transparent;
                    border: none;
                    cursor: pointer;
                    color: var(--text-muted);
                    transition: all 0.2s;
                    display: flex;
                    align-items: center;
                    gap: 4px;
                    font-size: 10px;
                    font-weight: 700;
                    border-radius: 6px;
                    padding: 4px 8px;
                    border: 1px solid transparent;
                }
                .action-btn:hover {
                    color: var(--primary);
                    background-color: var(--bg-main);
                    border-color: var(--border);
                }
                
                /* Welcome Dashboard */
                #welcome-dashboard {
                    max-width: 680px;
                    margin: 60px auto 0;
                    padding: 0 20px;
                    text-align: center;
                    animation: fadeIn 0.4s ease-out;
                }
                .welcome-logo {
                    width: 52px;
                    height: 52px;
                    border-radius: 14px;
                    background: var(--primary);
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    margin-bottom: 16px;
                    box-shadow: 0 8px 24px var(--primary-glow);
                    animation: floatPulse 3s infinite ease-in-out;
                }
                @keyframes floatPulse {
                    0%, 100% { transform: translateY(0) scale(1); box-shadow: 0 8px 24px var(--primary-glow); }
                    50% { transform: translateY(-4px) scale(1.03); box-shadow: 0 12px 30px var(--primary-glow); }
                }
                .welcome-title {
                    font-size: 22px;
                    font-weight: 800;
                    color: var(--text-main);
                    margin-bottom: 6px;
                    letter-spacing: -0.02em;
                }
                .welcome-subtitle {
                    font-size: 13.5px;
                    color: var(--text-muted);
                    margin-bottom: 32px;
                    font-weight: 500;
                }
                .grid-container {
                    display: grid;
                    grid-template-columns: repeat(2, 1fr);
                    gap: 12px;
                }
                .suggestion-card {
                    background: var(--bg-main);
                    border: 1px solid var(--border);
                    border-radius: 12px;
                    padding: 14px 16px;
                    text-align: left;
                    cursor: pointer;
                    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
                    box-shadow: var(--shadow);
                    position: relative;
                    overflow: hidden;
                }
                .suggestion-card::before {
                    content: '';
                    position: absolute;
                    left: 0;
                    top: 0;
                    bottom: 0;
                    width: 3px;
                    background: var(--primary);
                    transform: scaleY(0);
                    transition: transform 0.2s ease;
                }
                .suggestion-card:hover {
                    background: var(--card-hover);
                    border-color: var(--primary);
                    transform: translateY(-2px);
                    box-shadow: 0 6px 20px var(--primary-glow);
                }
                .suggestion-card:hover::before {
                    transform: scaleY(1);
                }
                .card-title {
                    font-size: 13px;
                    font-weight: 700;
                    color: var(--text-main);
                    margin-bottom: 4px;
                }
                .card-desc {
                    font-size: 11.5px;
                    color: var(--text-muted);
                    line-height: 1.45;
                }
                
                /* Bottom Input Area */
                #input-area-container {
                    position: absolute;
                    bottom: 0;
                    left: 0;
                    right: 0;
                    background: linear-gradient(180deg, transparent 0%, var(--bg-subtle) 40%);
                    padding: 20px 24px 16px;
                }
                #input-pill {
                    max-width: 768px;
                    margin: 0 auto;
                    width: 100%;
                    background-color: var(--bg-input);
                    border: 1px solid var(--border);
                    border-radius: 24px;
                    display: flex;
                    align-items: center;
                    padding: 6px 8px;
                    box-shadow: var(--shadow);
                    transition: border-color 0.2s, box-shadow 0.2s;
                }
                #input-pill:focus-within {
                    border-color: var(--primary);
                    box-shadow: 0 0 0 3px var(--primary-glow);
                }
                input {
                    flex: 1;
                    background: transparent;
                    border: none;
                    outline: none;
                    color: var(--text-main);
                    font-size: 14px;
                    padding: 8px 12px;
                    font-weight: 500;
                }
                input::placeholder { color: #8E9AA8; }
                
                .icon-btn {
                    width: 34px;
                    height: 34px;
                    border-radius: 50%;
                    border: none;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    transition: all 0.2s;
                    flex-shrink: 0;
                }
                .mic-btn {
                    background: transparent;
                    color: var(--text-muted);
                }
                .mic-btn:hover {
                    color: var(--text-main);
                    background-color: var(--border-subtle);
                }
                .mic-btn.active {
                    background-color: #EF4444;
                    color: white;
                    animation: pulse 1.5s infinite;
                }
                .send-btn {
                    background-color: var(--primary);
                    color: white;
                }
                .send-btn:hover {
                    opacity: 0.95;
                    transform: scale(1.05);
                }
                
                .disclaimer {
                    text-align: center;
                    font-size: 11px;
                    color: var(--text-muted);
                    margin-top: 8px;
                    font-weight: 500;
                }
                
                @keyframes pulse { 0% { opacity: 1; } 50% { opacity: 0.6; } 100% { opacity: 1; } }
                @keyframes fadeIn { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
                
                /* Custom Scrollbar */
                #messages-container::-webkit-scrollbar, .preset-list::-webkit-scrollbar { width: 6px; }
                #messages-container::-webkit-scrollbar-track, .preset-list::-webkit-scrollbar-track { background: transparent; }
                #messages-container::-webkit-scrollbar-thumb, .preset-list::-webkit-scrollbar-thumb { background: var(--border); border-radius: 3px; }
                #messages-container::-webkit-scrollbar-thumb:hover, .preset-list::-webkit-scrollbar-thumb:hover { background: var(--text-muted); }
            </style>
        </head>
        <body>
            <!-- Sidebar -->
            <div id="sidebar">
                <button class="new-chat-btn" onclick="clearConversation()">
                    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4"/></svg>
                    New Chat
                </button>
                
                <div class="sidebar-section-title">SUGGESTED DISCUSSIONS</div>
                <div class="preset-list">
                    <button class="preset-item" onclick="sendMessage('How to log inbound calls?')">💬 Logging inbound calls</button>
                    <button class="preset-item" onclick="sendMessage('Explain Objection Handling LAER framework')">💬 Objection handling LAER</button>
                    <button class="preset-item" onclick="sendMessage('What are Call Coach AI signals?')">💬 Call Coach AI signals</button>
                    <button class="preset-item" onclick="sendMessage('Explain win probabilities')">💬 Win probability modeling</button>
                    <button class="preset-item" onclick="sendMessage('Tactic to re-engage stagnant deals')">💬 Re-engaging stagnant deals</button>
                </div>
                
                <div class="sidebar-footer">
                    <button class="close-btn-sidebar" onclick="window.parent.postMessage('closeChat', '*')">
                        <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18"/></svg>
                        Close & Exit
                    </button>
                </div>
            </div>
            
            <!-- Main Content Pane -->
            <div id="main-panel">
                <div id="header">
                    <div style="display: flex; align-items: center; gap: 12px;">
                        <div class="header-title">DaleIQ Copilot Assistant</div>
                    </div>
                    <div class="controls">
                        <span class="speed-label">VOICE TIMBRE</span>
                        <input type="range" id="speedControl" min="0.5" max="2" step="0.25" value="1" oninput="updateSpeedLabel(this.value)">
                        <span id="speedVal" style="font-size: 11px; font-weight: 800; color: var(--text-main); width: 28px;">1x</span>
                    </div>
                </div>
                
                <div id="messages-container">
                    <!-- Default Suggestion Cards -->
                    <div id="welcome-dashboard">
                        <div class="welcome-logo">
                            <svg width="24" height="24" fill="none" viewBox="0 0 24 24"><path d="M12 2L3 7v10l9 5 9-5V7L12 2z" fill="white" opacity="0.95"/></svg>
                        </div>
                        <div class="welcome-title">How can I help you today?</div>
                        <div class="welcome-subtitle">Ask your platform strategy guide about DaleIQ insights or outreach methodologies.</div>
                        
                        <div class="grid-container">
                            <div class="suggestion-card" onclick="sendMessage('Objection Handling SPIN Selling')">
                                <div class="card-title">SPIN Framework</div>
                                <div class="card-desc">Tackle sales bottlenecks using structured consultative questions.</div>
                            </div>
                            <div class="suggestion-card" onclick="sendMessage('Explain Revenue Forecast confidence bands')">
                                <div class="card-title">Forecast Bands</div>
                                <div class="card-desc">Learn how confidence bands project quarterly wins.</div>
                            </div>
                            <div class="suggestion-card" onclick="sendMessage('Tactics for Social Selling & Cold Calls')">
                                <div class="card-title">Cold Outreach</div>
                                <div class="card-desc">Slick opening scripts to keep leads hooked.</div>
                            </div>
                            <div class="suggestion-card" onclick="sendMessage('Explain Global Inbox features')">
                                <div class="card-title">Global Inbox Guide</div>
                                <div class="card-desc">Integrate multiple communication streams in one timeline.</div>
                            </div>
                        </div>
                    </div>
                    
                    <div id="messages" style="display:none;"></div>
                </div>
                
                <div id="input-area-container">
                    <div id="input-pill">
                        <button id="micBtn" class="icon-btn mic-btn" onclick="toggleRecord()" title="Voice Input">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>
                        </button>
                        <input type="text" id="userInput" placeholder="Ask DaleIQ Assistant..." onkeypress="if(event.key==='Enter') triggerSend()">
                        <button class="icon-btn send-btn" onclick="triggerSend()">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
                        </button>
                    </div>
                    <div class="disclaimer">DaleIQ Assistant can make mistakes. Double check critical pipeline configurations.</div>
                </div>
            </div>
            
            <script>
                const history = [];
                let lastUserMessage = "";
                const synth = window.speechSynthesis;
                const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
                let recognition, isRecording = false, currentPlaybackSpeed = 1.0;
 
                if (SpeechRecognition) {
                    recognition = new SpeechRecognition();
                    recognition.continuous = false;
                    recognition.lang = 'en-US';
                    recognition.onresult = (e) => {
                        document.getElementById('userInput').value = e.results[0][0].transcript;
                        toggleRecord();
                        triggerSend();
                    };
                    recognition.onerror = () => toggleRecord();
                }
 
                function updateSpeedLabel(val) {
                    currentPlaybackSpeed = parseFloat(val);
                    document.getElementById('speedVal').innerText = val + 'x';
                }
                function stopSpeech() {
                    synth.cancel();
                }
                function toggleRecord() {
                    const btn = document.getElementById('micBtn');
                    if (!recognition) return;
                    if (isRecording) {
                        recognition.stop();
                        btn.classList.remove('active');
                        isRecording = false;
                    } else {
                        recognition.start();
                        btn.classList.add('active');
                        isRecording = true;
                    }
                }
                
                function clearConversation() {
                    history.length = 0;
                    document.getElementById('messages').innerHTML = '';
                    document.getElementById('messages').style.display = 'none';
                    document.getElementById('welcome-dashboard').style.display = 'block';
                    stopSpeech();
                }
 
                function triggerSend() {
                    const input = document.getElementById('userInput');
                    const val = input.value.trim();
                    if (!val) return;
                    sendMessage(val);
                    input.value = '';
                }
 
                async function sendMessage(text) {
                    if (!text) return;
                    
                    // Hide welcome dashboard and show conversation messages list
                    document.getElementById('welcome-dashboard').style.display = 'none';
                    document.getElementById('messages').style.display = 'flex';
                    
                    appendMessage('user', text);
                    lastUserMessage = text;
                    
                    // Add loading skeleton bubble
                    const loadingId = appendLoadingBubble();
                    
                    try {
                        const token = sessionStorage.getItem('voiceiq_token') || localStorage.getItem('voiceiq_token');
                        const headers = { 'Content-Type': 'application/json' };
                        if (token) {
                            headers['Authorization'] = 'Bearer ' + token;
                        }
                        const response = await fetch('/api/chatbot/chat', {
                            method: 'POST',
                            headers: headers,
                            body: JSON.stringify({ message: text, history })
                        });
                        const data = await response.json();
                        
                        removeLoadingBubble(loadingId);
                        appendMessage('bot', data.response);
                        
                        history.push({ role: 'user', content: text });
                        history.push({ role: 'assistant', content: data.response });
                    } catch (err) {
                        removeLoadingBubble(loadingId);
                        appendMessage('bot', "I had trouble connecting to the intelligence server. Let me retry.");
                    }
                }
 
                function appendLoadingBubble() {
                    const container = document.getElementById('messages');
                    const row = document.createElement('div');
                    const id = 'loading_' + Date.now();
                    row.id = id;
                    row.className = 'msg-row bot-row';
                    row.innerHTML = `
                        <div class="avatar bot-avatar">AI</div>
                        <div class="msg-content-wrapper bot-wrapper">
                            <div class="sender-name">DaleIQ</div>
                            <div class="msg-bubble bot-bubble" style="display: flex; align-items: center; gap: 4px; padding: 12px 20px;">
                                <div style="width: 6px; height: 6px; border-radius: 50%; background: var(--text-muted); animation: bounce 1.4s infinite ease-in-out both;"></div>
                                <div style="width: 6px; height: 6px; border-radius: 50%; background: var(--text-muted); animation: bounce 1.4s infinite ease-in-out both; animation-delay: 0.2s;"></div>
                                <div style="width: 6px; height: 6px; border-radius: 50%; background: var(--text-muted); animation: bounce 1.4s infinite ease-in-out both; animation-delay: 0.4s;"></div>
                            </div>
                        </div>
                    `;
                    container.appendChild(row);
                    const wrapper = document.getElementById('messages-container');
                    wrapper.scrollTop = wrapper.scrollHeight;
                    return id;
                }
 
                function removeLoadingBubble(id) {
                    const el = document.getElementById(id);
                    if (el) el.remove();
                }

                function formatMarkdown(text) {
                    if (!text) return "";
                    let html = text;
                    
                    // Convert literal \\n and \\n\\n to HTML breaks
                    html = html.replace(/\\\\n\\\\n/g, '\\n\\n').replace(/\\\\n/g, '\\n');
                    
                    // Convert bold: **text** -> <strong>text</strong>
                    html = html.replace(/\\*\\*([^*]+)\\*\\*/g, '<strong>$1</strong>');
                    
                    // Convert italic: *text* -> <em>text</em>
                    html = html.replace(/\\*([^*]+)\\*/g, '<em>$1</em>');
                    
                    // Convert inline code: `code` -> <code>code</code>
                    html = html.replace(/`([^`]+)`/g, '<code style="background: var(--border-subtle); padding: 2px 6px; border-radius: 4px; font-family: monospace; font-size: 0.9em; border: 1px solid var(--border);">$1</code>');
                    
                    // Process lists line by line
                    let lines = html.split('\\n');
                    let inList = false;
                    let listType = null; // 'ul' or 'ol'
                    let processedLines = [];
                    
                    for (let line of lines) {
                        let trimmed = line.trim();
                        if (trimmed.startsWith('- ') || trimmed.startsWith('* ') || trimmed.startsWith('• ')) {
                            if (!inList || listType !== 'ul') {
                                if (inList) processedLines.push(listType === 'ul' ? '</ul>' : '</ol>');
                                inList = true;
                                listType = 'ul';
                                processedLines.push('<ul style="margin-left: 20px; margin-bottom: 8px; list-style-type: disc;">');
                            }
                            let content = trimmed.replace(/^[-*•]\\s+/, '');
                            processedLines.push(`<li style="margin-bottom: 4px;">${content}</li>`);
                        } else if (/^\\d+\\.\\s+/.test(trimmed)) {
                            if (!inList || listType !== 'ol') {
                                if (inList) processedLines.push(listType === 'ul' ? '</ul>' : '</ol>');
                                inList = true;
                                listType = 'ol';
                                processedLines.push('<ol style="margin-left: 20px; margin-bottom: 8px; list-style-type: decimal;">');
                            }
                            let content = trimmed.replace(/^\\d+\\.\\s+/, '');
                            processedLines.push(`<li style="margin-bottom: 4px;">${content}</li>`);
                        } else {
                            if (inList) {
                                processedLines.push(listType === 'ul' ? '</ul>' : '</ol>');
                                inList = false;
                                listType = null;
                            }
                            if (trimmed) {
                                processedLines.push(`<p style="margin-bottom: 8px; line-height: 1.6;">${line}</p>`);
                            } else {
                                processedLines.push('<div style="height: 6px;"></div>');
                            }
                        }
                    }
                    if (inList) {
                        processedLines.push(listType === 'ul' ? '</ul>' : '</ol>');
                    }
                    
                    return processedLines.join('\\n');
                }
 
                function appendMessage(role, text) {
                    const container = document.getElementById('messages');
                    const row = document.createElement('div');
                    row.className = `msg-row ${role}-row`;
                    
                    const avatarLabel = role === 'user' ? 'ME' : 'AI';
                    const avatarClass = role === 'user' ? 'user-avatar' : 'bot-avatar';
                    const senderLabel = role === 'user' ? 'You' : 'DaleIQ';
                    
                    const formattedText = formatMarkdown(text);
                    
                    if (role === 'user') {
                        row.innerHTML = `
                            <div class="msg-content-wrapper user-wrapper">
                                <div class="msg-bubble user-bubble">${formattedText}</div>
                            </div>
                            <div class="avatar ${avatarClass}">${avatarLabel}</div>
                        `;
                    } else {
                        row.innerHTML = `
                            <div class="avatar ${avatarClass}">${avatarLabel}</div>
                            <div class="msg-content-wrapper bot-wrapper">
                                <div class="sender-name">${senderLabel}</div>
                                <div class="msg-bubble bot-bubble">${formattedText}</div>
                            </div>
                        `;
                    }
                    
                    if (role === 'bot') {
                        const contentArea = row.querySelector('.msg-content-wrapper');
                        const actionRow = document.createElement('div');
                        actionRow.className = 'action-row';
                        actionRow.innerHTML = `
                            <button class="action-btn" onclick="speak(this.closest('.msg-content-wrapper').querySelector('.msg-bubble').innerText)">🔊 LISTEN</button>
                            <button class="action-btn" onclick="stopSpeech()">⏹ STOP</button>
                            <button class="action-btn" onclick="sendMessage('${lastUserMessage.replace(/'/g,"\\\\'")}')">🔄 RETRY</button>`;
                        contentArea.appendChild(actionRow);
                    }
                    
                    container.appendChild(row);
                    const wrapper = document.getElementById('messages-container');
                    wrapper.scrollTop = wrapper.scrollHeight;
                }
 
                function speak(text) {
                    stopSpeech();
                    const utter = new SpeechSynthesisUtterance(text);
                    utter.rate = currentPlaybackSpeed;
                    synth.speak(utter);
                }
            </script>
            <style>
                @keyframes bounce {
                    0%, 80%, 100% { transform: scale(0); opacity: 0.3; }
                    40% { transform: scale(1); opacity: 1; }
                }
            </style>
        </body>
    </html>
    """
