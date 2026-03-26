#!/bin/bash
set -e
echo "Checking services..."
docker-compose ps | grep -q "Up" || { echo "ERROR: Some services down"; exit 1; }
docker-compose exec -T postgres pg_isready -U oepp || { echo "ERROR: Database not ready"; exit 1; }
docker-compose exec -T redis redis-cli ping | grep -q PONG || { echo "ERROR: Redis not ready"; exit 1; }
curl -f http://localhost:8000/health > /dev/null || { echo "ERROR: Backend not responding"; exit 1; }
curl -f http://localhost:3000 > /dev/null || { echo "ERROR: Frontend not responding"; exit 1; }
echo "All services healthy."
