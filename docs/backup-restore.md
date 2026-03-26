
---

### 140. `docs/backup-restore.md`
```markdown
# Backup and Restore

## Automated Backups (Docker)

A backup service (`offen/docker-volume-backup`) runs daily at 2 AM. It saves:

- PostgreSQL dump (`database.sql`)
- Redis dump (`redis.rdb`)
- Environment configuration (`.env`, `docker-compose.yml`)
- Data volume (`data.tar.gz`)

### Configuration

Edit `.env` to set backup options:

```bash
BACKUP_CRON_EXPRESSION="0 2 * * *"
BACKUP_RETENTION_DAYS=7