import uuid
from typing import Dict

def get_auth_headers(client, role: str = "BEEKEEPER", email: str = None) -> Dict[str, str]:
    if email is None:
        email = f"user_{uuid.uuid4().hex[:8]}@example.com"
        
    password = "password123"
    
    # Register user (if ADMIN, register as BEEKEEPER first then update DB role directly in test)
    role_to_register = "BEEKEEPER" if role == "ADMIN" else role
    reg_resp = client.post("/api/v1/auth/register", json={
        "name": f"Test {role}",
        "email": email,
        "password": password,
        "role": role_to_register
    })
    
    if role == "ADMIN":
        # Direct DB update for test admin
        from app.db.database import SessionLocal
        from app.models.user import User
        db = SessionLocal()
        u = db.query(User).filter(User.email == email.lower()).first()
        if u:
            u.role = "ADMIN"
            db.commit()
        db.close()
        
    login_resp = client.post("/api/v1/auth/login/json", json={
        "email": email,
        "password": password
    })
    
    token = login_resp.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}
