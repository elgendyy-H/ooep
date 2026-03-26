from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import User
from ..utils.auth import get_current_user
import psutil
import platform

router = APIRouter(prefix="/monitoring", tags=["Monitoring"])

@router.get("/metrics")
async def get_metrics(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Basic system metrics
    try:
        cpu_percent = psutil.cpu_percent(interval=1)
        memory = psutil.virtual_memory()
        disk = psutil.disk_usage('/')
        return {
            "cpu": {"load": cpu_percent},
            "memory": {"percent": memory.percent, "used": memory.used, "total": memory.total},
            "disk": {"percent": disk.percent, "used": disk.used, "total": disk.total},
            "api_health": "healthy",
            "alerts": []
        }
    except Exception as e:
        return {
            "cpu": {"load": 0},
            "memory": {"percent": 0},
            "disk": {"percent": 0},
            "api_health": "degraded",
            "alerts": [{"severity": "warning", "message": f"Metrics collection error: {str(e)}"}]
        }