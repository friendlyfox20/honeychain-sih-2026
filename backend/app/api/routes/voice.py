from fastapi import APIRouter, Depends, File, UploadFile, status
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.schemas.voice import VoiceTranscriptionResponse, VoiceQueryRequest, VoiceQueryResponse
from app.services import speech_service, voice_query_service
from app.core.dependencies import get_current_user
from app.models.user import User

router = APIRouter(prefix="/voice", tags=["Voice Backend & Speech-to-Text"])

@router.post(
    "/transcribe",
    response_model=VoiceTranscriptionResponse,
    status_code=status.HTTP_200_OK,
    summary="Transcribe uploaded audio file to text transcript"
)
async def transcribe_audio(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user)
):
    """
    Accepts an uploaded audio file (.wav, .mp3, .m4a, .ogg, .flac), validates format and file size limit,
    and returns speech transcript metadata with active STT provider info.
    Requires authentication.
    """
    contents = await file.read()
    return speech_service.validate_and_transcribe_audio(
        file_bytes=contents,
        filename=file.filename or "audio.wav",
        content_type=file.content_type or "audio/wav"
    )

@router.post(
    "/query",
    response_model=VoiceQueryResponse,
    status_code=status.HTTP_200_OK,
    summary="Execute transcribed voice text query"
)
def query_voice(
    query_in: VoiceQueryRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Parses voice query text, extracts batch ID and intent, enforces RBAC, and executes HoneyChain operations.
    Requires authentication.
    """
    return voice_query_service.execute_voice_query(
        db=db,
        text=query_in.text,
        current_user=current_user
    )

@router.post(
    "/ask",
    response_model=VoiceQueryResponse,
    status_code=status.HTTP_200_OK,
    summary="Combined audio upload transcription + voice query execution"
)
async def ask_voice(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Combined endpoint accepting audio recording, converting to transcript, parsing intent, and returning structured HoneyChain result.
    Requires authentication.
    """
    contents = await file.read()
    transcription = speech_service.validate_and_transcribe_audio(
        file_bytes=contents,
        filename=file.filename or "audio.wav",
        content_type=file.content_type or "audio/wav"
    )
    return voice_query_service.execute_voice_query(
        db=db,
        text=transcription.transcript,
        current_user=current_user,
        provider=transcription.provider
    )
