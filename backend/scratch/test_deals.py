import requests
import time

def test_login(email, password, role_name):
    print(f"\n--- Testing {role_name} ---")
    base_url = "http://localhost:8000"
    
    try:
        r = requests.post(f"{base_url}/auth/login", json={"email": email, "password": password})
        if r.status_code != 200:
            print(f"Login failed: {r.status_code} {r.text}")
            return
            
        token = r.json()["access_token"]
        
        headers = {"Authorization": f"Bearer {token}"}
        
        r2 = requests.get(f"{base_url}/deals", headers=headers)
        print(f"Deals endpoint: {r2.status_code}")
        if r2.status_code == 200:
            print(f"Number of deals: {len(r2.json())}")
        else:
            print(f"Deals error: {r2.text}")
            
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_login("sales@gmail.com", "sales123", "sales")
    test_login("manager@gmail.com", "manager123", "manager")
    test_login("admin@gmail.com", "admin123", "admin")
