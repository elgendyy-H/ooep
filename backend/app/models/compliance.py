from sqlalchemy import Column, Integer, String, Text, ForeignKey, DateTime, Float, JSON
from sqlalchemy.sql import func
from ..database import Base

class ComplianceCheck(Base):
    __tablename__ = "compliance_checks"
    id = Column(Integer, primary_key=True, index=True)
    framework = Column(String, nullable=False)
    target_id = Column(Integer, ForeignKey("targets.id"))
    result = Column(JSON)
    score = Column(Float)
    passed = Column(Integer, default=0)
    failed = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())