import os
from typing import Optional
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    APP_NAME: str = "HoneyChain Backend"
    ENVIRONMENT: str = "development"
    DATABASE_URL: Optional[str] = None
    MODEL_DIR: str = "../models"
    DATASET_PATH: str = "../DAT/Honey_Production_Dataset_for_2024.csv"
    
    # JWT Security Configuration
    JWT_SECRET_KEY: str = "supersecret_honeychain_key_change_in_production"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60

    # Public Verification Configuration
    VERIFICATION_BASE_URL: str = "http://localhost:8000/api/v1/verify"

    # Voice Backend & Speech-to-Text Configuration
    VOICE_STT_PROVIDER: str = "speech_recognition"  # "speech_recognition", "mock", "whisper"
    VOICE_MAX_FILE_SIZE_MB: int = 10
    STT_API_KEY: Optional[str] = None

    # Blockchain Integration Configuration
    BLOCKCHAIN_ENABLED: bool = True
    BLOCKCHAIN_PROVIDER: str = "mock"  # "mock", "web3"
    BLOCKCHAIN_NETWORK: str = "local"
    BLOCKCHAIN_RPC_URL: Optional[str] = None
    BLOCKCHAIN_CONTRACT_ADDRESS: Optional[str] = None
    BLOCKCHAIN_PRIVATE_KEY: Optional[str] = None



    
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

    def get_resolved_model_dir(self) -> str:
        if os.path.isabs(self.MODEL_DIR) and os.path.exists(self.MODEL_DIR):
            return self.MODEL_DIR
            
        candidates = [
            self.MODEL_DIR,
            os.path.join(os.getcwd(), "models"),
            os.path.join(os.getcwd(), "..", "models"),
            os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "..", "models"))
        ]
        
        for cand in candidates:
            if os.path.exists(cand) and os.path.isdir(cand):
                return os.path.abspath(cand)
                
        return os.path.abspath(self.MODEL_DIR)

    def get_resolved_dataset_path(self) -> str:
        if os.path.isabs(self.DATASET_PATH) and os.path.exists(self.DATASET_PATH):
            return self.DATASET_PATH
            
        candidates = [
            self.DATASET_PATH,
            os.path.join(os.getcwd(), "DAT", "Honey_Production_Dataset_for_2024.csv"),
            os.path.join(os.getcwd(), "..", "DAT", "Honey_Production_Dataset_for_2024.csv"),
            os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "..", "DAT", "Honey_Production_Dataset_for_2024.csv"))
        ]
        
        for cand in candidates:
            if os.path.exists(cand):
                return os.path.abspath(cand)
                
        return os.path.abspath(self.DATASET_PATH)

settings = Settings()
