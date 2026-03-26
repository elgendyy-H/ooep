from sqlalchemy import Column, Integer, String, Text, ForeignKey, DateTime, JSON
from sqlalchemy.sql import func
from ..database import Base

class Report(Base):
    __tablename__ = "reports"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    scan_ids = Column(JSON)
    format = Column(String, nullable=False)
    path = Column(String, nullable=False)
    generated_at = Column(DateTime(timezone=True), server_default=func.now())