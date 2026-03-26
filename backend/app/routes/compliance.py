from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from .. import schemas
from ..database import get_db
from ..models import User
from ..services.compliance import get_compliance_checker
from ..utils.auth import get_current_user

router = APIRouter(prefix="/compliance", tags=["Compliance"])

@router.post("/check")
async def run_compliance_check(
    request: schemas.ComplianceCheckRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    checker = get_compliance_checker(request.framework)
    if not checker:
        raise HTTPException(status_code=400, detail="Unsupported framework")
    result = await checker.check_all(request.targets, db, current_user.id)
    return result