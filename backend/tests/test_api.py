import pytest
from backend.app.database.session import init_db


def test_health_check(client):
    """Verify /health backward compatibility."""
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {
        "status": "ok",
        "service": "KisanMitra AI Backend",
    }


def test_database_init():
    """Verify that init_db runs idempotently without errors."""
    init_db()


# ==================================================
# FARM API TESTS
# ==================================================

def test_create_farm_success(client):
    payload = {
        "farm_name": "Green Valley Farm",
        "crop": "Wheat",
        "land_area": 4.5,
        "land_unit": "acres",
        "soil_type": "Alluvial",
        "irrigation_type": "Drip",
        "location": "Punjab, Sector 4",
        "sowing_date": "2026-10-15T00:00:00Z",
    }
    response = client.post("/api/farms", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["farm_name"] == "Green Valley Farm"
    assert data["land_area"] == 4.5
    assert data["user_id"] == 1
    assert "id" in data


def test_create_farm_invalid_land_area(client):
    """Ensure land area must be positive (> 0)."""
    payload = {
        "farm_name": "Zero Area Farm",
        "crop": "Paddy",
        "land_area": -2.0,
        "land_unit": "acres",
        "soil_type": "Clay",
        "irrigation_type": "Canal",
        "location": "Haryana",
    }
    response = client.post("/api/farms", json=payload)
    assert response.status_code == 422
    data = response.json()
    assert data["success"] is False
    assert data["error"] == "validation_error"


def test_get_and_list_farms(client):
    # Create farm
    create_res = client.post(
        "/api/farms",
        json={
            "farm_name": "North Field",
            "crop": "Mustard",
            "land_area": 2.0,
            "land_unit": "hectares",
            "soil_type": "Loamy",
            "irrigation_type": "Sprinkler",
            "location": "Rajasthan",
        },
    )
    farm_id = create_res.json()["id"]

    # List farms
    list_res = client.get("/api/farms")
    assert list_res.status_code == 200
    farms = list_res.json()
    assert any(f["id"] == farm_id for f in farms)

    # Get single farm
    get_res = client.get(f"/api/farms/{farm_id}")
    assert get_res.status_code == 200
    assert get_res.json()["farm_name"] == "North Field"


def test_update_and_delete_farm(client):
    create_res = client.post(
        "/api/farms",
        json={
            "farm_name": "South Orchard",
            "crop": "Mango",
            "land_area": 3.0,
            "land_unit": "acres",
            "soil_type": "Red",
            "irrigation_type": "Drip",
            "location": "Maharashtra",
        },
    )
    farm_id = create_res.json()["id"]

    # Update farm
    update_res = client.put(f"/api/farms/{farm_id}", json={"crop": "Guava", "land_area": 3.5})
    assert update_res.status_code == 200
    assert update_res.json()["crop"] == "Guava"
    assert update_res.json()["land_area"] == 3.5

    # Delete farm
    delete_res = client.delete(f"/api/farms/{farm_id}")
    assert delete_res.status_code == 200
    assert delete_res.json()["success"] is True

    # Check 404 after deletion
    not_found_res = client.get(f"/api/farms/{farm_id}")
    assert not_found_res.status_code == 404
    assert not_found_res.json()["success"] is False
    assert not_found_res.json()["error"] == "not_found"


def test_farm_not_found(client):
    response = client.get("/api/farms/999999")
    assert response.status_code == 404
    data = response.json()
    assert data["success"] is False
    assert data["error"] == "not_found"
    assert "Farm not found" in data["message"]


# ==================================================
# SCAN HISTORY API TESTS
# ==================================================

def test_create_and_get_scan_history(client):
    payload = {
        "crop": "Tomato",
        "disease": "Early Blight",
        "confidence": 0.94,
        "model_mode": "standard",
        "image_reference": "uploads/scans/tomato_blight.jpg",
    }
    create_res = client.post("/api/history", json=payload)
    assert create_res.status_code == 201
    scan = create_res.json()
    assert scan["crop"] == "Tomato"
    assert scan["disease"] == "Early Blight"
    assert scan["confidence"] == 0.94
    scan_id = scan["id"]

    # Retrieve by ID
    get_res = client.get(f"/api/history/{scan_id}")
    assert get_res.status_code == 200
    assert get_res.json()["id"] == scan_id

    # List history
    list_res = client.get("/api/history")
    assert list_res.status_code == 200
    assert any(s["id"] == scan_id for s in list_res.json())


def test_scan_history_not_found(client):
    response = client.get("/api/history/999999")
    assert response.status_code == 404
    assert response.json()["error"] == "not_found"


# ==================================================
# SAVED ADVICE API TESTS
# ==================================================

def test_saved_advice_lifecycle(client):
    payload = {
        "question": "How to manage stem borer in paddy?",
        "answer": "Apply neem oil spray at 3ml/litre and maintain proper water depth.",
        "language": "en",
    }
    create_res = client.post("/api/saved-advice", json=payload)
    assert create_res.status_code == 201
    advice = create_res.json()
    advice_id = advice["id"]
    assert advice["question"] == payload["question"]

    # List
    list_res = client.get("/api/saved-advice")
    assert list_res.status_code == 200
    assert any(a["id"] == advice_id for a in list_res.json())

    # Delete
    del_res = client.delete(f"/api/saved-advice/{advice_id}")
    assert del_res.status_code == 200
    assert del_res.json()["success"] is True

    # Delete again (404)
    del_again = client.delete(f"/api/saved-advice/{advice_id}")
    assert del_again.status_code == 404
    assert del_again.json()["error"] == "not_found"


# ==================================================
# REMINDERS API TESTS
# ==================================================

def test_reminders_lifecycle(client):
    payload = {
        "title": "Apply Urea fertilizer",
        "description": "Second dose of nitrogen fertilizer for wheat crop.",
        "due_at": "2026-11-01T09:00:00Z",
        "completed": False,
    }
    create_res = client.post("/api/reminders", json=payload)
    assert create_res.status_code == 201
    reminder = create_res.json()
    rem_id = reminder["id"]
    assert reminder["title"] == payload["title"]
    assert reminder["completed"] is False

    # List
    list_res = client.get("/api/reminders")
    assert list_res.status_code == 200
    assert any(r["id"] == rem_id for r in list_res.json())

    # Update completed status
    update_res = client.put(f"/api/reminders/{rem_id}", json={"completed": True})
    assert update_res.status_code == 200
    assert update_res.json()["completed"] is True

    # Delete
    del_res = client.delete(f"/api/reminders/{rem_id}")
    assert del_res.status_code == 200
    assert del_res.json()["success"] is True

    # Not found check
    del_again = client.delete(f"/api/reminders/{rem_id}")
    assert del_again.status_code == 404
    assert del_again.json()["error"] == "not_found"


# ==================================================
# NOTIFICATION PREFERENCES API TESTS
# ==================================================

def test_notification_preferences(client):
    # Get current preferences
    get_res = client.get("/api/notification-preferences")
    assert get_res.status_code == 200
    data = get_res.json()
    assert "weather_alerts" in data
    assert "mandi_alerts" in data

    # Update preferences
    update_res = client.put(
        "/api/notification-preferences",
        json={"weather_alerts": False, "mandi_alerts": True},
    )
    assert update_res.status_code == 200
    updated = update_res.json()
    assert updated["weather_alerts"] is False
    assert updated["mandi_alerts"] is True
