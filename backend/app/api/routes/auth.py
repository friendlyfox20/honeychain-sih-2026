import logging
from typing import Union
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.schemas.auth import RegisterRequest, LoginRequest, TokenResponse, UserResponse
from app.services import auth_service
from app.core.security import create_access_token
from app.core.dependencies import get_current_user
from app.models.user import User

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/auth", tags=["Authentication & User Management"])

@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED, summary="Register a new user account")
def register(req: RegisterRequest, db: Session = Depends(get_db)):
    """
    Registers a new user (default role BEEKEEPER). Public registration of ADMIN users is restricted.
    """
    user = auth_service.register_user(db, req, is_admin_creator=False)
    return user

@router.post("/login", response_model=TokenResponse, summary="Authenticate user & issue JWT bearer token")
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    """
    Authenticates user with username (email) and password, returning a JWT access token.
    Supports standard OAuth2 Form or JSON requests.
    """
    user = auth_service.authenticate_user(db, email=form_data.username, password=form_data.password)
    access_token = create_access_token(data={"sub": str(user.id), "role": user.role})
    return TokenResponse(access_token=access_token, token_type="bearer")

@router.post("/login/json", response_model=TokenResponse, summary="Authenticate user via JSON request body")
def login_json(req: LoginRequest, db: Session = Depends(get_db)):
    """
    JSON body endpoint for authenticating user with email and password.
    """
    user = auth_service.authenticate_user(db, email=req.email, password=req.password)
    access_token = create_access_token(data={"sub": str(user.id), "role": user.role})
    return TokenResponse(access_token=access_token, token_type="bearer")

@router.get("/me", response_model=UserResponse, summary="Get current authenticated user profile")
def get_me(current_user: User = Depends(get_current_user)):
    """
    Returns authenticated user's profile information.
    """
    return current_user
