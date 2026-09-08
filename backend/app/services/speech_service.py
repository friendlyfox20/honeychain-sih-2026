import os
import tempfile
import logging
from abc import ABC, abstractmethod
from typing import Dict, Union
from fastapi import HTTPException, status
from app.core.config import settings
from app.schemas.voice import VoiceTranscriptionResponse

logger = logging.getLogger(__name__)

ALLOWED_MIME_TYPES = {
    "audio/wav", "audio/x-wav", "audio/mp3", "audio/mpeg",
    "audio/m4a", "audio/x-m4a", "audio/ogg", "audio/flac", "audio/aac"
}
ALLOWED_EXTENSIONS = {".wav", ".mp3", ".m4a", ".ogg", ".flac", ".aac"}

class BaseSTTProvider(ABC):
    @abstractmethod
    def transcribe(self, file_path: str) -> Dict[str, Union[str, float]]:
        pass

class SpeechRecognitionProvider(BaseSTTProvider):
    provider_name = "speech_recognition"
    def transcribe(self, file_path: str) -> Dict[str, Union[str, float]]:
        import speech_recognition as sr
        recognizer = sr.Recognizer()
        try:
            with sr.AudioFile(file_path) as source:
                audio_data = recognizer.record(source)
                text = recognizer.recognize_google(audio_data)
                return {
                    "transcript": text,
                    "language": "en",
                    "confidence": 0.95,
                    "provider": "speech_recognition"
                }
        except sr.UnknownValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Speech recognition could not understand audio input (unclear or silent audio)."
            )
        except Exception as e:
            # Fallback or error detail
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Speech recognition engine processing failed: {str(e)}"
            )

class MockSpeechToTextProvider(BaseSTTProvider):
    provider_name = "mock"
    def transcribe(self, file_path: str) -> Dict[str, Union[str, float]]:
        return {
            "transcript": "Show me the trace of batch BATCH-H001",
            "language": "en",
            "confidence": 0.98,
            "provider": "mock"
        }

def get_stt_provider() -> BaseSTTProvider:
    provider_name = settings.VOICE_STT_PROVIDER.lower()
    if provider_name == "mock":
        return MockSpeechToTextProvider()
    elif provider_name == "speech_recognition":
        return SpeechRecognitionProvider()
    else:
        return SpeechRecognitionProvider()

get_active_stt_provider = get_stt_provider

def validate_and_transcribe_audio(
    file_bytes: bytes,
    filename: str,
    content_type: str
) -> VoiceTranscriptionResponse:
    max_bytes = settings.VOICE_MAX_FILE_SIZE_MB * 1024 * 1024
    if len(file_bytes) == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Audio file is empty."
        )
    if len(file_bytes) > max_bytes:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Audio file size exceeds maximum allowed limit of {settings.VOICE_MAX_FILE_SIZE_MB}MB."
        )

    ext = os.path.splitext(filename)[1].lower() if filename else ""
    if ext and ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported audio format '{ext}'. Supported formats: {sorted(list(ALLOWED_EXTENSIONS))}"
        )
    if content_type and content_type.lower() not in ALLOWED_MIME_TYPES and ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported audio MIME type '{content_type}'."
        )

    tmp_path = None
    try:
        suffix = ext if ext else ".wav"
        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
            tmp.write(file_bytes)
            tmp_path = tmp.name

        provider = get_stt_provider()
        res = provider.transcribe(tmp_path)

        return VoiceTranscriptionResponse(
            transcript=res["transcript"],
            language=str(res.get("language", "en")),
            confidence=float(res.get("confidence", 0.95)),
            provider=str(res.get("provider", settings.VOICE_STT_PROVIDER))
        )
    finally:
        if tmp_path and os.path.exists(tmp_path):
            try:
                os.unlink(tmp_path)
            except Exception as e:
                logger.warning(f"Failed to delete temporary audio file {tmp_path}: {e}")
