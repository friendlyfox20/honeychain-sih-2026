from typing import Optional
from pydantic import BaseModel, Field

class HoneyYieldRequest(BaseModel):
    environmental_temperature: float = Field(..., json_schema_extra={"example": 22.5}, description="Environmental Temperature (°C)")
    relative_humidity: float = Field(..., json_schema_extra={"example": 75.0}, description="Relative Humidity (%)")
    hive_temperature: float = Field(..., json_schema_extra={"example": 33.5}, description="Hive Temperature (°C)")
    hive_humidity: float = Field(..., json_schema_extra={"example": 58.0}, description="Hive Humidity (%)")
    wind_speed: float = Field(..., json_schema_extra={"example": 4.5}, description="Wind Speed (km/h)")
    date: str = Field(..., json_schema_extra={"example": "2024-11-15"}, description="Date string (YYYY-MM-DD)")
    
    # Optional historical lag overrides
    honey_weight_lag1: Optional[float] = Field(None, description="Optional override for lag-1 honey weight")
    honey_weight_roll_mean_3: Optional[float] = Field(None, description="Optional override for 3-day rolling mean")
    honey_weight_roll_mean_7: Optional[float] = Field(None, description="Optional override for 7-day rolling mean")
    honey_weight_roll_std_7: Optional[float] = Field(None, description="Optional override for 7-day rolling std")

class HoneyYieldResponse(BaseModel):
    prediction_type: str = "honey_yield"
    predicted_yield_kg: float
    model: str = "best_honey_yield_model"

class DailyProductionRequest(BaseModel):
    environmental_temperature: float = Field(..., json_schema_extra={"example": 22.5}, description="Environmental Temperature (°C)")
    relative_humidity: float = Field(..., json_schema_extra={"example": 75.0}, description="Relative Humidity (%)")
    hive_temperature: float = Field(..., json_schema_extra={"example": 33.5}, description="Hive Temperature (°C)")
    hive_humidity: float = Field(..., json_schema_extra={"example": 58.0}, description="Hive Humidity (%)")
    wind_speed: float = Field(..., json_schema_extra={"example": 4.5}, description="Wind Speed (km/h)")
    date: str = Field(..., json_schema_extra={"example": "2024-11-15"}, description="Date string (YYYY-MM-DD)")
    
    # Optional historical lag overrides
    prev_daily_production: Optional[float] = Field(None, description="Optional override for previous day production")
    lag1_honey_weight: Optional[float] = Field(None, description="Optional override for lag-1 honey weight")
    lag2_daily_production: Optional[float] = Field(None, description="Optional override for lag-2 production")
    lag3_daily_production: Optional[float] = Field(None, description="Optional override for lag-3 production")
    roll_mean_3_prod: Optional[float] = Field(None, description="Optional override for 3-day production rolling mean")
    roll_mean_7_prod: Optional[float] = Field(None, description="Optional override for 7-day production rolling mean")
    roll_std_7_prod: Optional[float] = Field(None, description="Optional override for 7-day production rolling std")

class DailyProductionResponse(BaseModel):
    prediction_type: str = "daily_honey_production"
    predicted_production_kg: float
    model: str = "daily_production_best_model"
