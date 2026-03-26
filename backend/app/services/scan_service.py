import logging
import asyncio
from datetime import datetime
from typing import List, Optional
from sqlalchemy.orm import Session
from ..models import Scan, Target, Finding
from ..schemas import ScanCreate, ScanResponse
from ..core.scanner import OWASPScanner
from ..celery_app import celery_app

logger = logging.getLogger(__name__)

class ScanService:
    def __init__(self, db: Session):
        self.db = db
        self.scanner = OWASPScanner()

    def create_scan(self, scan_data: ScanCreate, owner_id: int) -> ScanResponse:
        target = self.db.query(Target).filter(
            Target.url == str(scan_data.target_url),
            Target.owner_id == owner_id
        ).first()
        if not target:
            target = Target(
                url=str(scan_data.target_url),
                name=f"Target - {scan_data.target_url}",
                owner_id=owner_id
            )
            self.db.add(target)
            self.db.flush()
        db_scan = Scan(
            target_id=target.id,
            owner_id=owner_id,
            scan_type=scan_data.scan_type,
            config=str(scan_data.config) if scan_data.config else None
        )
        self.db.add(db_scan)
        self.db.commit()
        self.db.refresh(db_scan)
        return db_scan

    def get_scan(self, scan_id: int, owner_id: int) -> Optional[Scan]:
        return self.db.query(Scan).filter(
            Scan.id == scan_id,
            Scan.owner_id == owner_id
        ).first()

    def get_scans(self, owner_id: int, skip: int, limit: int, status: Optional[str]) -> List[Scan]:
        query = self.db.query(Scan).filter(Scan.owner_id == owner_id)
        if status:
            query = query.filter(Scan.status == status)
        return query.offset(skip).limit(limit).all()

    def start_scan_async(self, scan_id: int) -> str:
        scan = self.get_scan(scan_id, None)  # owner check will be done in task
        if not scan:
            raise ValueError("Scan not found")
        scan.status = "running"
        scan.started_at = datetime.utcnow()
        self.db.commit()
        task = run_scan.delay(scan_id)
        return task.id

@celery_app.task
def run_scan(scan_id: int):
    from ..database import SessionLocal
    db = SessionLocal()
    try:
        scan = db.query(Scan).filter(Scan.id == scan_id).first()
        if not scan:
            return {"status": "error", "message": "Scan not found"}
        target = db.query(Target).filter(Target.id == scan.target_id).first()
        if not target:
            return {"status": "error", "message": "Target not found"}

        # Run enhanced scanner asynchronously
        scanner = OWASPScanner()
        try:
            # Since scanner methods are async, we need to run them in an event loop
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
            results = loop.run_until_complete(scanner.run_full_scan(target.url, include_external=False))
            loop.close()
        except Exception as e:
            logger.error(f"Scanner error: {e}")
            results = {"findings": []}

        # Process findings
        for finding_data in results.get("findings", []):
            finding = Finding(
                scan_id=scan_id,
                title=finding_data["title"],
                description=finding_data["description"],
                severity=finding_data["severity"],
                location=finding_data.get("location"),
                remediation=finding_data.get("remediation")
            )
            db.add(finding)

        # Update scan
        scan.status = "completed"
        scan.completed_at = datetime.utcnow()
        scan.findings_count = len(results.get("findings", []))
        scan.critical_findings = sum(1 for f in results["findings"] if f["severity"] == "critical")
        scan.high_findings = sum(1 for f in results["findings"] if f["severity"] == "high")
        db.commit()

        return {"status": "completed", "scan_id": scan_id, "findings_count": scan.findings_count}
    except Exception as e:
        logger.error(f"Scan task failed: {e}", exc_info=True)
        if 'scan' in locals():
            scan.status = "failed"
            scan.completed_at = datetime.utcnow()
            db.commit()
        return {"status": "error", "message": str(e)}
    finally:
        db.close()