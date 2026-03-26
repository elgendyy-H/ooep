#!/bin/bash
set -e
echo "Updating OEPP..."
./scripts/backup.sh
git pull origin main
docker-compose build --no-cache
docker-compose exec backend alembic upgrade head
docker-compose down
docker-compose up -d
docker-compose exec redis redis-cli FLUSHALL
echo "Update completed."
