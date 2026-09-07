from typing import Any, Optional
from pydantic import BaseModel, Field, ConfigDict

class VoiceTranscriptionResponse(BaseModel):
    transcript: str = Field(..., json_schema_extra={"example": "Show me the trace of batch H001"}, description="Recognized speech text transcript")
    language: str = Field("en", json_schema_extra={"example": "en"}, description="Detected audio language code")
    confidence: float = Field(0.95, ge=0.0, le=1.0, json_schema_extra={"example": 0.95}, description="Speech recognition confidence score")
    provider: str = Field("speech_recognition", json_schema_extra={"example": "speech_recognition"}, description="Active STT provider name")

    model_config = ConfigDict(from_attributes=True)

class VoiceQueryRequest(BaseModel):
    text: str = Field(..., json_schema_extra={"example": "Show me the trace of batch H001"}, description="Transcribed voice query text")

class VoiceQueryResponse(BaseModel):
    transcript: str = Field(..., description="Normalized input voice query text")
    intent: str = Field(..., json_schema_extra={"example": "BATCH_TRACE"}, description="Recognized HoneyChain operational intent")
    batch_id: Optional[str] = Field(None, json_schema_extra={"example": "BATCH-H001"}, description="Extracted batch ID parameter")
    message: str = Field(..., description="Human-readable result summary")
    data: Any = Field(None, description="Structured query execution result payload")
    provider: Optional[str] = Field(None, description="Active STT provider name if converted from audio")

    model_config = ConfigDict(from_attributes=True)
