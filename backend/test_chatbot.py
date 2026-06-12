import sys
import os
import asyncio

sys.path.insert(0, os.path.abspath("."))

from app.routes.ai import chat_with_assistant, ChatRequest

async def run_chatbot_test():
    print("Testing Chatbot...")
    try:
        req = ChatRequest(
            message="Hi, what can you do?",
            history=[]
        )
        response = await chat_with_assistant(req)
        print("Success! Chatbot Reply:\n", response)
    except Exception as e:
        print("Failed Chatbot Test:", e)

if __name__ == "__main__":
    asyncio.run(run_chatbot_test())
