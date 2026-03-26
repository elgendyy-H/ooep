from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from .. import schemas
from ..database import get_db
from ..models import Finding, Scan, User
from ..utils.auth import get_current_user

router = APIRouter(prefix="/findings", tags=["Findings"])

@router.get("/", response_model=list[schemas.FindingResponse])
async def list_findings(
    scan_id: int = None,
    severity: str = None,
    status: str = None,
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(Finding).join(Scan).filter(Scan.owner_id == current_user.id)
    if scan_id:
        query = query.filter(Finding.scan_id == scan_id)
    if severity:
        query = query.filter(Finding.severity == severity)
    if status:
        query = query.filter(Finding.status == status)
    findings = query.offset(skip).limit(limit).all()
    return findings

@router.get("/{finding_id}", response_model=schemas.FindingResponse)
async def get_finding(
    finding_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    finding = db.query(Finding).join(Scan).filter(
        Finding.id == finding_id,
        Scan.owner_id == current_user.id
    ).first()
    if not finding:
        raise HTTPException(status_code=404, detail="Finding not found")
    return finding

@router.put("/{finding_id}", response_model=schemas.FindingResponse)
async def update_finding(
    finding_id: int,
    update: schemas.FindingUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    finding = db.query(Finding).join(Scan).filter(
        Finding.id == finding_id,
        Scan.owner_id == current_user.id
    ).first()
    if not finding:
        raise HTTPException(status_code=404, detail="Finding not found")
    if update.status:
        finding.status = update.status
    db.commit()
    db.refresh(finding)
    return finding