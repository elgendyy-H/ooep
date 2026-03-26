#!/bin/bash
set -e
if [ -z "$1" ]; then echo "Usage: $0 <backup.tar.gz>"; exit 1; fi
BACKUP_FILE=$1
RESTORE_DIR="/tmp/oepp-restore-$(date +%Y%m%d_%H%M%S)"
mkdir -p $RESTORE_DIR
tar -xzf $BACKUP_FILE -C $RESTORE_DIR
docker-compose down
docker-compose up -d postgres
sleep 10
docker-compose exec -T postgres psql -U oepp -c "DROP DATABASE IF EXISTS oepp;"
docker-compose exec -T postgres psql -U oepp -c "CREATE DATABASE oepp;"
docker-compose exec -T postgres psql -U oepp oepp < $RESTORE_DIR/database.sql
docker cp $RESTORE_DIR/redis.rdb $(docker-compose ps -q redis):/data/dump.rdb
docker-compose restart redis
cp $RESTORE_DIR/.env .
cp $RESTORE_DIR/docker-compose.yml .
tar -xzf $RESTORE_DIR/data.tar.gz -C . 2>/dev/null || true
docker-compose up -d
rm -rf $RESTORE_DIR
echo "Restore completed"
