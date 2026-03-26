from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from .. import schemas
from ..database import get_db
from ..models import Target, User
from ..utils.auth import get_current_user

router = APIRouter(prefix="/targets", tags=["Targets"])

@router.post("/", response_model=schemas.TargetResponse)
async def create_target(target: schemas.TargetCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    db_target = Target(url=str(target.url), name=target.name, description=target.description, owner_id=current_user.id)
    db.add(db_target)
    db.commit()
    db.refresh(db_target)
    return db_target

@router.get("/", response_model=list[schemas.TargetResponse])
async def list_targets(skip: int = 0, limit: int = 100, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    targets = db.query(Target).filter(Target.owner_id == current_user.id).offset(skip).limit(limit).all()
    return targets

@router.get("/{target_id}", response_model=schemas.TargetResponse)
async def get_target(target_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    target = db.query(Target).filter(Target.id == target_id, Target.owner_id == current_user.id).first()
    if not target:
        raise HTTPException(status_code=404, detail="Target not found")
    return target

@router.put("/{target_id}", response_model=schemas.TargetResponse)
async def update_target(target_id: int, target_data: schemas.TargetCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    target = db.query(Target).filter(Target.id == target_id, Target.owner_id == current_user.id).first()
    if not target:
        raise HTTPException(status_code=404, detail="Target not found")
    target.url = str(target_data.url)
    target.name = target_data.name
    target.description = target_data.description
    db.commit()
    db.refresh(target)
    return target

@router.delete("/{target_id}")
async def delete_target(target_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    target = db.query(Target).filter(Target.id == target_id, Target.owner_id == current_user.id).first()
    if not target:
        raise HTTPException(status_code=404, detail="Target not found")
    db.delete(target)
    db.commit()
    return {"message": "Target deleted"}