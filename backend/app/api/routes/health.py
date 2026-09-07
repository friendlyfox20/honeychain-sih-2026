from fastapi import APIRouter

router = APIRouter(tags=["Health"])

@router.get("/health", summary="Service Health Check")
def health_check():
    """
    Returns system operational health status.
    """
    return {
        "status": "ok",
        "service": "HoneyChain Backend"
    }
