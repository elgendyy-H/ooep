from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from .. import schemas
from ..database import get_db
from ..models import Schedule, User
from ..utils.auth import get_current_user
from ..services.automation_service import AutomationService
import json

router = APIRouter(prefix="/automation", tags=["Automation"])

@router.post("/schedules/", response_model=schemas.ScheduleResponse)
async def create_schedule(
    schedule: schemas.ScheduleCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    service = AutomationService(db)
    return service.create_schedule(schedule, current_user.id)

@router.get("/schedules/", response_model=list[schemas.ScheduleResponse])
async def list_schedules(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    schedules = db.query(Schedule).filter(Schedule.owner_id == current_user.id).all()
    return schedules

@router.put("/schedules/{schedule_id}", response_model=schemas.ScheduleResponse)
async def update_schedule(
    schedule_id: int,
    schedule: schemas.ScheduleCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    db_schedule = db.query(Schedule).filter(
        Schedule.id == schedule_id,
        Schedule.owner_id == current_user.id
    ).first()
    if not db_schedule:
        raise HTTPException(status_code=404, detail="Schedule not found")
    db_schedule.name = schedule.name
    db_schedule.cron_expression = schedule.cron_expression
    db_schedule.scan_config = schedule.scan_config
    db_schedule.is_active = schedule.is_active
    db.commit()
    db.refresh(db_schedule)
    return db_schedule

@router.delete("/schedules/{schedule_id}")
async def delete_schedule(
    schedule_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    schedule = db.query(Schedule).filter(
        Schedule.id == schedule_id,
        Schedule.owner_id == current_user.id
    ).first()
    if not schedule:
        raise HTTPException(status_code=404, detail="Schedule not found")
    db.delete(schedule)
    db.commit()
    return {"message": "Schedule deleted"}