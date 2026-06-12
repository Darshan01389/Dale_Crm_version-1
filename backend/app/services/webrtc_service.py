import json
import logging
from typing import Dict
from fastapi import WebSocket

logger = logging.getLogger(__name__)

class WebRTCManager:
    def __init__(self):
        # Maps user_id -> WebSocket connection
        self.active_connections: Dict[str, WebSocket] = {}
        
    async def connect(self, websocket: WebSocket, user_id: str):
        await websocket.accept()
        self.active_connections[user_id] = websocket
        logger.info(f"WebRTC client connected: {user_id}")
        
    def disconnect(self, user_id: str):
        if user_id in self.active_connections:
            del self.active_connections[user_id]
            logger.info(f"WebRTC client disconnected: {user_id}")
            
    async def send_message(self, user_id: str, message: dict):
        if user_id in self.active_connections:
            await self.active_connections[user_id].send_json(message)

    async def broadcast(self, message: dict):
        for connection in self.active_connections.values():
            await connection.send_json(message)

webrtc_manager = WebRTCManager()

async def handle_webrtc_message(user_id: str, data: dict):
    """
    Handles incoming signaling messages from the browser (SDP offers/answers, ICE candidates).
    In a real PBX scenario, these would be translated to SIP via the sip_connector.
    For now, we act as a simple echo/loopback signaling server to simulate a connected call.
    """
    msg_type = data.get("type")
    
    if msg_type == "offer":
        # Simulate answering the call immediately (loopback)
        logger.info(f"Received SDP offer from {user_id}, generating mock answer...")
        # In a real app, sip_connector.handle_offer(data["sdp"]) goes here
        await webrtc_manager.send_message(user_id, {
            "type": "answer",
            "sdp": data.get("sdp") # Echoing back the SDP just as a placeholder
        })
    elif msg_type == "candidate":
        # Handle ICE candidates
        pass
    elif msg_type == "hangup":
        logger.info(f"User {user_id} hung up the call.")
