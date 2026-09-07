import os
import json
import logging
from typing import Dict, Any, Tuple, Optional
import joblib
import numpy as np
import pandas as pd
from app.core.config import settings
from app.schemas.prediction import (
    HoneyYieldRequest,
    HoneyYieldResponse,
    DailyProductionRequest,
    DailyProductionResponse
)

logger = logging.getLogger(__name__)

class MLService:
    def __init__(self):
        self._yield_model = None
        self._yield_metadata = None
        self._daily_prod_model = None
        self._daily_prod_metadata = None

    def _get_model_dir(self) -> str:
        return settings.get_resolved_model_dir()

    def _get_dataset_path(self) -> str:
        return settings.get_resolved_dataset_path()

    def load_yield_model(self) -> Tuple[Any, Dict[str, Any]]:
        if self._yield_model is None:
            model_dir = self._get_model_dir()
            model_path = os.path.join(model_dir, "best_honey_yield_model.joblib")
            metadata_path = os.path.join(model_dir, "model_metadata.json")
            
            if not os.path.exists(model_path):
                raise FileNotFoundError(f"Honey yield model artifact not found at: {model_path}")
            if not os.path.exists(metadata_path):
                raise FileNotFoundError(f"Honey yield metadata not found at: {metadata_path}")
                
            self._yield_model = joblib.load(model_path)
            with open(metadata_path, 'r') as f:
                self._yield_metadata = json.load(f)
                
        return self._yield_model, self._yield_metadata

    def load_daily_production_model(self) -> Tuple[Any, Dict[str, Any]]:
        if self._daily_prod_model is None:
            model_dir = self._get_model_dir()
            model_path = os.path.join(model_dir, "daily_production_best_model.joblib")
            
            # Check candidate metadata paths
            meta_path_1 = os.path.join(os.path.dirname(model_dir), "results", "daily_production", "daily_production_metadata.json")
            meta_path_2 = os.path.join(model_dir, "daily_production_metadata.json")
            
            if not os.path.exists(model_path):
                raise FileNotFoundError(f"Daily production model artifact not found at: {model_path}")
                
            metadata = {}
            if os.path.exists(meta_path_1):
                with open(meta_path_1, 'r') as f:
                    metadata = json.load(f)
            elif os.path.exists(meta_path_2):
                with open(meta_path_2, 'r') as f:
                    metadata = json.load(f)
            else:
                metadata = {
                    "feature_columns": [
                        "prev_daily_production", "lag1_honey_weight", "lag2_daily_production",
                        "lag3_daily_production", "roll_mean_3_prod", "roll_mean_7_prod",
                        "roll_std_7_prod", "Environmental Temperature (°C)", "Relative Humidity (%)",
                        "Hive Temperature (°C)", "Hive Humidity (%)", "Wind Speed (km/h)",
                        "month", "day_of_year"
                    ]
                }
                
            self._daily_prod_model = joblib.load(model_path)
            self._daily_prod_metadata = metadata
            
        return self._daily_prod_model, self._daily_prod_metadata

    def predict_honey_yield(self, req: HoneyYieldRequest) -> HoneyYieldResponse:
        model, metadata = self.load_yield_model()
        feature_cols = metadata.get("feature_columns", [])
        
        parsed_date = pd.to_datetime(req.date)
        month = parsed_date.month
        day_of_year = parsed_date.dayofyear
        
        # Calculate lag features from historical dataset if available and not explicitly provided
        lag_1 = req.honey_weight_lag1
        roll_mean_3 = req.honey_weight_roll_mean_3
        roll_mean_7 = req.honey_weight_roll_mean_7
        roll_std_7 = req.honey_weight_roll_std_7
        
        dataset_path = self._get_dataset_path()
        if (lag_1 is None or roll_mean_3 is None or roll_mean_7 is None or roll_std_7 is None) and os.path.exists(dataset_path):
            try:
                df_hist = pd.read_csv(dataset_path)
                df_hist['parsed_date'] = pd.to_datetime(df_hist['Date'], format='%B %d, %Y')
                df_hist = df_hist.sort_values('parsed_date').reset_index(drop=True)
                
                df_past = df_hist[df_hist['parsed_date'] < parsed_date]
                if len(df_past) >= 7:
                    past_weights = df_past['Honey Weight (kg)'].values
                    if lag_1 is None: lag_1 = float(past_weights[-1])
                    if roll_mean_3 is None: roll_mean_3 = float(np.mean(past_weights[-3:]))
                    if roll_mean_7 is None: roll_mean_7 = float(np.mean(past_weights[-7:]))
                    if roll_std_7 is None: roll_std_7 = float(np.std(past_weights[-7:], ddof=1)) if len(past_weights[-7:]) > 1 else 0.0
            except Exception as e:
                logger.warning(f"Could not compute yield lag features from dataset: {e}")
                
        # Default fallback values
        if lag_1 is None: lag_1 = 20.0
        if roll_mean_3 is None: roll_mean_3 = 20.0
        if roll_mean_7 is None: roll_mean_7 = 20.0
        if roll_std_7 is None: roll_std_7 = 0.5
        
        input_dict = {
            'Environmental Temperature (°C)': [float(req.environmental_temperature)],
            'Relative Humidity (%)': [float(req.relative_humidity)],
            'Hive Temperature (°C)': [float(req.hive_temperature)],
            'Hive Humidity (%)': [float(req.hive_humidity)],
            'Wind Speed (km/h)': [float(req.wind_speed)],
            'month': [int(month)],
            'day_of_year': [int(day_of_year)],
            'honey_weight_lag1': [float(lag_1)],
            'honey_weight_roll_mean_3': [float(roll_mean_3)],
            'honey_weight_roll_mean_7': [float(roll_mean_7)],
            'honey_weight_roll_std_7': [float(roll_std_7)]
        }
        
        df_input = pd.DataFrame(input_dict)[feature_cols]
        raw_pred = model.predict(df_input)[0]
        
        return HoneyYieldResponse(
            prediction_type="honey_yield",
            predicted_yield_kg=round(float(raw_pred), 4),
            model="best_honey_yield_model"
        )

    def predict_daily_production(self, req: DailyProductionRequest) -> DailyProductionResponse:
        model, metadata = self.load_daily_production_model()
        feature_cols = metadata.get("feature_columns", [
            'prev_daily_production', 'lag1_honey_weight', 'lag2_daily_production',
            'lag3_daily_production', 'roll_mean_3_prod', 'roll_mean_7_prod',
            'roll_std_7_prod', 'Environmental Temperature (°C)', 'Relative Humidity (%)',
            'Hive Temperature (°C)', 'Hive Humidity (%)', 'Wind Speed (km/h)',
            'month', 'day_of_year'
        ])
        
        parsed_date = pd.to_datetime(req.date)
        month = parsed_date.month
        day_of_year = parsed_date.dayofyear
        
        # Pull historical lags if available and not overridden
        prev_prod = req.prev_daily_production
        lag1_w = req.lag1_honey_weight
        lag2_p = req.lag2_daily_production
        lag3_p = req.lag3_daily_production
        rm3 = req.roll_mean_3_prod
        rm7 = req.roll_mean_7_prod
        rs7 = req.roll_std_7_prod
        
        dataset_path = self._get_dataset_path()
        if os.path.exists(dataset_path):
            try:
                df = pd.read_csv(dataset_path)
                df['parsed_date'] = pd.to_datetime(df['Date'], format='%B %d, %Y')
                df = df.sort_values('parsed_date').reset_index(drop=True)
                df['daily_honey_production'] = df['Honey Weight (kg)'].diff()
                
                df_past = df[df['parsed_date'] < parsed_date]
                if len(df_past) >= 10:
                    past_prods = df_past['daily_honey_production'].dropna().values
                    past_weights = df_past['Honey Weight (kg)'].values
                    
                    if prev_prod is None: prev_prod = float(past_prods[-1])
                    if lag1_w is None: lag1_w = float(past_weights[-1])
                    if lag2_p is None and len(past_prods) >= 2: lag2_p = float(past_prods[-2])
                    if lag3_p is None and len(past_prods) >= 3: lag3_p = float(past_prods[-3])
                    if rm3 is None: rm3 = float(np.mean(past_prods[-3:]))
                    if rm7 is None: rm7 = float(np.mean(past_prods[-7:]))
                    if rs7 is None: rs7 = float(np.std(past_prods[-7:], ddof=1)) if len(past_prods[-7:]) > 1 else 0.0
            except Exception as e:
                logger.warning(f"Could not compute daily production lags from dataset: {e}")
                
        # Defaults if missing
        if prev_prod is None: prev_prod = 0.25
        if lag1_w is None: lag1_w = 20.0
        if lag2_p is None: lag2_p = 0.25
        if lag3_p is None: lag3_p = 0.25
        if rm3 is None: rm3 = 0.25
        if rm7 is None: rm7 = 0.25
        if rs7 is None: rs7 = 0.05
        
        input_dict = {
            'prev_daily_production': [float(prev_prod)],
            'lag1_honey_weight': [float(lag1_w)],
            'lag2_daily_production': [float(lag2_p)],
            'lag3_daily_production': [float(lag3_p)],
            'roll_mean_3_prod': [float(rm3)],
            'roll_mean_7_prod': [float(rm7)],
            'roll_std_7_prod': [float(rs7)],
            'Environmental Temperature (°C)': [float(req.environmental_temperature)],
            'Relative Humidity (%)': [float(req.relative_humidity)],
            'Hive Temperature (°C)': [float(req.hive_temperature)],
            'Hive Humidity (%)': [float(req.hive_humidity)],
            'Wind Speed (km/h)': [float(req.wind_speed)],
            'month': [int(month)],
            'day_of_year': [int(day_of_year)]
        }
        
        df_input = pd.DataFrame(input_dict)[feature_cols]
        raw_pred = model.predict(df_input)[0]
        
        return DailyProductionResponse(
            prediction_type="daily_honey_production",
            predicted_production_kg=round(float(raw_pred), 4),
            model="daily_production_best_model"
        )

ml_service = MLService()
