#!/usr/bin/env python3
"""
Add performance indexes to the database.
Run after migrations.
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database import engine
from sqlalchemy import text

def main():
    with engine.connect() as conn:
        # Findings indexes
        conn.execute(text("CREATE INDEX IF NOT EXISTS idx_findings_scan_id ON findings(scan_id)"))
        conn.execute(text("CREATE INDEX IF NOT EXISTS idx_findings_severity ON findings(severity)"))
        conn.execute(text("CREATE INDEX IF NOT EXISTS idx_findings_status ON findings(status)"))
        conn.execute(text("CREATE INDEX IF NOT EXISTS idx_findings_created_at ON findings(created_at)"))

        # Scans indexes
        conn.execute(text("CREATE INDEX IF NOT EXISTS idx_scans_owner_id ON scans(owner_id)"))
        conn.execute(text("CREATE INDEX IF NOT EXISTS idx_scans_status ON scans(status)"))
        conn.execute(text("CREATE INDEX IF NOT EXISTS idx_scans_created_at ON scans(created_at)"))

        # Targets indexes
        conn.execute(text("CREATE INDEX IF NOT EXISTS idx_targets_owner_id ON targets(owner_id)"))
        conn.execute(text("CREATE INDEX IF NOT EXISTS idx_targets_created_at ON targets(created_at)"))

        # Users indexes
        conn.execute(text("CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)"))
        conn.execute(text("CREATE INDEX IF NOT EXISTS idx_users_username ON users(username)"))

        conn.commit()
        print("Indexes created successfully.")

if __name__ == "__main__":
    main()