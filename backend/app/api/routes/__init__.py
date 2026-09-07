from fastapi import APIRouter
from app.api.routes import health, predictions, anomaly, auth, batches, supply_chain, reconciliation, lab, evidence, genealogy, qr, voice, blockchain, analytics

api_router = APIRouter(prefix="/api/v1")
api_router.include_router(health.router)
api_router.include_router(predictions.router)
api_router.include_router(anomaly.router)
api_router.include_router(auth.router)
api_router.include_router(batches.router)
api_router.include_router(supply_chain.router)
api_router.include_router(reconciliation.router)
api_router.include_router(lab.router)
api_router.include_router(evidence.router)
api_router.include_router(genealogy.router)
api_router.include_router(qr.router)
api_router.include_router(voice.router)
api_router.include_router(blockchain.router)
api_router.include_router(analytics.router)




