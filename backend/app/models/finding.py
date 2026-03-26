from sqlalchemy import Column, Integer, String, Text, ForeignKey, DateTime, Enum
from sqlalchemy.sql import func
from ..database import Base
import enum

class FindingSeverity(str, enum.Enum):
    CRITICAL = "critical"
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"
    INFO = "info"

class Finding(Base):
    __tablename__ = "findings"
    id = Column(Integer, primary_key=True, index=True)
    scan_id = Column(Integer, ForeignKey("scans.id"))
    title = Column(String, nullable=False)
    description = Column(Text)
    severity = Column(Enum(FindingSeverity), nullable=False)
    cvss_score = Column(String, nullable=True)
    location = Column(String, nullable=True)
    remediation = Column(Text, nullable=True)
    references = Column(Text, nullable=True)
    raw_data = Column(Text, nullable=True)
    status = Column(String, default="open")
    assigned_to = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())