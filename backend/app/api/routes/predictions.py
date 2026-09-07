import logging
from fastapi import APIRouter, HTTPException, status
from app.schemas.prediction import (
    HoneyYieldRequest,
    HoneyYieldResponse,
    DailyProductionRequest,
    DailyProductionResponse
)
from app.services.ml_service import ml_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/predictions", tags=["ML Predictions"])

@router.post("/yield", response_model=HoneyYieldResponse, summary="Predict Honey Yield (kg)")
def predict_yield(request: HoneyYieldRequest):
    """
    Predicts honey yield (kg) given environmental & hive parameters using the trained model artifact.
    """
    try:
        return ml_service.predict_honey_yield(request)
    except FileNotFoundError as e:
        logger.error(f"Model file error: {e}")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=str(e)
        )
    except ValueError as e:
        logger.warning(f"Invalid input parameter for yield prediction: {e}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid parameter value: {e}"
        )
    except Exception as e:
        logger.error(f"Prediction execution failure: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred while executing the honey yield prediction model."
        )

@router.post("/daily-production", response_model=DailyProductionResponse, summary="Predict Daily Honey Production (kg/day)")
def predict_daily_production(request: DailyProductionRequest):
    """
    Predicts daily honey production (kg/day) using the trained daily production model.
    """
    try:
        return ml_service.predict_daily_production(request)
    except FileNotFoundError as e:
        logger.error(f"Daily production model error: {e}")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=str(e)
        )
    except ValueError as e:
        logger.warning(f"Invalid input parameter for daily production: {e}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid parameter value: {e}"
        )
    except Exception as e:
        logger.error(f"Daily production prediction failure: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred while executing the daily production prediction model."
        )
