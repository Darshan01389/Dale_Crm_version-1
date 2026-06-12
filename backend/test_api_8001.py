import requests
import json

def test_api():
    base_url = "http://localhost:8001"
    
    print(f"Testing API on {base_url}...")
    
    print("\nTesting Root Endpoint...")
    try:
        r = requests.get(f"{base_url}/")
        print(f"Status: {r.status_code}")
        # Encode to avoid console errors
        print(f"Response: {json.dumps(r.json(), indent=2)}")
    except Exception as e:
        print(f"Error: {e}")
        
    print("\nTesting Health Check Endpoint...")
    try:
        r = requests.get(f"{base_url}/health")
        print(f"Status: {r.status_code}")
        print(f"Response: {json.dumps(r.json(), indent=2)}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_api()
