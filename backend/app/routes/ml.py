from fastapi import APIRouter, Depends
from ..celery_app import train_model
from ..utils.auth import get_current_user
from ..models import User

router = APIRouter(prefix="/ml", tags=["Machine Learning"])

@router.post("/train")
async def trigger_training(current_user: User = Depends(get_current_user)):
    if current_user.role != "admin":
        raise HTTPException(403, "Admin only")
    task = train_model.delay()
    return {"task_id": task.id, "status": "started"}