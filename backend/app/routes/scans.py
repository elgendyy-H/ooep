from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from .. import schemas
from ..database import get_db
from ..models import User, Scan, Target
from ..utils.auth import get_current_user
from ..services.scan_service import ScanService

router = APIRouter(prefix="/scans", tags=["Scans"])

@router.post("/", response_model=schemas.ScanResponse)
async def create_scan(scan: schemas.ScanCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    service = ScanService(db)
    return service.create_scan(scan, current_user.id)

@router.get("/", response_model=list[schemas.ScanResponse])
async def list_scans(skip: int = 0, limit: int = 100, status: str = None, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    service = ScanService(db)
    return service.get_scans(current_user.id, skip, limit, status)

@router.get("/{scan_id}", response_model=schemas.ScanResponse)
async def get_scan(scan_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    service = ScanService(db)
    scan = service.get_scan(scan_id, current_user.id)
    if not scan:
        raise HTTPException(status_code=404, detail="Scan not found")
    return scan

@router.post("/{scan_id}/start")
async def start_scan(scan_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    service = ScanService(db)
    task_id = service.start_scan_async(scan_id)
    return {"message": "Scan started", "task_id": task_id}

@router.delete("/{scan_id}")
async def delete_scan(scan_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    scan = db.query(Scan).filter(Scan.id == scan_id, Scan.owner_id == current_user.id).first()
    if not scan:
        raise HTTPException(status_code=404, detail="Scan not found")
    db.delete(scan)
    db.commit()
    return {"message": "Scan deleted"}