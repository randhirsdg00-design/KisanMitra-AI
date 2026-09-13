import re
import time
import logging
from typing import Optional, List, Dict, Any

from google import genai
from google.genai import types
from google.genai.errors import APIError

from backend.app.config import (
    GEMINI_API_KEY,
    GEMINI_MODEL,
    GEMINI_TIMEOUT_SECONDS,
)
from backend.app.schemas.assistant import (
    ChatMessage,
    FarmContext,
    AssistantChatRequest,
)

logger = logging.getLogger("kisanmitra.gemini")

# Language registry supporting major Indian agricultural languages
LANGUAGE_REGISTRY: Dict[str, Dict[str, str]] = {
    "hindi": {"name": "Hindi", "code": "hi", "tts": "hi-IN"},
    "hi": {"name": "Hindi", "code": "hi", "tts": "hi-IN"},
    "english": {"name": "English", "code": "en", "tts": "en-IN"},
    "en": {"name": "English", "code": "en", "tts": "en-IN"},
    "bhojpuri": {"name": "Bhojpuri", "code": "bho", "tts": "hi-IN"},
    "bho": {"name": "Bhojpuri", "code": "bho", "tts": "hi-IN"},
    "punjabi": {"name": "Punjabi", "code": "pa", "tts": "pa-IN"},
    "pa": {"name": "Punjabi", "code": "pa", "tts": "pa-IN"},
    "gujarati": {"name": "Gujarati", "code": "gu", "tts": "gu-IN"},
    "gu": {"name": "Gujarati", "code": "gu", "tts": "gu-IN"},
    "bengali": {"name": "Bengali", "code": "bn", "tts": "bn-IN"},
    "bn": {"name": "Bengali", "code": "bn", "tts": "bn-IN"},
    "marathi": {"name": "Marathi", "code": "mr", "tts": "mr-IN"},
    "mr": {"name": "Marathi", "code": "mr", "tts": "mr-IN"},
    "tamil": {"name": "Tamil", "code": "ta", "tts": "ta-IN"},
    "ta": {"name": "Tamil", "code": "ta", "tts": "ta-IN"},
    "telugu": {"name": "Telugu", "code": "te", "tts": "te-IN"},
    "te": {"name": "Telugu", "code": "te", "tts": "te-IN"},
    "kannada": {"name": "Kannada", "code": "kn", "tts": "kn-IN"},
    "kn": {"name": "Kannada", "code": "kn", "tts": "kn-IN"},
    "malayalam": {"name": "Malayalam", "code": "ml", "tts": "ml-IN"},
    "ml": {"name": "Malayalam", "code": "ml", "tts": "ml-IN"},
    "odia": {"name": "Odia", "code": "or", "tts": "od-IN"},
    "or": {"name": "Odia", "code": "or", "tts": "od-IN"},
    "urdu": {"name": "Urdu", "code": "ur", "tts": "ur-IN"},
    "ur": {"name": "Urdu", "code": "ur", "tts": "ur-IN"},
}

AGRICULTURE_SYSTEM_PROMPT = """You are KisanMitra AI, a trusted, practical, and farmer-centric agricultural advisor for Indian farmers.
Your mission is to provide clear, actionable, and scientific farming guidance that helps farmers maximize yields, protect soil health, and prevent crop losses.

Core Principles:
1. Communication Style:
   - Use simple, respectful, and farmer-friendly language.
   - Avoid overly academic terminology. Explain technical concepts using familiar agricultural terms.
   - Reply in the specified target language naturally and accurately.

2. Diagnostic Rigor & Safety:
   - Clearly distinguish between general agronomic recommendations and definitive disease/pest diagnoses.
   - Never claim 100% certainty on crop disease or pest identification from text queries alone.
   - In cases of uncertainty, severe crop symptoms, or widespread pest outbreaks, advise the farmer to consult local agricultural extension officers, state department agronomists, or visit the nearest Krishi Vigyan Kendra (KVK).

3. Pesticide & Chemical Safety (CRITICAL):
   - NEVER recommend unsafe, untested, or hazardous pesticide dosage mixtures.
   - Always instruct the farmer to strictly adhere to the manufacturer's approved product label, Central Insecticides Board & Registration Committee (CIBRC) guidelines, and standard state agricultural university (SAU) Package of Practices.
   - Highlight protective equipment (gloves, masks) and standard withholding/waiting periods where applicable.

4. Contextual Guidance:
   - When farm context (crop, soil type, irrigation type, sowing date, location) is provided, tailor your advisory specifically to those agronomic parameters.
"""


