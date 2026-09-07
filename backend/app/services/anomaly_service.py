import os
import logging
from typing import Any, Tuple
import joblib
import pandas as pd
from app.core.config import settings
from app.schemas.anomaly import (
    AnomalyCheckRequest,
    AnomalyCheckResponse,
    RuleCheckDetails,
    GapDetails
)

logger = logging.getLogger(__name__)

class AnomalyService:
    def __init__(self):
        self._anomaly_model = None

    def _get_model_dir(self) -> str:
        return settings.get_resolved_model_dir()

    def load_anomaly_model(self) -> Any:
        if self._anomaly_model is None:
            model_dir = self._get_model_dir()
            model_path = os.path.join(model_dir, "best_anomaly_model.joblib")
            if not os.path.exists(model_path):
                raise FileNotFoundError(f"Best anomaly model artifact not found at: {model_path}")
            self._anomaly_model = joblib.load(model_path)
        return self._anomaly_model

    def check_batch_anomaly(self, req: AnomalyCheckRequest) -> AnomalyCheckResponse:
        # Input Validation (Pydantic validates non-negativity via ge=0 and non-empty batch_id)
        harvest = float(req.harvest_quantity_kg)
        processing = float(req.processing_quantity_kg)
        bottled = float(req.bottled_quantity_kg)
        dispatched = float(req.dispatched_quantity_kg)
        
        # Calculate Gaps
        processing_gap = processing - harvest
        bottling_gap = bottled - processing
        dispatch_gap = dispatched - bottled
        
        # --- LAYER 1: Deterministic Mass-Conservation Rules ---
        p_vs_h = "PASS" if processing <= harvest else "FAIL"
        b_vs_p = "PASS" if bottled <= processing else "FAIL"
        d_vs_b = "PASS" if dispatched <= bottled else "FAIL"
        
        rule_failed = (p_vs_h == "FAIL" or b_vs_p == "FAIL" or d_vs_b == "FAIL")
        rule_anomaly = 1 if rule_failed else 0
        
        # --- LAYER 2: Machine Learning Prediction ---
        ml_prediction_str = "NORMAL"
        try:
            model = self.load_anomaly_model()
            feature_names = ['Harvest_Quantity_kg', 'Processing_Quantity_kg', 'Bottled_Quantity_kg', 'Dispatched_Quantity_kg']
            input_df = pd.DataFrame([{
                'Harvest_Quantity_kg': harvest,
                'Processing_Quantity_kg': processing,
                'Bottled_Quantity_kg': bottled,
                'Dispatched_Quantity_kg': dispatched
            }])[feature_names]
            
            raw_ml = model.predict(input_df)[0]
            ml_anomaly = int(raw_ml)
            ml_prediction_str = "ANOMALY" if ml_anomaly == 1 else "NORMAL"
        except FileNotFoundError as fnfe:
            logger.warning(f"Anomaly ML model not found, relying on Layer 1 rule checks: {fnfe}")
            ml_anomaly = 0
            ml_prediction_str = "UNAVAILABLE"
        except Exception as e:
            logger.error(f"Error during ML anomaly inference: {e}")
            ml_anomaly = 0
            ml_prediction_str = "ERROR"

        # --- FINAL AUTHORITATIVE DECISION ---
        # Rule check is authoritative! If rule fails OR ML flags anomaly, final_status is ANOMALY.
        final_anomaly = 1 if (rule_anomaly == 1 or ml_anomaly == 1) else 0
        final_status_str = "ANOMALY" if final_anomaly == 1 else "NORMAL"
        
        return AnomalyCheckResponse(
            batch_id=req.batch_id,
            rule_check=RuleCheckDetails(
                processing_vs_harvest=p_vs_h,
                bottled_vs_processing=b_vs_p,
                dispatched_vs_bottled=d_vs_b
            ),
            gaps=GapDetails(
                processing_gap_kg=round(processing_gap, 2),
                bottling_gap_kg=round(bottling_gap, 2),
                dispatch_gap_kg=round(dispatch_gap, 2)
            ),
            ml_prediction=ml_prediction_str,
            final_status=final_status_str
        )

anomaly_service = AnomalyService()
