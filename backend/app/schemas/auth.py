from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field, ConfigDict, EmailStr, field_validator

class RegisterRequest(BaseModel):
    name: str = Field(..., min_length=1, json_schema_extra={"example": "Test Beekeeper"}, description="Full Name")
    email: EmailStr = Field(..., json_schema_extra={"example": "beekeeper@example.com"}, description="Unique Email Address")
    password: str = Field(..., min_length=8, json_schema_extra={"example": "securepassword123"}, description="Password (min 8 characters)")
    role: str = Field("BEEKEEPER", json_schema_extra={"example": "BEEKEEPER"}, description="User Role: BEEKEEPER, COLLECTOR, PROCESSOR, LAB, ADMIN")

    @field_validator("email")
    @classmethod
    def normalize_email(cls, v: str) -> str:
        return v.strip().lower()

class LoginRequest(BaseModel):
    email: EmailStr = Field(..., json_schema_extra={"example": "beekeeper@example.com"}, description="Email Address")
    password: str = Field(..., json_schema_extra={"example": "securepassword123"}, description="Password")

    @field_validator("email")
    @classmethod
    def normalize_email(cls, v: str) -> str:
        return v.strip().lower()

class TokenResponse(BaseModel):
    access_token: str = Field(..., json_schema_extra={"example": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."})
    token_type: str = Field("bearer", json_schema_extra={"example": "bearer"})

class UserResponse(BaseModel):
    id: int
    name: str
    email: str
    role: str
    is_active: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
