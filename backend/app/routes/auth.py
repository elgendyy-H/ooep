from fastapi import APIRouter, Depends, Request, HTTPException
from sqlalchemy.orm import Session
from slowapi import Limiter
from slowapi.util import get_remote_address
from .. import schemas
from ..database import get_db
from ..models import User
from ..utils.security import get_password_hash, verify_password, create_jwt_token, is_strong_password, is_valid_email
from ..utils.auth import get_current_user
from ..utils.config import settings
from datetime import timedelta

router = APIRouter(prefix="/auth", tags=["Authentication"])
limiter = Limiter(key_func=get_remote_address)

@router.post("/register", response_model=schemas.UserResponse)
@limiter.limit("5/minute")
async def register(request: Request, user: schemas.UserCreate, db: Session = Depends(get_db)):
    if db.query(User).filter(User.email == user.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")
    if not is_valid_email(user.email):
        raise HTTPException(status_code=400, detail="Invalid email format")
    if not is_strong_password(user.password):
        raise HTTPException(status_code=400, detail="Password too weak")
    hashed = get_password_hash(user.password)
    db_user = User(email=user.email, username=user.username, hashed_password=hashed, full_name=user.full_name, role=user.role)
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

@router.post("/login")
@limiter.limit("10/minute")
async def login(request: Request, user: schemas.UserLogin, db: Session = Depends(get_db)):
    db_user = db.query(User).filter(User.email == user.email).first()
    if not db_user or not verify_password(user.password, db_user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    token = create_jwt_token({"sub": str(db_user.id), "email": db_user.email, "role": db_user.role}, settings.SECRET_KEY, timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES))
    return {"access_token": token, "token_type": "bearer", "user": db_user}

@router.get("/me", response_model=schemas.UserResponse)
async def read_users_me(current_user: User = Depends(get_current_user)):
    return current_user