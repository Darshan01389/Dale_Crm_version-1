
import requests

url = "http://localhost:8000/auth/login"
data = {
    "email": "admin@gmail.com",
    "password": "password123"
}

try:
    response = requests.post(url, json=data)
    print(f"Status: {response.status_code}")
    print(f"Response: {response.text}")
except Exception as e:
    print(f"Error: {e}")
