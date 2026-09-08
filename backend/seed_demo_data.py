"""
Seed script to initialize demo accounts and an exemplary batch for the HoneyChain SIH demonstration.
"""
from app.db.database import SessionLocal, init_db
from app.models.user import User
from app.core.security import hash_password

def seed_demo_users():
    init_db()
    db = SessionLocal()
    
    users = [
        {"email": "beekeeper@honeychain.com", "name": "Rajesh Beekeeper", "role": "BEEKEEPER"},
        {"email": "collector@honeychain.com", "name": "Amit Collector", "role": "COLLECTOR"},
        {"email": "processor@honeychain.com", "name": "Priya Processor", "role": "PROCESSOR"},
        {"email": "lab@honeychain.com", "name": "Dr. Sunita Lab Analyst", "role": "LAB"},
        {"email": "admin@honeychain.com", "name": "HoneyChain Administrator", "role": "ADMIN"},
    ]
    
    password_hash = hash_password("password123")
    
    for u_info in users:
        existing = db.query(User).filter(User.email == u_info["email"]).first()
        if not existing:
            user = User(
                email=u_info["email"],
                name=u_info["name"],
                role=u_info["role"],
                password_hash=password_hash,
                is_active=True
            )
            db.add(user)
            print(f"Created demo user: {u_info['email']} ({u_info['role']})")
        else:
            existing.role = u_info["role"]
            existing.name = u_info["name"]
            existing.is_active = True
            existing.password_hash = password_hash
            print(f"Updated demo user: {u_info['email']} ({u_info['role']})")
            
    db.commit()
    db.close()
    print("Demo user seeding complete.")

if __name__ == "__main__":
    seed_demo_users()
