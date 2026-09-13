from unittest.mock import MagicMock, patch
from google.genai.errors import APIError
from backend.app.services.gemini_service import gemini_service


# 1. Gemini Configured Status Test
def test_gemini_status_configured(client):
    with patch.object(gemini_service, "is_configured", return_value=True):
        response = client.get("/api/assistant/status")
        assert response.status_code == 200
        data = response.json()
        assert data["configured"] is True
        assert data["api_key_present"] is True
        assert data["provider"] == "Gemini"
        assert data["mode"] == "ONLINE_AI"
        assert data["status"] == "ready"


# 2. Gemini Not Configured Status Test
def test_gemini_status_not_configured(client):
    with patch.object(gemini_service, "is_configured", return_value=False):
        response = client.get("/api/assistant/status")
        assert response.status_code == 200
        data = response.json()
        assert data["configured"] is False
        assert data["api_key_present"] is False
        assert data["mode"] == "NOT_CONFIGURED"
        assert data["status"] == "not_configured"


# 3. Successful Chat Response
def test_successful_chat(client):
    mock_resp = MagicMock()
    mock_resp.text = "For healthy wheat, maintain 4-5 irrigations at critical growth stages like CRI and flowering."

    mock_client = MagicMock()
    mock_client.models.generate_content.return_value = mock_resp

    with patch.object(gemini_service, "is_configured", return_value=True), \
         patch.object(gemini_service, "get_client", return_value=mock_client):
        payload = {"message": "How many irrigations are needed for wheat?"}
        response = client.post("/api/assistant/chat", json=payload)

        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert data["mode"] == "ONLINE_AI"
        assert data["engine"] == "Gemini"
        assert data["provider"] == "Gemini"
        assert "irrigations" in data["reply"]
        assert data["error"] is None


# 4. Empty Message Validation Error (422)
def test_empty_message_validation(client):
    response = client.post("/api/assistant/chat", json={"message": ""})
    assert response.status_code == 422
    data = response.json()
    assert data["success"] is False
    assert data["error"] == "validation_error"


# 5. Invalid Request - Missing Message (422)
def test_invalid_request_missing_message(client):
    response = client.post("/api/assistant/chat", json={})
    assert response.status_code == 422
    data = response.json()
    assert data["success"] is False
    assert data["error"] == "validation_error"


# 6. API Failure Handling
def test_api_failure_handling(client):
    mock_client = MagicMock()
    api_err = APIError(503, {"error": {"message": "The service is temporarily overloaded"}})
    mock_client.models.generate_content.side_effect = api_err

    with patch.object(gemini_service, "is_configured", return_value=True), \
         patch.object(gemini_service, "get_client", return_value=mock_client):
        payload = {"message": "How to treat yellow rust in wheat?"}
        response = client.post("/api/assistant/chat", json=payload)

        assert response.status_code == 200
        data = response.json()
        assert data["success"] is False
        assert data["mode"] == "ERROR"
        assert data["reply"] is None
        assert data["error"] == "AI service temporarily unavailable."


# 7. Timeout Handling
def test_timeout_handling(client):
    mock_client = MagicMock()
    mock_client.models.generate_content.side_effect = TimeoutError("Deadline exceeded")

    with patch.object(gemini_service, "is_configured", return_value=True), \
         patch.object(gemini_service, "get_client", return_value=mock_client):
        payload = {"message": "What is the best sowing time for gram?"}
        response = client.post("/api/assistant/chat", json=payload)

        assert response.status_code == 200
        data = response.json()
        assert data["success"] is False
        assert data["mode"] == "ERROR"
        assert data["reply"] is None
        assert "timed out" in data["error"]


# 8. Hindi Message Auto-Detection
def test_hindi_message_detection(client):
    mock_resp = MagicMock()
    mock_resp.text = "गेहूं में पहली सिंचाई सीआरआई (CRI) अवस्था पर 21 दिनों बाद करें।"

    mock_client = MagicMock()
    mock_client.models.generate_content.return_value = mock_resp

    with patch.object(gemini_service, "is_configured", return_value=True), \
         patch.object(gemini_service, "get_client", return_value=mock_client):
        payload = {
            "message": "गेहूं में पहली सिंचाई कब करें?",
            "auto_detect": True,
        }
        response = client.post("/api/assistant/chat", json=payload)

        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert data["language"] == "Hindi"
        assert data["tts_language"] == "hi-IN"
        assert data["detected_language"] == "Hindi"


