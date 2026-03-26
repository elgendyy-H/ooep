import json
from sqlalchemy.orm import Session
from ..models import Schedule
from ..schemas import ScheduleCreate, ScheduleResponse

class AutomationService:
    def __init__(self, db: Session):
        self.db = db

    def create_schedule(self, data: ScheduleCreate, owner_id: int) -> ScheduleResponse:
        db_schedule = Schedule(
            name=data.name,
            cron_expression=data.cron_expression,
            scan_config=data.scan_config,
            is_active=data.is_active,
            owner_id=owner_id
        )
        self.db.add(db_schedule)
        self.db.commit()
        self.db.refresh(db_schedule)
        return db_schedule