import os
import json
from datetime import datetime
from sqlalchemy.orm import Session
from ..models import Report, Scan, Finding
from ..schemas import ReportRequest
import uuid

class ReportService:
    def __init__(self, db: Session):
        self.db = db
        self.reports_dir = "data/reports"
        os.makedirs(self.reports_dir, exist_ok=True)

    def generate_report(self, request: ReportRequest, user_id: int):
        # For demo, we'll create a dummy report record
        report_id = str(uuid.uuid4())[:8]
        report_path = f"{self.reports_dir}/{report_id}.{request.report_type}"
        # In real implementation, generate actual content
        with open(report_path, 'w') as f:
            f.write(f"Report for scans {request.scan_ids} in {request.report_type} format")
        db_report = Report(
            user_id=user_id,
            scan_ids=request.scan_ids,
            format=request.report_type,
            path=report_path,
            generated_at=datetime.utcnow()
        )
        self.db.add(db_report)
        self.db.commit()
        self.db.refresh(db_report)
        return {"id": db_report.id, "status": "completed", "format": request.report_type, "url": f"/reports/{db_report.id}/download?format={request.report_type}"}

    def get_report_file(self, report_id: int, format: str):
        report = self.db.query(Report).filter(Report.id == report_id).first()
        if not report:
            return None
        if os.path.exists(report.path):
            with open(report.path, 'rb') as f:
                return f.read()
        return None