from pydantic import BaseModel, Field, HttpUrl, EmailStr
from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum

class UserRole(str, Enum):
    ADMIN = "admin"
    USER = "user"
    AUDITOR = "auditor"

class ScanStatus(str, Enum):
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"

class FindingSeverity(str, Enum):
    CRITICAL = "critical"
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"
    INFO = "info"

class UserBase(BaseModel):
    email: EmailStr
    username: str = Field(..., min_length=3, max_length=50)
    full_name: str = Field(..., min_length=1, max_length=100)

class UserCreate(UserBase):
    password: str = Field(..., min_length=8)
    role: UserRole = UserRole.USER

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(UserBase):
    id: int
    role: UserRole
    is_active: bool
    created_at: datetime
    class Config: orm_mode = True

class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    email: Optional[EmailStr] = None

class PasswordChange(BaseModel):
    current_password: str
    new_password: str
    confirm_password: str

class PreferencesUpdate(BaseModel):
    dark_mode: bool = True
    email_notifications: bool = True
    auto_report: bool = False

class TargetBase(BaseModel):
    url: HttpUrl
    name: str = Field(..., min_length=1, max_length=100)
    description: Optional[str] = None

class TargetCreate(TargetBase):
    pass

class TargetResponse(TargetBase):
    id: int
    owner_id: int
    created_at: datetime
    is_active: bool
    class Config: orm_mode = True

class ScanBase(BaseModel):
    target_url: HttpUrl
    scan_type: str = Field(..., min_length=1, max_length=50)
    modules: Optional[List[str]] = None
    config: Optional[Dict[str, Any]] = None

class ScanCreate(ScanBase):
    pass

class ScanResponse(ScanBase):
    id: int
    owner_id: int
    status: ScanStatus
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    findings_count: int
    critical_findings: int
    high_findings: int
    class Config: orm_mode = True

class FindingBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=200)
    description: str
    severity: FindingSeverity
    location: Optional[str] = None
    remediation: Optional[str] = None

class FindingCreate(FindingBase):
    pass

class FindingUpdate(BaseModel):
    status: Optional[str] = None

class FindingResponse(FindingBase):
    id: int
    scan_id: int
    cvss_score: Optional[str] = None
    references: Optional[str] = None
    status: str
    created_at: datetime
    updated_at: datetime
    class Config: orm_mode = True

class ReportRequest(BaseModel):
    scan_ids: List[int]
    report_type: str = Field(..., regex="^(pdf|html|json)$")
    include_charts: bool = True
    custom_template: Optional[str] = None

class ReportResponse(BaseModel):
    id: int
    scan_ids: List[int]
    format: str
    generated_at: datetime
    class Config: orm_mode = True

class ComplianceCheckRequest(BaseModel):
    framework: str = Field(..., regex="^(pci_dss|hipaa|gdpr|iso27001|nist|soc2)$")
    targets: List[str]
    scope: Optional[str] = None

class ScheduleBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    cron_expression: str = Field(..., min_length=1, max_length=100)
    scan_config: Dict[str, Any]
    is_active: bool = True

class ScheduleCreate(ScheduleBase):
    pass

class ScheduleResponse(ScheduleBase):
    id: int
    owner_id: int
    created_at: datetime
    last_run: Optional[datetime] = None
    next_run: Optional[datetime] = None
    class Config: orm_mode = True

class IntegrationConfig(BaseModel):
    config_data: Dict[str, Any]
    is_active: bool = True

class IntegrationResponse(BaseModel):
    id: int
    service_name: str
    config: Dict[str, Any]
    is_active: bool
    class Config: orm_mode = True

class DashboardStats(BaseModel):
    total_scans: int
    total_targets: int
    critical_findings: int
    high_findings: int
    medium_findings: int
    low_findings: int
    compliance_score: float
    active_users: int
    recent_activity: List[Dict[str, Any]]