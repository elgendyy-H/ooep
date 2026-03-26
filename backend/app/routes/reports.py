from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from .. import schemas
from ..database import get_db
from ..models import User, Scan, Report
from ..utils.auth import get_current_user
from ..services.report_service import ReportService
import json

router = APIRouter(prefix="/reports", tags=["Reports"])

@router.post("/generate")
async def generate_report(
    request: schemas.ReportRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if request.scan_ids:
        scans = db.query(Scan).filter(
            Scan.id.in_(request.scan_ids),
            Scan.owner_id == current_user.id
        ).all()
        if len(scans) != len(request.scan_ids):
            raise HTTPException(status_code=404, detail="One or more scans not found")
    service = ReportService(db)
    report = service.generate_report(request, current_user.id)
    return report

@router.get("/", response_model=list[schemas.ReportResponse])
async def list_reports(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    reports = db.query(Report).filter(Report.user_id == current_user.id).all()
    return reports

@router.get("/{report_id}/download")
async def download_report(
    report_id: int,
    format: str = "pdf",
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    report = db.query(Report).filter(Report.id == report_id, Report.user_id == current_user.id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    service = ReportService(db)
    content = service.get_report_file(report.id, format)
    if not content:
        raise HTTPException(status_code=404, detail="Report file not found")
    return content