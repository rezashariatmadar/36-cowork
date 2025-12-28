import requests
import datetime

BASE_URL = "http://127.0.0.1:8000/api/v1"

def get_space_by_name(name):
    r = requests.get(f"{BASE_URL}/spaces/")
    if r.status_code != 200:
        print("Failed to fetch spaces")
        return None
    
    data = r.json()
    items = data['results'] if isinstance(data, dict) and 'results' in data else data
    
    for s in items:
        if s['name'] == name:
            return s
    return None

def generate_valid_national_id():
    # Helper to generate a valid ID (simple one that works)
    # Calculated valid ID: 0012345679
    return "0012345679"

def create_booking(space_id, name, date, start, end):
    data = {
        "full_name": name,
        "national_id": generate_valid_national_id(), 
        "mobile": "0912" + str(datetime.datetime.now().microsecond).zfill(7),
        "booking_date_jalali": date,
        "start_time": start,
        "end_time": end,
        "duration_hours": 1,
        "space": space_id,
        "terms_accepted": True,
        "privacy_accepted": True
    }
    
    r = requests.post(f"{BASE_URL}/bookings/", json=data)
    return r

def test_capacity():
    # 1. Test Dedicated Desk (Cap 1)
    print("\n--- Test 1: Dedicated Desk (Cap 1) ---")
    desk = get_space_by_name("Dedicated Desk #1")
    if not desk:
        print("Dedicated Desk #1 not found!")
        return

    date = "1405-01-01" 
    
    # Booking 1
    r1 = create_booking(desk['id'], "User One", date, "10:00", "11:00")
    print(f"Booking 1: {r1.status_code}") 
    if r1.status_code != 201:
        print(f"Booking 1 FAILED: {r1.text}") 

    # Booking 2 (Overlap)
    r2 = create_booking(desk['id'], "User Two", date, "10:00", "11:00")
    print(f"Booking 2: {r2.status_code}")
    
    if r1.status_code == 201 and r2.status_code == 400:
        print("PASS: Prevented overflow.")
    else:
        print(f"FAIL: Logic incorrect. {r1.text} / {r2.text}")

    # 2. Test Long Table (Cap 16)
    print("\n--- Test 2: Long Table (Cap 16) ---")
    table = get_space_by_name("The Long Joint Table")
    
    # Booking 1
    r1 = create_booking(table['id'], "User A", date, "14:00", "15:00")
    print(f"Booking 1: {r1.status_code}") 
    
    # Booking 2
    r2 = create_booking(table['id'], "User B", date, "14:00", "15:00")
    print(f"Booking 2: {r2.status_code}") 
    
    if r1.status_code == 201 and r2.status_code == 201:
        print("PASS: Allowed multiple bookings.")
    else:
        print(f"FAIL: Blocked valid bookings. {r1.text} / {r2.text}")

if __name__ == "__main__":
    test_capacity()
