import logging
from typing import Optional
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app.models.user import User
from app.schemas.auth import RegisterRequest
from app.core.security import hash_password, verify_password

logger = logging.getLogger(__name__)

VALID_ROLES = {"BEEKEEPER", "COLLECTOR", "PROCESSOR", "LAB", "ADMIN"}

def register_user(db: Session, req: RegisterRequest, is_admin_creator: bool = False) -> User:
    role_upper = req.role.upper()
    if role_upper not in VALID_ROLES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid role '{req.role}'. Valid roles are: {sorted(list(VALID_ROLES))}"
        )

    # Security rule: Public registration cannot create ADMIN users
    if role_upper == "ADMIN" and not is_admin_creator:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Public registration cannot create ADMIN users. Admin accounts must be created by an existing administrator."
        )

    email_clean = req.email.strip().lower()
    existing_user = db.query(User).filter(User.email == email_clean).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email address is already registered."
        )

    pwd_hash = hash_password(req.password)
    
    user = User(
        name=req.name.strip(),
        email=email_clean,
        password_hash=pwd_hash,
        role=role_upper,
        is_active=True
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    
    return user

def authenticate_user(db: Session, email: str, password: str) -> User:
    email_clean = email.strip().lower()
    user = db.query(User).filter(User.email == email_clean).first()
    
    if not user or not verify_password(password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email address or password.",
            headers={"WWW-Authenticate": "Bearer"}
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User account is inactive. Please contact the administrator.",
            headers={"WWW-Authenticate": "Bearer"}
        )

    return user

def get_user_by_id(db: Session, user_id: int) -> Optional[User]:
    return db.query(User).filter(User.id == user_id).first()

def get_user_by_email(db: Session, email: str) -> Optional[User]:
    return db.query(User).filter(User.email == email.strip().lower()).first()
