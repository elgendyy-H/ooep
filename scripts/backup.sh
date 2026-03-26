#!/bin/bash
set -e
BACKUP_DIR="/backups/oepp-$(date +%Y%m%d_%H%M%S)"
mkdir -p $BACKUP_DIR
docker-compose exec -T postgres pg_dump -U oepp oepp > $BACKUP_DIR/database.sql
docker cp $(docker-compose ps -q redis):/data/dump.rdb $BACKUP_DIR/redis.rdb
cp .env $BACKUP_DIR/
cp docker-compose.yml $BACKUP_DIR/
tar -czf $BACKUP_DIR.tar.gz -C $BACKUP_DIR .
rm -rf $BACKUP_DIR
echo "Backup created: $BACKUP_DIR.tar.gz"
