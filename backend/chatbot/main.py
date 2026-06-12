from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Dict
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse
from bot import DaleIQChatbot

app = FastAPI(title="DaleIQ Chatbot Test Server")

# Enable CORS for frontend testing
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

bot = DaleIQChatbot()

class ChatRequest(BaseModel):
    message: str
    history: List[Dict[str, str]] = []

@app.get("/", response_class=HTMLResponse)
def get_test_ui():
    return """
    <html>
        <head>
            <title>DaleIQ Voice Assistant Pro</title>
            <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
            <style>
                :root { --primary: #1F4E79; --bg: #F8FAFC; --accent: #10B981; }
                body { font-family: 'Inter', sans-serif; background: var(--bg); display: flex; flex-direction: column; align-items: center; padding: 40px; margin: 0; }
                #chatbox { width: 550px; height: 750px; background: white; border-radius: 24px; box-shadow: 0 20px 50px rgba(0,0,0,0.1); display: flex; flex-direction: column; overflow: hidden; border: 1px solid #E2E8F0; }
                
                /* Header Controls */
                #header { padding: 20px 25px; border-bottom: 1px solid #E2E8F0; display: flex; justify-content: space-between; align-items: center; background: white; }
                .controls { display: flex; align-items: center; gap: 15px; }
                .speed-label { font-size: 11px; font-weight: 800; color: #64748B; letter-spacing: 0.05em; }
                #speedControl { cursor: pointer; }
                
                #messages { flex: 1; padding: 25px; overflow-y: auto; display: flex; flex-direction: column; gap: 18px; scroll-behavior: smooth; }
                .msg-wrapper { display: flex; flex-direction: column; gap: 6px; max-width: 85%; }
                .msg { padding: 14px 20px; border-radius: 20px; font-size: 14px; line-height: 1.6; }
                .user-wrapper { align-self: flex-end; }
                .user { background: var(--primary); color: white; border-radius: 20px 20px 0 20px; }
                .bot-wrapper { align-self: flex-start; }
                .bot { background: #F1F5F9; color: #0F172A; border-radius: 20px 20px 20px 0; }
                
                /* Action Row */
                .action-row { display: flex; gap: 12px; margin-top: 4px; }
                .action-btn { 
                    background: none; border: none; cursor: pointer; padding: 4px 8px; 
                    color: #94A3B8; transition: all 0.2s; display: flex; align-items: center; gap: 6px;
                    font-size: 11px; font-weight: 700; border-radius: 6px;
                }
                .action-btn:hover { color: var(--primary); background: #F1F5F9; }
                .action-btn.stop:hover { color: #EF4444; }
                .action-btn.retry:hover { color: var(--accent); }

                #input-area { padding: 20px 25px; border-top: 1px solid #E2E8F0; display: flex; gap: 12px; align-items: center; background: white; }
                input { flex: 1; padding: 14px 18px; border: 1.5px solid #E2E8F0; border-radius: 14px; outline: none; font-size: 14px; transition: border-color 0.2s; }
                input:focus { border-color: var(--primary); }
                .icon-btn { 
                    width: 48px; height: 48px; border-radius: 14px; border: none; 
                    display: flex; align-items: center; justify-content: center; cursor: pointer; 
                    transition: all 0.2s; flex-shrink: 0;
                }
                .mic-btn { background: #F1F5F9; color: #475569; }
                .mic-btn.active { background: #EF4444; color: white; animation: pulse 1.5s infinite; }
                .send-btn { background: var(--primary); color: white; }
                
                @keyframes pulse { 0% { opacity: 1; } 50% { opacity: 0.6; } 100% { opacity: 1; } }
            </style>
        </head>
        <body>
            <div id="chatbox">
                <div id="header">
                    <div style="display: flex; align-items: center; gap: 12px;">
                        <button onclick="window.parent.postMessage('closeChat', '*')" style="background: none; border: none; cursor: pointer; color: var(--primary); padding: 0; display: flex; align-items: center;">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
                        </button>
                        <div style="font-weight: 800; color: var(--primary); font-size: 16px;">DaleIQ Pro</div>
                    </div>
                    <div class="controls">
                        <span class="speed-label">SPEED</span>
                        <input type="range" id="speedControl" min="0.5" max="2" step="0.25" value="1" oninput="updateSpeedLabel(this.value)">
                        <span id="speedVal" style="font-size: 11px; font-weight: 800; color: var(--primary); width: 30px;">1x</span>
                    </div>
                </div>
                <div id="messages">
                    <div class="msg-wrapper bot-wrapper">
                        <div class="msg bot">Hello! I am your DaleIQ executive assistant. You can speak to me or type. Try adjusting my speech speed!</div>
                        <div class="action-row">
                            <button class="action-btn" onclick="speak(this.closest('.bot-wrapper').querySelector('.bot').innerText)">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M11 5L6 9H2v6h4l5 4V5zM15.54 8.46a5 5 0 0 1 0 7.07M19.07 4.93a10 10 0 0 1 0 14.14"/></svg>
                                LISTEN
                            </button>
                            <button class="action-btn stop" onclick="stopSpeech()">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/></svg>
                                STOP
                            </button>
                        </div>
                    </div>
                </div>
                <div id="input-area">
                    <button id="micBtn" class="icon-btn mic-btn" onclick="toggleRecord()" title="Voice Search">
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>
                    </button>
                    <input type="text" id="userInput" placeholder="Ask anything..." onkeypress="if(event.key==='Enter') sendMessage()">
                    <button class="icon-btn send-btn" onclick="sendMessage()">
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
                    </button>
                </div>
            </div>
            <script>
                const history = [];
                let lastUserMessage = "";
                const synth = window.speechSynthesis;
                const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
                let recognition;
                let isRecording = false;
                let currentPlaybackSpeed = 1.0;

                if (SpeechRecognition) {
                    recognition = new SpeechRecognition();
                    recognition.continuous = false;
                    recognition.lang = 'en-US';
                    recognition.onresult = (event) => {
                        const transcript = event.results[0][0].transcript;
                        document.getElementById('userInput').value = transcript;
                        toggleRecord();
                        sendMessage();
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
                    if (!recognition) return alert('Voice not supported.');
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

                async function sendMessage(textOverride = null) {
                    const input = document.getElementById('userInput');
                    const text = textOverride || input.value.trim();
                    if(!text) return;
                    
                    if (!textOverride) {
                        appendMessage('user', text);
                        lastUserMessage = text;
                    }
                    input.value = '';
                    
                    // Show typing indicator or something? 
                    const response = await fetch('/chat', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ message: text, history: history })
                    });
                    const data = await response.json();
                    appendMessage('bot', data.response);
                    
                    if (!textOverride) history.push({ role: 'user', content: text });
                    history.push({ role: 'assistant', content: data.response });
                }

                function appendMessage(role, text) {
                    const container = document.getElementById('messages');
                    const wrapper = document.createElement('div');
                    wrapper.className = `msg-wrapper ${role}-wrapper`;
                    
                    const msgDiv = document.createElement('div');
                    msgDiv.className = `msg ${role}`;
                    msgDiv.innerText = text;
                    wrapper.appendChild(msgDiv);

                    if (role === 'bot') {
                        const actionRow = document.createElement('div');
                        actionRow.className = 'action-row';
                        
                        actionRow.innerHTML = `
                            <button class="action-btn" onclick="speak(this.closest('.bot-wrapper').querySelector('.bot').innerText)">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M11 5L6 9H2v6h4l5 4V5zM15.54 8.46a5 5 0 0 1 0 7.07M19.07 4.93a10 10 0 0 1 0 14.14"/></svg>
                                LISTEN
                            </button>
                            <button class="action-btn stop" onclick="stopSpeech()">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/></svg>
                                STOP
                            </button>
                            <button class="action-btn retry" onclick="tryAgain()">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>
                                TRY AGAIN
                            </button>
                        `;
                        wrapper.appendChild(actionRow);
                    }

                    container.appendChild(wrapper);
                    container.scrollTop = container.scrollHeight;
                }

                function tryAgain() {
                    if (lastUserMessage) {
                        sendMessage(lastUserMessage);
                    }
                }

                function speak(text) {
                    stopSpeech();
                    const utter = new SpeechSynthesisUtterance(text);
                    utter.rate = currentPlaybackSpeed;
                    utter.pitch = 1.0;
                    synth.speak(utter);
                }
            </script>
        </body>
    </html>
    """

@app.post("/chat")
async def chat(request: ChatRequest):
    response = bot.get_response(request.message, request.history)
    return {"response": response}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8002)
