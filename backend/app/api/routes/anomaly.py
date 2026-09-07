import logging
from fastapi import APIRouter, HTTPException, status
from app.schemas.anomaly import AnomalyCheckRequest, AnomalyCheckResponse
from app.services.anomaly_service import anomaly_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/anomaly", tags=["Supply Chain Anomaly"])

@router.post("/check", response_model=AnomalyCheckResponse, summary="Check Supply-Chain Batch Anomaly")
def check_anomaly(request: AnomalyCheckRequest):
    """
    Performs 2-layer supply chain batch anomaly evaluation:
    1. Layer 1: Deterministic Mass-Conservation Rules (Processing <= Harvest, Bottled <= Processing, Dispatched <= Bottled)
    2. Layer 2: Machine Learning Classification Model
    
    Deterministic mass-conservation rules are authoritative and override ML output.
    """
    try:
        return anomaly_service.check_batch_anomaly(request)
    except ValueError as e:
        logger.warning(f"Invalid input parameter for anomaly check: {e}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"Anomaly check execution failure: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred while evaluating supply-chain anomaly status."
        )
