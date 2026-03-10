
import requests
import uuid

BASE_URL = "http://localhost:5000"

def test_registration_and_login():
    email = f"test_{uuid.uuid4()}@example.com"
    password = "TestPassword123"
    tax_id = str(uuid.uuid4())[:20] 

    print(f"Registering user: {email} / {password} / {tax_id}")

    register_data = {
        "full_name": "Test User",
        "email": email,
        "password": password,
        "tax_id": tax_id,
        "doc_type": "National_ID",
        "doc_num": "123456789",
        "initial_pin": "1234"
    }

    try:
        response = requests.post(f"{BASE_URL}/api/auth/register", json=register_data)
        print(f"Registration Status Code: {response.status_code}")
        print(f"Registration Response: {response.text}")

        if response.status_code == 201:
            print("Registration successful, attempting login...")
            login_data = {
                "email": email,
                "password": password
            }
            login_res = requests.post(f"{BASE_URL}/api/auth/login", json=login_data)
            print(f"Login Status Code: {login_res.status_code}")
            print(f"Login Response: {login_res.text}")
        else:
            print("Registration failed, skipping login.")

    except Exception as e:
        print(f"Request failed: {e}")

if __name__ == "__main__":
    test_registration_and_login()