# 9. English Message Detection
def test_english_message_detection(client):
    mock_resp = MagicMock()
    mock_resp.text = "Apply balanced NPK fertilizer based on your soil test report."

    mock_client = MagicMock()
    mock_client.models.generate_content.return_value = mock_resp

    with patch.object(gemini_service, "is_configured", return_value=True), \
         patch.object(gemini_service, "get_client", return_value=mock_client):
        payload = {
            "message": "What fertilizer should I apply for mustard?",
            "auto_detect": True,
        }
        response = client.post("/api/assistant/chat", json=payload)

        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert data["language"] == "English"
        assert data["tts_language"] == "en-IN"
        assert data["detected_language"] == "English"


# 10. Conversation Language Override
def test_conversation_language_override(client):
    mock_resp = MagicMock()
    mock_resp.text = "ਕਣਕ ਦੀ ਬਿਜਾਈ ਲਈ ਅਕਤੂਬਰ ਦੇ ਆਖਰੀ ਹਫ਼ਤੇ ਤੋਂ ਨਵੰਬਰ ਦਾ ਪਹਿਲਾ ਪੰਦਰਵਾੜਾ ਸਭ ਤੋਂ ਵਧੀਆ ਹੈ।"

    mock_client = MagicMock()
    mock_client.models.generate_content.return_value = mock_resp

    with patch.object(gemini_service, "is_configured", return_value=True), \
         patch.object(gemini_service, "get_client", return_value=mock_client):
        payload = {
            "message": "Best sowing date for wheat",
            "auto_detect": False,
            "conversation_language": "Punjabi",
        }
        response = client.post("/api/assistant/chat", json=payload)

        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert data["language"] == "Punjabi"
        assert data["tts_language"] == "pa-IN"


# 11. Farm Context Personalization
def test_farm_context_injection(client):
    mock_resp = MagicMock()
    mock_resp.text = "For your 5-acre cotton farm in Gujarat, drip irrigation should be applied every 3-4 days."

    mock_client = MagicMock()
    mock_client.models.generate_content.return_value = mock_resp

    with patch.object(gemini_service, "is_configured", return_value=True), \
         patch.object(gemini_service, "get_client", return_value=mock_client):
        payload = {
            "message": "When should I schedule irrigation?",
            "farm_context": {
                "farm_name": "Patel Farm",
                "crop": "Cotton",
                "area": 5.0,
                "soil_type": "Black soil",
                "irrigation_type": "Drip",
                "location": "Rajkot, Gujarat",
            },
        }
        response = client.post("/api/assistant/chat", json=payload)

        assert response.status_code == 200
        assert response.json()["success"] is True

        # Verify that the farm context was passed into the generate_content call
        call_args = mock_client.models.generate_content.call_args
        contents = call_args.kwargs.get("contents") or call_args[1].get("contents")
        user_prompt_text = contents[-1].parts[0].text
        assert "Cultivated Crop: Cotton" in user_prompt_text
        assert "Black soil" in user_prompt_text
        assert "Rajkot, Gujarat" in user_prompt_text


# 12. Conversation History Handling
def test_conversation_history_handling(client):
    mock_resp = MagicMock()
    mock_resp.text = "For fruit borer in tomato, install pheromone traps and spray bio-agents like Bt or neem."

    mock_client = MagicMock()
    mock_client.models.generate_content.return_value = mock_resp

    with patch.object(gemini_service, "is_configured", return_value=True), \
         patch.object(gemini_service, "get_client", return_value=mock_client):
        payload = {
            "message": "How do I control the borers?",
            "conversation_history": [
                {"role": "user", "content": "I have planted tomato this season."},
                {"role": "assistant", "content": "Tomatoes need good staking and balanced NPK."},
            ],
        }
        response = client.post("/api/assistant/chat", json=payload)

        assert response.status_code == 200
        assert response.json()["success"] is True

        # Verify that conversation history was included in contents
        call_args = mock_client.models.generate_content.call_args
        contents = call_args.kwargs.get("contents") or call_args[1].get("contents")
        # History has 2 messages + 1 current message = 3 content items
        assert len(contents) == 3
        assert contents[0].role == "user"
        assert contents[0].parts[0].text == "I have planted tomato this season."
        assert contents[1].role == "model"
        assert contents[1].parts[0].text == "Tomatoes need good staking and balanced NPK."
        assert contents[2].role == "user"
        assert "How do I control the borers?" in contents[2].parts[0].text