class GeminiService:
    """Singleton service for interacting with Google Gemini AI using google-genai SDK."""

    _instance: Optional["GeminiService"] = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(GeminiService, cls).__new__(cls)
            cls._instance._initialized = False
        return cls._instance

    def __init__(self):
        if self._initialized:
            return
        self._client: Optional[genai.Client] = None
        self._api_key: Optional[str] = None
        self._model = GEMINI_MODEL
        self._timeout_seconds = GEMINI_TIMEOUT_SECONDS
        self._initialized = True

    def _get_model(self) -> str:
        """Get the configured Gemini model name."""
        import os
        return os.getenv("GEMINI_MODEL", "gemini-3.6-flash").strip()

    def _get_api_key(self) -> str:
        """Get the current Gemini API key, reloading from .env if needed."""
        import os
        from dotenv import load_dotenv
        from backend.app.config import BASE_DIR

        # Always check latest environment and reload from file if needed
        load_dotenv(BASE_DIR / ".env", override=False)
        key = os.getenv("GEMINI_API_KEY", "").strip()
        if not key:
            load_dotenv(BASE_DIR / ".env", override=True)
            key = os.getenv("GEMINI_API_KEY", "").strip()
        return key

    def is_configured(self) -> bool:
        """Check whether a non-empty Gemini API key is configured."""
        key = self._get_api_key()
        return bool(key)

    def get_client(self) -> Optional[genai.Client]:
        """Retrieve or initialize the Gemini client singleton without repeated allocations."""
        key = self._get_api_key()
        if not key:
            return None

        if self._client is None or self._api_key != key:
            # Initialize official google-genai client with timeout
            timeout_ms = int(self._timeout_seconds * 1000)
            self._client = genai.Client(
                api_key=key,
                http_options=types.HttpOptions(timeout=timeout_ms),
            )
            self._api_key = key
            logger.info("Initialized Gemini client with model=%s, timeout=%ss", self._model, self._timeout_seconds)

        return self._client

    @staticmethod
    def detect_language(text: str) -> str:
        """Detect the dominant script of the text to resolve the appropriate language."""
        if not text:
            return "English"

        # Check Unicode ranges for major Indian scripts
        scripts = [
            (r"[\u0A00-\u0A7F]", "Punjabi"),
            (r"[\u0980-\u09FF]", "Bengali"),
            (r"[\u0A80-\u0AFF]", "Gujarati"),
            (r"[\u0B80-\u0BFF]", "Tamil"),
            (r"[\u0C00-\u0C7F]", "Telugu"),
            (r"[\u0C80-\u0CFF]", "Kannada"),
            (r"[\u0D00-\u0D7F]", "Malayalam"),
            (r"[\u0B00-\u0B7F]", "Odia"),
            (r"[\u0600-\u06FF]", "Urdu"),
            (r"[\u0900-\u097F]", "Hindi"),  # Devanagari (Hindi / Bhojpuri / Marathi)
        ]

        for pattern, lang in scripts:
            if re.search(pattern, text):
                # Distinguish Marathi if distinctive characters appear or default Hindi
                return lang

        # Check keywords for Bhojpuri transliterations if written in Latin
        lower_text = text.lower()
        if any(term in lower_text for term in ["bhojpuri", "ka haal", "bhaiya", "rauva", "batee"]):
            return "Bhojpuri"

        return "English"

    def resolve_language_info(
        self,
        message: str,
        conversation_language: Optional[str] = None,
        language_alias: Optional[str] = None,
        auto_detect: bool = True,
    ) -> Dict[str, str]:
        """Resolve detected language, target conversation language, and TTS code."""
        detected = self.detect_language(message)

        target_key = None
        if not auto_detect:
            # Use explicit language preference if provided
            req_lang = conversation_language or language_alias
            if req_lang:
                target_key = req_lang.strip().lower()

        if not target_key:
            target_key = detected.lower()

        # Lookup in registry with fallback to English
        info = LANGUAGE_REGISTRY.get(target_key)
        if not info:
            # Check partial match on name
            for k, v in LANGUAGE_REGISTRY.items():
                if v["name"].lower() == target_key:
                    info = v
                    break

        if not info:
            info = {"name": detected, "code": "en", "tts": "en-IN"}

        return {
            "language": info["name"],
            "tts_language": info["tts"],
            "detected_language": detected,
        }

    @staticmethod
    def _build_farm_context_prompt(farm: Optional[FarmContext]) -> str:
        """Format optional farm details into a contextual string."""
        if not farm:
            return ""

        parts = []
        if farm.farm_name:
            parts.append(f"Farm Name: {farm.farm_name}")
        if farm.crop:
            parts.append(f"Cultivated Crop: {farm.crop}")
        if farm.area:
            parts.append(f"Land Area: {farm.area} acres")
        if farm.soil_type:
            parts.append(f"Soil Type: {farm.soil_type}")
        if farm.irrigation_type:
            parts.append(f"Irrigation: {farm.irrigation_type}")
        if farm.sowing_date:
            parts.append(f"Sowing Date: {farm.sowing_date}")
        if farm.location:
            parts.append(f"Location: {farm.location}")

        if not parts:
            return ""

        return "\n\n[Active Farmer Farm Context]:\n" + "\n".join(f"- {p}" for p in parts)

    def generate_chat_response(self, request: AssistantChatRequest) -> Dict[str, Any]:
        """Generate a response using Gemini API with context and safety guardrails."""
        start_time = time.time()
        logger.info("AI assistant request received: length=%d characters", len(request.message))

        # Language resolution
        lang_info = self.resolve_language_info(
            message=request.message,
            conversation_language=request.conversation_language,
            language_alias=request.language,
            auto_detect=request.auto_detect,
        )
        target_lang = lang_info["language"]

        # Check configuration
        if not self.is_configured():
            logger.warning("Gemini AI API key not configured.")
            return {
                "success": False,
                "reply": None,
                "mode": "ERROR",
                "engine": "Gemini",
                "provider": "Gemini",
                "language": target_lang,
                "tts_language": lang_info["tts_language"],
                "detected_language": lang_info["detected_language"],
                "model_info": self._model,
                "error": "AI service temporarily unavailable (API key not configured).",
            }

        model_name = self._get_model()

        client = self.get_client()
        if not client:
            return {
                "success": False,
                "reply": None,
                "mode": "ERROR",
                "engine": "Gemini",
                "provider": "Gemini",
                "language": target_lang,
                "tts_language": lang_info["tts_language"],
                "detected_language": lang_info["detected_language"],
                "model_info": model_name,
                "error": "AI service client initialization failed.",
            }

        # Build contents structure with conversation history and farm context
        farm_snippet = self._build_farm_context_prompt(request.farm_context)
        system_instruction = (
            f"{AGRICULTURE_SYSTEM_PROMPT}\n"
            f"Target Response Language: {target_lang}. Always respond directly in {target_lang}."
        )

        contents = []

        # Append limited prior conversation history (max 10 turns)
        if request.conversation_history:
            for item in request.conversation_history[-10:]:
                role = "user" if item.role == "user" else "model"
                contents.append(
                    types.Content(
                        role=role,
                        parts=[types.Part.from_text(text=item.content)],
                    )
                )

        # Append current user prompt with attached farm context
        full_user_message = f"{request.message}{farm_snippet}"
        contents.append(
            types.Content(
                role="user",
                parts=[types.Part.from_text(text=full_user_message)],
            )
        )

        try:
            config = types.GenerateContentConfig(
                system_instruction=system_instruction,
                temperature=0.4,
            )

            response = client.models.generate_content(
                model=model_name,
                contents=contents,
                config=config,
            )

            latency = time.time() - start_time
            reply_text = getattr(response, "text", None) or ""

            if not reply_text.strip():
                logger.error("Gemini returned an empty response text (latency: %.2fs)", latency)
                return {
                    "success": False,
                    "reply": None,
                    "mode": "ERROR",
                    "engine": "Gemini",
                    "provider": "Gemini",
                    "language": target_lang,
                    "tts_language": lang_info["tts_language"],
                    "detected_language": lang_info["detected_language"],
                    "model_info": model_name,
                    "error": "AI service returned an empty response.",
                }

            logger.info("Gemini response generated successfully in %.2fs", latency)
            return {
                "success": True,
                "reply": reply_text.strip(),
                "mode": "ONLINE_AI",
                "engine": "Gemini",
                "provider": "Gemini",
                "language": target_lang,
                "tts_language": lang_info["tts_language"],
                "detected_language": lang_info["detected_language"],
                "model_info": model_name,
                "error": None,
            }

        except TimeoutError:
            latency = time.time() - start_time
            logger.error("Gemini API call timed out after %.2fs", latency)
            return {
                "success": False,
                "reply": None,
                "mode": "ERROR",
                "engine": "Gemini",
                "provider": "Gemini",
                "language": target_lang,
                "tts_language": lang_info["tts_language"],
                "detected_language": lang_info["detected_language"],
                "model_info": model_name,
                "error": "AI service request timed out. Please try again.",
            }

        except APIError as api_err:
            latency = time.time() - start_time
            logger.error("Gemini API Error (status %s) in %.2fs: %s", getattr(api_err, "code", "N/A"), latency, getattr(api_err, "message", "API Error"))
            return {
                "success": False,
                "reply": None,
                "mode": "ERROR",
                "engine": "Gemini",
                "provider": "Gemini",
                "language": target_lang,
                "tts_language": lang_info["tts_language"],
                "detected_language": lang_info["detected_language"],
                "model_info": model_name,
                "error": "AI service temporarily unavailable.",
            }

        except Exception as exc:
            latency = time.time() - start_time
            logger.error("Unexpected error in Gemini service after %.2fs: %s", latency, exc, exc_info=True)
            return {
                "success": False,
                "reply": None,
                "mode": "ERROR",
                "engine": "Gemini",
                "provider": "Gemini",
                "language": target_lang,
                "tts_language": lang_info["tts_language"],
                "detected_language": lang_info["detected_language"],
                "model_info": model_name,
                "error": "AI service temporarily unavailable.",
            }


# Singleton service instance
gemini_service = GeminiService()
