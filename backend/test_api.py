import requests

def test_api():
    base_url = "http://localhost:8000"
    
    print("Testing Root Endpoint...")
    try:
        r = requests.get(f"{base_url}/")
        print(f"Status: {r.status_code}")
        print(f"Response: {r.json()}")
    except Exception as e:
        print(f"Error: {e}")
        
    print("\nTesting Health Check Endpoint...")
    try:
        r = requests.get(f"{base_url}/health")
        print(f"Status: {r.status_code}")
        print(f"Response: {r.json()}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_api()
